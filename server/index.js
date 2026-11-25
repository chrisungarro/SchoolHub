import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db.js';
import { calculateGrade, formatOrdinal } from './grading.js';
import { recomputeClassRankings, getSubjectStatsAndRankings } from './ranking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads (Excel import & photos)
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// -------------------------------------------------------------
// 1. AUTH & ROLES
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE username = ? AND password = ?`).get(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // If role is Parent, fetch linked student
  let student = null;
  if (user.student_id) {
    student = db.prepare(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      JOIN classes c ON c.id = s.class_id 
      WHERE s.id = ?
    `).get(user.student_id);
  }

  // If role is Teacher, fetch teacher profile
  let teacher = null;
  if (user.teacher_id) {
    teacher = db.prepare(`
      SELECT t.*, c.name as class_name 
      FROM teachers t 
      LEFT JOIN classes c ON c.id = t.assigned_class_id 
      WHERE t.id = ?
    `).get(user.teacher_id);
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      student,
      teacher,
    }
  });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { role } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE role = ? LIMIT 1`).get(role);
  if (!user) {
    return res.status(404).json({ error: `No demo user found for role ${role}` });
  }

  let student = null;
  if (user.student_id) {
    student = db.prepare(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      JOIN classes c ON c.id = s.class_id 
      WHERE s.id = ?
    `).get(user.student_id);
  }

  let teacher = null;
  if (user.teacher_id) {
    teacher = db.prepare(`
      SELECT t.*, c.name as class_name 
      FROM teachers t 
      LEFT JOIN classes c ON c.id = t.assigned_class_id 
      WHERE t.id = ?
    `).get(user.teacher_id);
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      student,
      teacher,
    }
  });
});

// -------------------------------------------------------------
// 2. SESSIONS, TERMS, CLASSES, SUBJECTS
// -------------------------------------------------------------
app.get('/api/sessions', (req, res) => {
  const sessions = db.prepare(`SELECT * FROM sessions ORDER BY id DESC`).all();
  res.json(sessions);
});

app.get('/api/terms', (req, res) => {
  const { session_id } = req.query;
  let query = `SELECT * FROM terms`;
  const params = [];
  if (session_id) {
    query += ` WHERE session_id = ?`;
    params.push(session_id);
  }
  query += ` ORDER BY id ASC`;
  const terms = db.prepare(query).all(...params);
  res.json(terms);
});

