import { db } from './db.js';
import { formatOrdinal } from './grading.js';

/**
 * Calculates and updates student rankings within a class (and arm) for a given session and term.
 * Ranking formula: Total Student Score = Sum of all subject totals.
 * Handles ties by assigning equal positions (standard competition ranking: 1st, 2nd, 2nd, 4th...).
 */
export function recomputeClassRankings(classId, arm, termId, sessionId) {
  // 1. Get all students enrolled in this class & arm
  let studentQuery = `SELECT * FROM students WHERE class_id = ? AND status = 'active'`;
  const params = [classId];
  if (arm && arm !== 'ALL') {
    studentQuery += ` AND arm = ?`;
    params.push(arm);
  }
  const students = db.prepare(studentQuery).all(...params);
  if (students.length === 0) return [];

  // 2. Fetch subject count & max possible score for this class
  const classSubjects = db.prepare(`
    SELECT cs.*, s.name as subject_name 
    FROM class_subjects cs 
    JOIN subjects s ON s.id = cs.subject_id 
    WHERE cs.class_id = ?
  `).all(classId);

  const totalClassSubjectsCount = classSubjects.length || 1;
  const maxScorePerSubject = 100; // default 10 + 20 + 70

  // 3. Aggregate each student's total score
  const studentTotals = students.map(student => {
    const scores = db.prepare(`
      SELECT 
        assignment_score, test_score, exam_score, total_score, grade, remark, subject_id
      FROM scores
      WHERE student_id = ? AND term_id = ? AND session_id = ?
    `).all(student.id, termId, sessionId);

    const sumTotal = scores.reduce((acc, curr) => acc + (Number(curr.total_score) || 0), 0);
    const subjectsTaken = scores.length;
    const maxPossible = (subjectsTaken > 0 ? subjectsTaken : totalClassSubjectsCount) * maxScorePerSubject;
    const averageScore = subjectsTaken > 0 ? Number((sumTotal / subjectsTaken).toFixed(2)) : 0;

    return {
      student_id: student.id,
      student_name: `${student.last_name} ${student.first_name} ${student.middle_name || ''}`.trim(),
      admission_no: student.admission_no,
      gender: student.gender,
      photo: student.photo,
      class_id: classId,
      arm: student.arm,
      scores_count: subjectsTaken,
      total_score: Number(sumTotal.toFixed(1)),
      max_possible_score: maxPossible,
      average_score: averageScore,
    };
  });

  // 4. Sort descending by total score
  studentTotals.sort((a, b) => b.total_score - a.total_score);

  // 5. Assign positions with tie handling
  let currentPosition = 1;
  const rankedStudents = studentTotals.map((item, index, arr) => {
    if (index > 0) {
      const prev = arr[index - 1];
      if (item.total_score < prev.total_score) {
        currentPosition = index + 1;
      }
    }

    const tiedCount = arr.filter(x => x.total_score === item.total_score).length;
    const isTied = tiedCount > 1;

    return {
      ...item,
      position: currentPosition,
      position_str: `${formatOrdinal(currentPosition)} Position${isTied ? ' (Tied)' : ''}`,
      total_students: arr.length,
      isTied,
    };
  });

  // 6. Save or update report_cards table with computed rankings & aggregates
  const upsertReportCard = db.prepare(`
    INSERT INTO report_cards (
      student_id, class_id, arm, term_id, session_id,
      total_score, max_possible_score, average_score, position, total_students
    ) VALUES (
      @student_id, @class_id, @arm, @term_id, @session_id,
      @total_score, @max_possible_score, @average_score, @position, @total_students
    )
    ON CONFLICT(student_id, term_id, session_id) DO UPDATE SET
      total_score = excluded.total_score,
      max_possible_score = excluded.max_possible_score,
      average_score = excluded.average_score,
      position = excluded.position,
      total_students = excluded.total_students
  `);

  const runUpserts = db.transaction((list) => {
    for (const r of list) {
      upsertReportCard.run({
        student_id: r.student_id,
        class_id: r.class_id,
        arm: r.arm,
        term_id: termId,
        session_id: sessionId,
        total_score: r.total_score,
        max_possible_score: r.max_possible_score,
        average_score: r.average_score,
        position: r.position,
        total_students: r.total_students,
      });
    }
  });

  runUpserts(rankedStudents);

  return rankedStudents;
}

/**
 * Computes subject-level analytics (Highest in class, Lowest in class, Average in class, and Subject Ranking)
 */
export function getSubjectStatsAndRankings(classId, arm, termId, sessionId) {
  let query = `
    SELECT 
      sc.*, s.first_name, s.last_name, s.admission_no, sub.name as subject_name, sub.code as subject_code
    FROM scores sc
    JOIN students s ON s.id = sc.student_id
    JOIN subjects sub ON sub.id = sc.subject_id
    WHERE sc.class_id = ? AND sc.term_id = ? AND sc.session_id = ?
  `;
  const params = [classId, termId, sessionId];
  if (arm && arm !== 'ALL') {
    query += ` AND sc.arm = ?`;
    params.push(arm);
  }
  const allScores = db.prepare(query).all(...params);

  // Group by subject_id
  const bySubject = {};
  for (const score of allScores) {
    if (!bySubject[score.subject_id]) {
      bySubject[score.subject_id] = {
        subject_id: score.subject_id,
        subject_name: score.subject_name,
        subject_code: score.subject_code,
        scores: [],
      };
    }
    bySubject[score.subject_id].scores.push(score);
  }

  // Calculate statistics per subject
  const subjectSummary = {};
  for (const subId in bySubject) {
    const list = bySubject[subId].scores;
    const totals = list.map(x => Number(x.total_score) || 0);
    const highest = Math.max(...totals, 0);
    const lowest = Math.min(...totals, 0);
    const sum = totals.reduce((a, b) => a + b, 0);
    const avg = totals.length > 0 ? Number((sum / totals.length).toFixed(1)) : 0;

    // Rank within subject
    list.sort((a, b) => (Number(b.total_score) || 0) - (Number(a.total_score) || 0));
    let rank = 1;
    const rankedList = list.map((item, idx, arr) => {
      if (idx > 0 && item.total_score < arr[idx - 1].total_score) {
        rank = idx + 1;
      }
      return {
        ...item,
        subject_position: rank,
        subject_position_str: formatOrdinal(rank),
      };
    });

    subjectSummary[subId] = {
      highest,
      lowest,
      average: avg,
      count: totals.length,
      rankedScores: rankedList,
    };
  }

  return subjectSummary;
}