app.get('/api/classes', (req, res) => {
  const classes = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.status = 'active') as student_count
    FROM classes c 
    ORDER BY c.order_index ASC
  `).all();
  res.json(classes);
});

app.post('/api/classes', (req, res) => {
  const { name, section, order_index, arms } = req.body;
  const result = db.prepare(`
    INSERT INTO classes (name, section, order_index, arms)
    VALUES (?, ?, ?, ?)
  `).run(name, section || 'Junior Secondary', order_index || 1, arms || 'A,B');
  res.json({ success: true, id: result.lastInsertRowid });
});

app.get('/api/subjects', (req, res) => {
  const subjects = db.prepare(`SELECT * FROM subjects ORDER BY name ASC`).all();
  res.json(subjects);
});

app.post('/api/subjects', (req, res) => {
  const { code, name, category } = req.body;
  const result = db.prepare(`
    INSERT INTO subjects (code, name, category)
    VALUES (?, ?, ?)
  `).run(code.toUpperCase(), name, category || 'General');
  res.json({ success: true, id: result.lastInsertRowid });
});

// Class Subjects
app.get('/api/classes/:classId/subjects', (req, res) => {
  const { classId } = req.params;
  const list = db.prepare(`
    SELECT cs.*, s.code, s.name, s.category
    FROM class_subjects cs
    JOIN subjects s ON s.id = cs.subject_id
    WHERE cs.class_id = ?
    ORDER BY s.name ASC
  `).all(classId);
  res.json(list);
});

app.post('/api/classes/:classId/subjects', (req, res) => {
  const { classId } = req.params;
  const { subject_id, max_assignment = 10, max_test = 20, max_exam = 70 } = req.body;

  db.prepare(`
    INSERT INTO class_subjects (class_id, subject_id, max_assignment, max_test, max_exam)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(class_id, subject_id) DO UPDATE SET
      max_assignment = excluded.max_assignment,
      max_test = excluded.max_test,
      max_exam = excluded.max_exam
  `).run(classId, subject_id, max_assignment, max_test, max_exam);

  res.json({ success: true });
});

app.delete('/api/classes/:classId/subjects/:subjectId', (req, res) => {
  const { classId, subjectId } = req.params;
  db.prepare(`DELETE FROM class_subjects WHERE class_id = ? AND subject_id = ?`).run(classId, subjectId);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 3. STUDENT MANAGEMENT (Registration, Promotion, Photos)
// -------------------------------------------------------------
app.get('/api/students', (req, res) => {
  const { class_id, arm, status = 'active', search } = req.query;
  let query = `
    SELECT s.*, c.name as class_name, c.section as class_section
    FROM students s
    JOIN classes c ON c.id = s.class_id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    query += ` AND s.status = ?`;
    params.push(status);
  }
  if (class_id) {
    query += ` AND s.class_id = ?`;
    params.push(class_id);
  }
  if (arm && arm !== 'ALL') {
    query += ` AND s.arm = ?`;
    params.push(arm);
  }
  if (search) {
    query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.admission_no LIKE ?)`;
    const sTerm = `%${search}%`;
    params.push(sTerm, sTerm, sTerm, sTerm);
  }

  query += ` ORDER BY s.last_name ASC, s.first_name ASC`;
  const students = db.prepare(query).all(...params);
  res.json(students);
});

app.get('/api/students/:id', (req, res) => {
  const student = db.prepare(`
    SELECT s.*, c.name as class_name, c.section as class_section
    FROM students s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

app.post('/api/students', (req, res) => {
  const {
    student_id, admission_no, first_name, last_name, middle_name,
    gender, dob, class_id, arm = 'A', photo,
    parent_name, parent_phone, parent_email, parent_address
  } = req.body;

  // Auto-generate student_id / admission_no if not provided
  const currentCount = db.prepare(`SELECT COUNT(*) as count FROM students`).get().count + 1;
  const sId = student_id || `STU/2026/${String(currentCount).padStart(3, '0')}`;
  const admNo = admission_no || `ADM-2026-${String(currentCount).padStart(3, '0')}`;

  try {
    const result = db.prepare(`
      INSERT INTO students (
        student_id, admission_no, first_name, last_name, middle_name,
        gender, dob, class_id, arm, photo,
        parent_name, parent_phone, parent_email, parent_address, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      sId, admNo, first_name, last_name, middle_name || '',
      gender, dob || '2014-01-01', class_id, arm, photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      parent_name || '', parent_phone || '', parent_email || '', parent_address || ''
    );

    res.json({ success: true, id: result.lastInsertRowid, student_id: sId, admission_no: admNo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const {
    admission_no, first_name, last_name, middle_name,
    gender, dob, class_id, arm, photo,
    parent_name, parent_phone, parent_email, parent_address, status
  } = req.body;

  try {
    db.prepare(`
      UPDATE students SET
        admission_no = coalesce(?, admission_no),
        first_name = coalesce(?, first_name),
        last_name = coalesce(?, last_name),
        middle_name = coalesce(?, middle_name),
        gender = coalesce(?, gender),
        dob = coalesce(?, dob),
        class_id = coalesce(?, class_id),
        arm = coalesce(?, arm),
        photo = coalesce(?, photo),
        parent_name = coalesce(?, parent_name),
        parent_phone = coalesce(?, parent_phone),
        parent_email = coalesce(?, parent_email),
        parent_address = coalesce(?, parent_address),
        status = coalesce(?, status)
      WHERE id = ?
    `).run(
      admission_no, first_name, last_name, middle_name,
      gender, dob, class_id, arm, photo,
      parent_name, parent_phone, parent_email, parent_address, status,
      id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Student Promotion Endpoint
app.post('/api/students/promote', (req, res) => {
  const { student_ids, target_class_id, target_arm } = req.body;
  if (!student_ids || !Array.isArray(student_ids) || !target_class_id) {
    return res.status(400).json({ error: 'student_ids array and target_class_id are required' });
  }

  const updateStmt = db.prepare(`
    UPDATE students SET 
      class_id = ?, 
      arm = COALESCE(?, arm) 
    WHERE id = ?
  `);

  const promoteMany = db.transaction((ids) => {
    for (const sid of ids) {
      updateStmt.run(target_class_id, target_arm || null, sid);
    }
  });

  promoteMany(student_ids);
  res.json({ success: true, count: student_ids.length });
});

// -------------------------------------------------------------
// 4. SCORE ENTRY & IMPORT / EXPORT
// -------------------------------------------------------------
// Get scores matrix for class, arm, subject, term, session
app.get('/api/scores', (req, res) => {
  const { class_id, arm, subject_id, term_id, session_id } = req.query;

  if (!class_id || !subject_id || !term_id || !session_id) {
    return res.status(400).json({ error: 'class_id, subject_id, term_id, and session_id are required' });
  }

  // Fetch all students in this class and arm
  let studentQuery = `SELECT id, student_id, admission_no, first_name, last_name, arm, photo FROM students WHERE class_id = ? AND status = 'active'`;
  const params = [class_id];
  if (arm && arm !== 'ALL') {
    studentQuery += ` AND arm = ?`;
    params.push(arm);
  }
  studentQuery += ` ORDER BY last_name ASC, first_name ASC`;
  const students = db.prepare(studentQuery).all(...params);

  // Fetch existing scores for this subject, term, session
  const scores = db.prepare(`
    SELECT * FROM scores
    WHERE class_id = ? AND subject_id = ? AND term_id = ? AND session_id = ?
  `).all(class_id, subject_id, term_id, session_id);

  const scoreMap = {};
  for (const s of scores) {
    scoreMap[s.student_id] = s;
  }

  // Combine
  const rows = students.map(student => {
    const sc = scoreMap[student.id] || {
      assignment_score: 0,
      test_score: 0,
      exam_score: 0,
      total_score: 0,
      percentage: 0,
      grade: 'F',
      remark: 'Fail',
    };
    return {
      student_id: student.id,
      student_code: student.student_id,
      admission_no: student.admission_no,
      student_name: `${student.last_name} ${student.first_name}`.trim(),
      arm: student.arm,
      photo: student.photo,
      assignment_score: sc.assignment_score || 0,
      test_score: sc.test_score || 0,
      exam_score: sc.exam_score || 0,
      total_score: sc.total_score || 0,
      percentage: sc.percentage || 0,
      grade: sc.grade || 'F',
      remark: sc.remark || 'Fail',
      score_id: sc.id || null,
    };
  });

  res.json(rows);
});

// Save scores batch
app.post('/api/scores/batch', (req, res) => {
  const { class_id, arm, subject_id, term_id, session_id, scores, entered_by = 'Teacher' } = req.body;

  if (!scores || !Array.isArray(scores)) {
    return res.status(400).json({ error: 'scores array is required' });
  }

  const upsertScore = db.prepare(`
    INSERT INTO scores (
      student_id, subject_id, class_id, arm, term_id, session_id,
      assignment_score, test_score, exam_score, total_score, percentage,
      grade, remark, entered_by, updated_at
    ) VALUES (
      @student_id, @subject_id, @class_id, @arm, @term_id, @session_id,
      @assignment_score, @test_score, @exam_score, @total_score, @percentage,
      @grade, @remark, @entered_by, CURRENT_TIMESTAMP
    )
    ON CONFLICT(student_id, subject_id, term_id, session_id) DO UPDATE SET
      assignment_score = excluded.assignment_score,
      test_score = excluded.test_score,
      exam_score = excluded.exam_score,
      total_score = excluded.total_score,
      percentage = excluded.percentage,
      grade = excluded.grade,
      remark = excluded.remark,
      entered_by = excluded.entered_by,
      updated_at = CURRENT_TIMESTAMP
  `);

  const saveAll = db.transaction((list) => {
    for (const item of list) {
      const ca = Math.min(10, Math.max(0, Number(item.assignment_score) || 0));
      const test = Math.min(20, Math.max(0, Number(item.test_score) || 0));
      const exam = Math.min(70, Math.max(0, Number(item.exam_score) || 0));
      const total = Number((ca + test + exam).toFixed(1));
      const percentage = total;
      const { grade, remark } = calculateGrade(total);

      upsertScore.run({
        student_id: item.student_id,
        subject_id,
        class_id,
        arm: item.arm || arm || 'A',
        term_id,
        session_id,
        assignment_score: ca,
        test_score: test,
        exam_score: exam,
        total_score: total,
        percentage,
        grade,
        remark,
        entered_by,
      });
    }
  });

  saveAll(scores);

  // Automatically trigger ranking recomputation for the class
  try {
    recomputeClassRankings(class_id, arm || 'A', term_id, session_id);
    if (arm && arm !== 'A') {
      recomputeClassRankings(class_id, arm, term_id, session_id);
    }
  } catch (err) {
    console.error('Error recomputing rankings:', err);
  }

  res.json({ success: true, count: scores.length });
});

// Excel Export Template / Scores for subject
app.get('/api/scores/export-excel', (req, res) => {
  const { class_id, arm, subject_id, term_id, session_id } = req.query;

  const subject = db.prepare(`SELECT * FROM subjects WHERE id = ?`).get(subject_id);
  const classItem = db.prepare(`SELECT * FROM classes WHERE id = ?`).get(class_id);

  let studentQuery = `SELECT id, student_id, admission_no, first_name, last_name, arm FROM students WHERE class_id = ? AND status = 'active'`;
  const params = [class_id];
  if (arm && arm !== 'ALL') {
    studentQuery += ` AND arm = ?`;
    params.push(arm);
  }
  studentQuery += ` ORDER BY last_name ASC, first_name ASC`;
  const students = db.prepare(studentQuery).all(...params);

  const existingScores = db.prepare(`
    SELECT * FROM scores WHERE class_id = ? AND subject_id = ? AND term_id = ? AND session_id = ?
  `).all(class_id, subject_id, term_id, session_id);

  const scoreMap = {};
  for (const s of existingScores) scoreMap[s.student_id] = s;

  const excelData = students.map(st => {
    const sc = scoreMap[st.id] || {};
    return {
      'Student ID': st.student_id,
      'Admission No': st.admission_no,
      'Student Name': `${st.last_name} ${st.first_name}`,
      'Arm': st.arm,
      'Assignment (Max 10)': sc.assignment_score ?? 0,
      'Test (Max 20)': sc.test_score ?? 0,
      'Exam (Max 70)': sc.exam_score ?? 0,
      'Total (Max 100)': sc.total_score ?? 0,
      'Grade': sc.grade ?? 'F',
      'Remark': sc.remark ?? 'Fail'
    };
  });

  const ws = xlsx.utils.json_to_sheet(excelData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Scores');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const filename = `${classItem?.name || 'Class'}_${subject?.code || 'Subject'}_Scores.xlsx`.replace(/\s+/g, '_');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

// Excel Import Scores
app.post('/api/scores/import-excel', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Excel file is required' });
  }

  const { class_id, arm, subject_id, term_id, session_id } = req.body;
  if (!class_id || !subject_id || !term_id || !session_id) {
    return res.status(400).json({ error: 'class_id, subject_id, term_id, session_id are required' });
  }

  try {
    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

    let importedCount = 0;
    const upsertScore = db.prepare(`
      INSERT INTO scores (
        student_id, subject_id, class_id, arm, term_id, session_id,
        assignment_score, test_score, exam_score, total_score, percentage,
        grade, remark, entered_by, updated_at
      ) VALUES (
        @student_id, @subject_id, @class_id, @arm, @term_id, @session_id,
        @assignment_score, @test_score, @exam_score, @total_score, @percentage,
        @grade, @remark, 'Excel Import', CURRENT_TIMESTAMP
      )
      ON CONFLICT(student_id, subject_id, term_id, session_id) DO UPDATE SET
        assignment_score = excluded.assignment_score,
        test_score = excluded.test_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        percentage = excluded.percentage,
        grade = excluded.grade,
        remark = excluded.remark,
        entered_by = 'Excel Import',
        updated_at = CURRENT_TIMESTAMP
    `);

    const runImport = db.transaction(() => {
      for (const row of rawRows) {
        const studentCode = row['Student ID'] || row['student_id'];
        const admNo = row['Admission No'] || row['admission_no'];

        let student = null;
        if (studentCode) {
          student = db.prepare(`SELECT * FROM students WHERE student_id = ?`).get(studentCode);
        }
        if (!student && admNo) {
          student = db.prepare(`SELECT * FROM students WHERE admission_no = ?`).get(admNo);
        }

        if (student) {
          const ca = Math.min(10, Math.max(0, Number(row['Assignment (Max 10)'] || row['assignment'] || row['Assignment']) || 0));
          const test = Math.min(20, Math.max(0, Number(row['Test (Max 20)'] || row['test'] || row['Test']) || 0));
          const exam = Math.min(70, Math.max(0, Number(row['Exam (Max 70)'] || row['exam'] || row['Exam']) || 0));
          const total = Number((ca + test + exam).toFixed(1));
          const { grade, remark } = calculateGrade(total);

          upsertScore.run({
            student_id: student.id,
            subject_id: Number(subject_id),
            class_id: Number(class_id),
            arm: student.arm || arm || 'A',
            term_id: Number(term_id),
            session_id: Number(session_id),
            assignment_score: ca,
            test_score: test,
            exam_score: exam,
            total_score: total,
            percentage: total,
            grade,
            remark,
          });
          importedCount++;
        }
      }
    });

    runImport();

    // Recompute rankings
    recomputeClassRankings(Number(class_id), arm || 'A', Number(term_id), Number(session_id));

    res.json({ success: true, importedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process Excel file: ' + err.message });
  }
});

// -------------------------------------------------------------
// 5. STUDENT RANKINGS & LEADERBOARD
// -------------------------------------------------------------
app.get('/api/rankings', (req, res) => {
  const { class_id, arm, term_id, session_id } = req.query;
  if (!class_id) {
    return res.status(400).json({ error: 'class_id is required' });
  }
  const { sessId, tId } = resolveSessionAndTerm(session_id, term_id);
  const rankings = recomputeClassRankings(Number(class_id), arm || 'A', Number(tId), Number(sessId));
  res.json(rankings);
});

// Helper to resolve valid session_id and term_id (prevents FK errors if stale IDs are passed)
function resolveSessionAndTerm(sessionId, termId) {
  let session = sessionId ? db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) : null;
  if (!session) {
    session = db.prepare(`SELECT * FROM sessions WHERE is_current = 1 LIMIT 1`).get()
      || db.prepare(`SELECT * FROM sessions ORDER BY id ASC LIMIT 1`).get();
  }
  const sessId = session?.id;

  let term = termId ? db.prepare(`SELECT * FROM terms WHERE id = ?`).get(termId) : null;
  if (!term && sessId) {
    term = db.prepare(`SELECT * FROM terms WHERE session_id = ? AND is_current = 1 LIMIT 1`).get(sessId)
      || db.prepare(`SELECT * FROM terms WHERE session_id = ? ORDER BY id ASC LIMIT 1`).get(sessId);
  }
  return { session, term, sessId, tId: term?.id };
}

// -------------------------------------------------------------
// 6. REPORT CARD GENERATION
// -------------------------------------------------------------
app.get('/api/report-cards/:studentId', (req, res) => {
  const { studentId } = req.params;
  const { term_id, session_id } = req.query;

  const student = db.prepare(`
    SELECT s.*, c.name as class_name, c.section as class_section
    FROM students s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = ?
  `).get(studentId);

  if (!student) return res.status(404).json({ error: 'Student not found' });

  const { session, term, sessId, tId } = resolveSessionAndTerm(session_id, term_id);
  if (!sessId || !tId) {
    return res.status(400).json({ error: 'No active academic session or term configured' });
  }

  // Recompute rankings so student position is freshest
  recomputeClassRankings(student.class_id, student.arm, tId, sessId);

  // Fetch report_cards record
  let reportCard = db.prepare(`
    SELECT * FROM report_cards
    WHERE student_id = ? AND term_id = ? AND session_id = ?
  `).get(studentId, tId, sessId);

  // Fetch attendance
  let attendance = db.prepare(`
    SELECT * FROM attendance
    WHERE student_id = ? AND term_id = ? AND session_id = ?
  `).get(studentId, tId, sessId);

  if (!attendance) {
    attendance = {
      days_opened: term?.days_opened || 65,
      days_present: 62,
      days_absent: 3,
      punctuality_rating: 'Very Good'
    };
  }

  // Fetch subject scores for this student
  const studentScores = db.prepare(`
    SELECT 
      sc.*, sub.name as subject_name, sub.code as subject_code, sub.category as subject_category
    FROM scores sc
    JOIN subjects sub ON sub.id = sc.subject_id
    WHERE sc.student_id = ? AND sc.term_id = ? AND sc.session_id = ?
    ORDER BY sub.name ASC
  `).all(studentId, tId, sessId);

  // Fetch subject-level class stats (Class Highest, Lowest, Average, and Subject Position)
  const subjectStats = getSubjectStatsAndRankings(student.class_id, student.arm, tId, sessId);

  const enrichedSubjects = studentScores.map(sc => {
    const stats = subjectStats[sc.subject_id] || { highest: sc.total_score, lowest: sc.total_score, average: sc.total_score, rankedScores: [] };
    const myRanked = (stats.rankedScores || []).find(r => r.student_id === Number(studentId));
    return {
      ...sc,
      class_highest: stats.highest,
      class_lowest: stats.lowest,
      class_average: stats.average,
      subject_position: myRanked?.subject_position || 1,
      subject_position_str: myRanked?.subject_position_str || '1st',
    };
  });

  // Calculate overall stats if not present
  const totalScoreObtained = enrichedSubjects.reduce((a, b) => a + (Number(b.total_score) || 0), 0);
  const maxPossible = (enrichedSubjects.length || 1) * 100;
  const overallAverage = enrichedSubjects.length > 0 ? Number((totalScoreObtained / enrichedSubjects.length).toFixed(2)) : 0;

  // Class total students & class average across all students
  const classStudents = db.prepare(`SELECT COUNT(*) as count FROM students WHERE class_id = ? AND arm = ? AND status = 'active'`).get(student.class_id, student.arm);
  const totalClassStudents = classStudents?.count || 1;

  // Class overall average
  const allCards = db.prepare(`
    SELECT average_score FROM report_cards 
    WHERE class_id = ? AND arm = ? AND term_id = ? AND session_id = ?
  `).all(student.class_id, student.arm, tId, sessId);
  const classAvg = allCards.length > 0 ? Number((allCards.reduce((a, b) => a + (b.average_score || 0), 0) / allCards.length).toFixed(2)) : overallAverage;

  // Default affective & psychomotor traits if null
  let affective = [];
  let psychomotor = [];
  try {
    if (reportCard?.affective_traits) affective = JSON.parse(reportCard.affective_traits);
    if (reportCard?.psychomotor_traits) psychomotor = JSON.parse(reportCard.psychomotor_traits);
  } catch (e) {}

  if (affective.length === 0) {
    affective = [
      { name: 'Punctuality', score: 5 },
      { name: 'Neatness & Decorum', score: 5 },
      { name: 'Politeness & Respect', score: 5 },
      { name: 'Honesty & Integrity', score: 5 },
      { name: 'Leadership & Teamwork', score: 4 },
      { name: 'Attentiveness in Class', score: 5 },
    ];
  }

  if (psychomotor.length === 0) {
    psychomotor = [
      { name: 'Handwriting / Penmanship', score: 4 },
      { name: 'Sports & Athletics', score: 4 },
      { name: 'Verbal Fluency & Speech', score: 5 },
      { name: 'Creative Arts & Craft', score: 4 },
      { name: 'Laboratory & Practical Skills', score: 4 },
    ];
  }

  // Teacher & Principal signature/comment
  const teacher = db.prepare(`SELECT * FROM teachers WHERE assigned_class_id = ? AND assigned_arm = ? LIMIT 1`).get(student.class_id, student.arm);

  res.json({
    student,
    session,
    term,
    reportCard: {
      id: reportCard?.id,
      total_score: reportCard?.total_score ?? totalScoreObtained,
      max_possible_score: reportCard?.max_possible_score ?? maxPossible,
      average_score: reportCard?.average_score ?? overallAverage,
      position: reportCard?.position ?? 1,
      position_str: formatOrdinal(reportCard?.position ?? 1) + ' Position',
      total_students: reportCard?.total_students ?? totalClassStudents,
      class_average: classAvg,
      teacher_comment: reportCard?.teacher_comment || (overallAverage >= 70 ? 'An outstanding and brilliant result. Keep up this standard!' : 'Good performance, with room for improvement.'),
      principal_comment: reportCard?.principal_comment || (overallAverage >= 70 ? 'Excellent performance! Highly commendable.' : 'Satisfactory result. Put in more effort next term.'),
      status: reportCard?.status || 'published',
      published_at: reportCard?.published_at,
      next_term_resumption: term?.next_term_resumption || '2026-01-12',
    },
    attendance,
    subjects: enrichedSubjects,
    affective_traits: affective,
    psychomotor_traits: psychomotor,
    teacher: teacher || { name: 'Mr. David Okon', qualification: 'B.Sc. Ed (UNILAG)' },
    principal: { name: 'Dr. Grace Williams', qualification: 'Ph.D. Educational Admin' },
    school_info: {
      name: 'TONY GROUP OF SCHOOLS',
      motto: 'Knowledge, Integrity & Distinction',
      address: '12-16 Victoria Island Boulevard, Lagos, Nigeria',
      phone: '+234 1 800 2739 / +234 803 123 4567',
      email: 'info@tonygroupofschools.edu.ng',
      website: 'www.tonygroupofschools.edu.ng',
    }
  });
});

// Update Report Card Comments & Traits
app.put('/api/report-cards/:studentId/comments', (req, res) => {
  const { studentId } = req.params;
  const { term_id, session_id, teacher_comment, principal_comment, affective_traits, psychomotor_traits } = req.body;

  db.prepare(`
    UPDATE report_cards SET
      teacher_comment = COALESCE(?, teacher_comment),
      principal_comment = COALESCE(?, principal_comment),
      affective_traits = COALESCE(?, affective_traits),
      psychomotor_traits = COALESCE(?, psychomotor_traits)
    WHERE student_id = ? AND term_id = ? AND session_id = ?
  `).run(
    teacher_comment,
    principal_comment,
    affective_traits ? JSON.stringify(affective_traits) : null,
    psychomotor_traits ? JSON.stringify(psychomotor_traits) : null,
    studentId,
    term_id,
    session_id
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// 7. ANALYTICS DASHBOARD
// -------------------------------------------------------------
app.get('/api/analytics', (req, res) => {
  const { class_id = 3, arm = 'A', term_id, session_id } = req.query;
  const { sessId, tId } = resolveSessionAndTerm(session_id, term_id);

  // 1. Overall counts
  const totalStudents = db.prepare(`SELECT COUNT(*) as c FROM students WHERE status = 'active'`).get().c;
  const totalTeachers = db.prepare(`SELECT COUNT(*) as c FROM teachers`).get().c;
  const totalClasses = db.prepare(`SELECT COUNT(*) as c FROM classes`).get().c;
  const totalSubjects = db.prepare(`SELECT COUNT(*) as c FROM subjects`).get().c;

  // 2. Class Level Rankings & Aggregates
  const ranked = recomputeClassRankings(Number(class_id), arm, Number(tId), Number(sessId));

  const totalClassStudents = ranked.length;
  const classAverages = ranked.map(r => r.average_score);
  const highestScore = ranked.length > 0 ? ranked[0].total_score : 0;
  const lowestScore = ranked.length > 0 ? ranked[ranked.length - 1].total_score : 0;
  const classAvg = classAverages.length > 0 ? Number((classAverages.reduce((a, b) => a + b, 0) / classAverages.length).toFixed(1)) : 0;

  // Pass rate (percentage of students with average >= 50%)
  const passingStudents = ranked.filter(r => r.average_score >= 50).length;
  const passRate = totalClassStudents > 0 ? Number(((passingStudents / totalClassStudents) * 100).toFixed(1)) : 0;
  const failureRate = totalClassStudents > 0 ? Number((100 - passRate).toFixed(1)) : 0;

  // Top 10 Students
  const top10 = ranked.slice(0, 10);

  // 3. Subject-level performance
  const subjectScores = db.prepare(`
    SELECT sc.subject_id, s.name as subject_name, s.code as subject_code,
           AVG(sc.total_score) as avg_score,
           MAX(sc.total_score) as max_score,
           MIN(sc.total_score) as min_score,
           COUNT(*) as student_count
    FROM scores sc
    JOIN subjects s ON s.id = sc.subject_id
    WHERE sc.class_id = ? AND sc.term_id = ? AND sc.session_id = ?
    GROUP BY sc.subject_id
  `).all(class_id, term_id, session_id);

  // Best & lowest performing subjects
  const sortedSubjects = [...subjectScores].sort((a, b) => b.avg_score - a.avg_score);
  const bestSubjects = sortedSubjects.slice(0, 5);
  const lowestSubjects = [...sortedSubjects].reverse().slice(0, 5);

  // 4. Grade distribution (A, B, C, D, E, F counts)
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  const allClassScores = db.prepare(`
    SELECT grade FROM scores
    WHERE class_id = ? AND term_id = ? AND session_id = ?
  `).all(class_id, term_id, session_id);

  for (const row of allClassScores) {
    if (gradeDistribution[row.grade] !== undefined) {
      gradeDistribution[row.grade]++;
    }
  }

  res.json({
    overall: {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
    },
    classStats: {
      totalClassStudents,
      classAvg,
      highestScore,
      lowestScore,
      passRate,
      failureRate,
    },
    top10,
    bestSubjects,
    lowestSubjects,
    gradeDistribution,
  });
});

// -------------------------------------------------------------
// 8. PARENT PORTAL ENDPOINT
// -------------------------------------------------------------
app.get('/api/parent/performance-history', (req, res) => {
  const { student_id } = req.query;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });

  // Get performance across all recorded terms
  const history = db.prepare(`
    SELECT 
      rc.term_id, rc.session_id, rc.total_score, rc.average_score, rc.position, rc.total_students,
      t.name as term_name, s.name as session_name
    FROM report_cards rc
    JOIN terms t ON t.id = rc.term_id
    JOIN sessions s ON s.id = rc.session_id
    WHERE rc.student_id = ?
    ORDER BY s.id ASC, t.id ASC
  `).all(student_id);

  res.json(history);
});

// Serve frontend static build in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 School Report Card Management Server running on http://localhost:${PORT}`);
});
