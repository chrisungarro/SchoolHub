import { db, initDatabase } from './db.js';
import { calculateGrade } from './grading.js';
import { recomputeClassRankings } from './ranking.js';

export function runSeed() {
  initDatabase();

  console.log('🌱 Starting seed...');

  // Clear existing data in correct FK order
  db.exec(`
    DELETE FROM scores;
    DELETE FROM attendance;
    DELETE FROM report_cards;
    DELETE FROM users;
    DELETE FROM students;
    DELETE FROM teachers;
    DELETE FROM class_subjects;
    DELETE FROM subjects;
    DELETE FROM classes;
    DELETE FROM terms;
    DELETE FROM sessions;
    DELETE FROM sqlite_sequence;
  `);

  // 1. SESSIONS
  const insertSession = db.prepare(`INSERT INTO sessions (name, is_current, start_date, end_date) VALUES (?, ?, ?, ?)`);
  const s2025 = insertSession.run('2025/2026', 1, '2025-09-08', '2026-07-20').lastInsertRowid;
  const s2024 = insertSession.run('2024/2025', 0, '2024-09-09', '2025-07-18').lastInsertRowid;

  // 2. TERMS
  const insertTerm = db.prepare(`INSERT INTO terms (session_id, name, is_current, next_term_resumption, days_opened) VALUES (?, ?, ?, ?, ?)`);
  const t1 = insertTerm.run(s2025, 'First Term', 1, '2026-01-12', 65).lastInsertRowid;
  const t2 = insertTerm.run(s2025, 'Second Term', 0, '2026-05-04', 62).lastInsertRowid;
  const t3 = insertTerm.run(s2025, 'Third Term', 0, '2026-09-14', 60).lastInsertRowid;

  // 3. CLASSES
  const insertClass = db.prepare(`INSERT INTO classes (name, section, order_index, arms) VALUES (?, ?, ?, ?)`);
  const p5 = insertClass.run('Primary 5', 'Primary', 1, 'Gold,Diamond').lastInsertRowid;
  const p6 = insertClass.run('Primary 6', 'Primary', 2, 'Gold,Diamond').lastInsertRowid;
  const jss1 = insertClass.run('JSS 1', 'Junior Secondary', 3, 'A,B').lastInsertRowid;
  const jss2 = insertClass.run('JSS 2', 'Junior Secondary', 4, 'A,B').lastInsertRowid;
  const jss3 = insertClass.run('JSS 3', 'Junior Secondary', 5, 'A,B').lastInsertRowid;
  const sss1 = insertClass.run('SSS 1', 'Senior Secondary', 6, 'Science,Arts,Commercial').lastInsertRowid;

  // 4. SUBJECTS
  const insertSubject = db.prepare(`INSERT INTO subjects (code, name, category) VALUES (?, ?, ?)`);
  const subjectsData = [
    { code: 'ENG', name: 'English Language', cat: 'Languages' },
    { code: 'MTH', name: 'Mathematics', cat: 'Sciences' },
    { code: 'BSC', name: 'Basic Science & Tech', cat: 'Sciences' },
    { code: 'SST', name: 'Social Studies', cat: 'Humanities' },
    { code: 'AGR', name: 'Agricultural Science', cat: 'Vocational' },
    { code: 'ICT', name: 'Computer Studies (ICT)', cat: 'Sciences' },
    { code: 'CVE', name: 'Civic Education', cat: 'Humanities' },
    { code: 'BUS', name: 'Business Studies', cat: 'Commercial' },
    { code: 'CCA', name: 'Cultural & Creative Arts', cat: 'Vocational' },
    { code: 'FRN', name: 'French Language', cat: 'Languages' },
  ];

  const subjectMap = {};
  for (const s of subjectsData) {
    const id = insertSubject.run(s.code, s.name, s.cat).lastInsertRowid;
    subjectMap[s.code] = id;
  }

  // 5. CLASS_SUBJECTS (Assign standard 8-9 subjects to JSS 1 with max marks: Assignment=10, Test=20, Exam=70)
  const insertClassSub = db.prepare(`INSERT INTO class_subjects (class_id, subject_id, max_assignment, max_test, max_exam) VALUES (?, ?, 10, 20, 70)`);
  const jssSubjects = ['ENG', 'MTH', 'BSC', 'SST', 'AGR', 'ICT', 'CVE', 'BUS'];
  for (const code of jssSubjects) {
    insertClassSub.run(jss1, subjectMap[code]);
    insertClassSub.run(jss2, subjectMap[code]);
  }
  for (const code of ['ENG', 'MTH', 'BSC', 'SST', 'AGR', 'ICT']) {
    insertClassSub.run(p5, subjectMap[code]);
  }

  // 6. TEACHERS
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (staff_id, name, email, phone, qualification, assigned_class_id, assigned_arm, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tOkon = insertTeacher.run('TCH/2026/001', 'Mr. David Okon', 'david.okon@school.edu.ng', '+234 803 123 4567', 'B.Sc. Ed Mathematics (UNILAG)', jss1, 'A', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150').lastInsertRowid;
  const tAdeleke = insertTeacher.run('TCH/2026/002', 'Mrs. Ngozi Adeleke', 'ngozi.adeleke@school.edu.ng', '+234 802 987 6543', 'B.A. English (UI), M.Ed', jss1, 'B', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150').lastInsertRowid;
  const tMusa = insertTeacher.run('TCH/2026/003', 'Mr. Ibrahim Musa', 'ibrahim.musa@school.edu.ng', '+234 805 555 1212', 'B.Tech Computer Science (FUTA)', jss2, 'A', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150').lastInsertRowid;

  // 7. STUDENTS
  const insertStudent = db.prepare(`
    INSERT INTO students (
      student_id, admission_no, first_name, last_name, middle_name,
      gender, dob, class_id, arm, photo,
      parent_name, parent_phone, parent_email, parent_address, status
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, 'active'
    )
  `);

  const studentsRoster = [
    { first: 'Chinedu', last: 'Eze', mid: 'Kelechi', gender: 'Male', dob: '2013-05-14', arm: 'A', parent: 'Chief Emeka Eze', pPhone: '+234 803 777 8899', pEmail: 'emeka.eze@outlook.com', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' },
    { first: 'Amina', last: 'Bello', mid: 'Zahra', gender: 'Female', dob: '2013-08-22', arm: 'A', parent: 'Alhaji Sanusi Bello', pPhone: '+234 802 111 2233', pEmail: 'sanusi.bello@gmail.com', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150' },
    { first: 'Oluwaseun', last: 'Adeyemi', mid: 'Samuel', gender: 'Male', dob: '2013-02-19', arm: 'A', parent: 'Engr. Segun Adeyemi', pPhone: '+234 809 333 4455', pEmail: 'segun.adeyemi@yahoo.com', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
    { first: 'Fatima', last: 'Abubakar', mid: 'Halima', gender: 'Female', dob: '2013-11-03', arm: 'A', parent: 'Barr. Usman Abubakar', pPhone: '+234 807 444 5566', pEmail: 'usman.abubakar@legal.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
    { first: 'Emeka', last: 'Nwosu', mid: 'Chukwudi', gender: 'Male', dob: '2013-04-12', arm: 'A', parent: 'Dr. Obinna Nwosu', pPhone: '+234 806 222 9900', pEmail: 'obinna.nwosu@med.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { first: 'Zainab', last: 'Mohammed', mid: 'Aliyu', gender: 'Female', dob: '2013-07-30', arm: 'A', parent: 'Dr. Kabir Mohammed', pPhone: '+234 803 888 1234', pEmail: 'kabir.m@gmail.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { first: 'Tunde', last: 'Bakare', mid: 'Olamide', gender: 'Male', dob: '2013-09-15', arm: 'A', parent: 'Pastor Femi Bakare', pPhone: '+234 805 666 7788', pEmail: 'femi.bakare@church.org', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
    { first: 'Chioma', last: 'Okoli', mid: 'Grace', gender: 'Female', dob: '2013-03-25', arm: 'A', parent: 'Mrs. Ifeoma Okoli', pPhone: '+234 802 555 4321', pEmail: 'ifeoma.okoli@gmail.com', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150' },
    { first: 'Daniel', last: 'Udoh', mid: 'Emmanuel', gender: 'Male', dob: '2013-10-09', arm: 'A', parent: 'Elder Bassey Udoh', pPhone: '+234 808 999 1122', pEmail: 'bassey.udoh@gmail.com', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' },
    { first: 'Blessing', last: 'Kalu', mid: 'Nneka', gender: 'Female', dob: '2013-06-18', arm: 'A', parent: 'Mr. Nnamdi Kalu', pPhone: '+234 803 444 3322', pEmail: 'nnamdi.kalu@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { first: 'Ibrahim', last: 'Sani', mid: 'Garba', gender: 'Male', dob: '2013-01-28', arm: 'A', parent: 'Alhaji Sani Garba', pPhone: '+234 806 777 6655', pEmail: 'sani.garba@state.gov.ng', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150' },
    { first: 'Maryann', last: 'Bassey', mid: 'Aniebiet', gender: 'Female', dob: '2013-12-05', arm: 'A', parent: 'Capt. Edet Bassey', pPhone: '+234 809 123 9988', pEmail: 'edet.bassey@navy.mil', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
    // Arm B
    { first: 'Somto', last: 'Okafor', mid: 'David', gender: 'Male', dob: '2013-04-05', arm: 'B', parent: 'Mr. Paul Okafor', pPhone: '+234 803 222 1199', pEmail: 'paul.okafor@gmail.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { first: 'Hadiza', last: 'Balarabe', mid: 'Aisha', gender: 'Female', dob: '2013-08-11', arm: 'B', parent: 'Dr. Kabir Balarabe', pPhone: '+234 802 333 4488', pEmail: 'kabir.b@gmail.com', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150' },
    { first: 'Kenechukwu', last: 'Nnamani', mid: 'Paul', gender: 'Male', dob: '2013-11-20', arm: 'B', parent: 'Mrs. Uche Nnamani', pPhone: '+234 807 555 7766', pEmail: 'uche.nnamani@yahoo.com', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150' },
  ];

  const studentIds = [];
  let studentCounter = 1;

  for (const s of studentsRoster) {
    const stuCode = `STU/2026/${String(studentCounter).padStart(3, '0')}`;
    const admNo = `ADM-2026-${String(studentCounter).padStart(3, '0')}`;
    const id = insertStudent.run(
      stuCode, admNo, s.first, s.last, s.mid,
      s.gender, s.dob, jss1, s.arm, s.avatar,
      s.parent, s.pPhone, s.pEmail, 'Plot 124, Crescent View Estate, Victoria Island, Lagos',
    ).lastInsertRowid;

    studentIds.push({ id, ...s, studentCode: stuCode, admNo });
    studentCounter++;
  }

  // 8. SCORE GENERATION FOR JSS 1 STUDENTS
  // We'll calibrate scores so Chinedu Eze gets top 1 (~650 total), Amina Bello gets ~620, Oluwaseun ~600, etc. matching user example!
  const insertScore = db.prepare(`
    INSERT INTO scores (
      student_id, subject_id, class_id, arm, term_id, session_id,
      assignment_score, test_score, exam_score, total_score, percentage,
      grade, remark, entered_by
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const studentPerformanceTier = {
    'Chinedu Eze': { caMin: 8, caMax: 10, testMin: 17, testMax: 20, examMin: 55, examMax: 68 }, // High flyer (80-95%)
    'Amina Bello': { caMin: 8, caMax: 10, testMin: 16, testMax: 19, examMin: 50, examMax: 64 }, // High flyer (75-90%)
    'Oluwaseun Adeyemi': { caMin: 7, caMax: 9, testMin: 15, testMax: 18, examMin: 48, examMax: 62 }, // Very good (70-85%)
    'Fatima Abubakar': { caMin: 7, caMax: 9, testMin: 14, testMax: 18, examMin: 46, examMax: 60 },
    'Emeka Nwosu': { caMin: 7, caMax: 9, testMin: 14, testMax: 17, examMin: 42, examMax: 58 },
    'Zainab Mohammed': { caMin: 6, caMax: 8, testMin: 13, testMax: 16, examMin: 40, examMax: 54 },
    'Tunde Bakare': { caMin: 6, caMax: 8, testMin: 12, testMax: 16, examMin: 38, examMax: 52 },
    'Chioma Okoli': { caMin: 6, caMax: 8, testMin: 12, testMax: 15, examMin: 36, examMax: 50 },
    'Daniel Udoh': { caMin: 5, caMax: 7, testMin: 11, testMax: 14, examMin: 34, examMax: 48 },
    'Blessing Kalu': { caMin: 5, caMax: 7, testMin: 10, testMax: 13, examMin: 32, examMax: 44 },
    'Ibrahim Sani': { caMin: 4, caMax: 6, testMin: 9, testMax: 12, examMin: 28, examMax: 42 },
    'Maryann Bassey': { caMin: 4, caMax: 6, testMin: 8, testMax: 11, examMin: 25, examMax: 38 },
  };

  const defaultTier = { caMin: 6, caMax: 8, testMin: 12, testMax: 16, examMin: 35, examMax: 55 };

  for (const s of studentIds) {
    const fullName = `${s.first} ${s.last}`;
    const tier = studentPerformanceTier[fullName] || defaultTier;

    for (const code of jssSubjects) {
      const subId = subjectMap[code];
      const ca = Math.floor(Math.random() * (tier.caMax - tier.caMin + 1)) + tier.caMin;
      const test = Math.floor(Math.random() * (tier.testMax - tier.testMin + 1)) + tier.testMin;
      const exam = Math.floor(Math.random() * (tier.examMax - tier.examMin + 1)) + tier.examMin;
      const total = ca + test + exam;
      const percentage = total; // out of 100
      const { grade, remark } = calculateGrade(total);

      insertScore.run(
        s.id, subId, jss1, s.arm, t1, s2025,
        ca, test, exam, total, percentage,
        grade, remark, 'Mr. David Okon'
      );
    }

    // 9. ATTENDANCE
    const daysOpened = 65;
    const daysPresent = Math.floor(Math.random() * 6) + 60; // 60 to 65
    const daysAbsent = daysOpened - daysPresent;
    db.prepare(`
      INSERT INTO attendance (student_id, term_id, session_id, days_opened, days_present, days_absent, punctuality_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(s.id, t1, s2025, daysOpened, daysPresent, daysAbsent, daysAbsent <= 1 ? 'Excellent' : 'Very Good');
  }

  // 10. RECOMPUTE RANKINGS & GENERATE REPORT CARDS
  console.log('📊 Recomputing rankings for JSS 1 Arm A and B...');
  const rankedA = recomputeClassRankings(jss1, 'A', t1, s2025);
  const rankedB = recomputeClassRankings(jss1, 'B', t1, s2025);

  // Update comments and affective/psychomotor domains for ranked students
  const updateComments = db.prepare(`
    UPDATE report_cards SET 
      teacher_comment = ?, 
      principal_comment = ?,
      affective_traits = ?,
      psychomotor_traits = ?
    WHERE student_id = ? AND term_id = ? AND session_id = ?
  `);

  const teacherComments = [
    'An exceptionally brilliant and disciplined student. Keep shining!',
    'Shows remarkable aptitude and critical thinking. Consistent and dedicated.',
    'Very good performance this term. Capable of even greater heights with more focus.',
    'A hardworking and diligent student. Shows positive enthusiasm in all tasks.',
    'Good academic progress. Encouraged to participate more actively in classroom discussions.',
    'Satisfactory performance. Can achieve much better results with consistent study habits.',
    'Shows promise but needs to devote more time to home assignments and study.',
  ];

  const principalComments = [
    'Outstanding academic excellence and exemplary conduct. Highly recommended for scholarship.',
    'Commendable results. Demonstrates leadership, maturity, and academic focus.',
    'A very good result. Keep striving for the pinnacle of academic distinction.',
    'Promising progress. Maintain diligence in the upcoming academic term.',
    'Fair effort shown. Greater commitment to study will yield stronger results.',
  ];

  const traits = {
    affective: [
      { name: 'Punctuality', score: 5 },
      { name: 'Neatness & Decorum', score: 5 },
      { name: 'Politeness & Respect', score: 5 },
      { name: 'Honesty & Integrity', score: 5 },
      { name: 'Leadership & Teamwork', score: 4 },
      { name: 'Attentiveness in Class', score: 5 },
    ],
    psychomotor: [
      { name: 'Handwriting / Penmanship', score: 4 },
      { name: 'Sports & Athletics', score: 4 },
      { name: 'Verbal Fluency & Speech', score: 5 },
      { name: 'Creative Arts & Craft', score: 4 },
      { name: 'Laboratory & Practical Skills', score: 5 },
    ]
  };

  const allRanked = [...rankedA, ...rankedB];
  for (const item of allRanked) {
    const tComment = item.position <= 2 ? teacherComments[0] : item.position <= 5 ? teacherComments[1] : item.position <= 8 ? teacherComments[2] : teacherComments[4];
    const pComment = item.position <= 2 ? principalComments[0] : item.position <= 5 ? principalComments[1] : principalComments[2];

    updateComments.run(
      tComment,
      pComment,
      JSON.stringify(traits.affective),
      JSON.stringify(traits.psychomotor),
      item.student_id,
      t1,
      s2025
    );
  }

  // 11. USERS ACCOUNTS
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, full_name, email, phone, student_id, teacher_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Admin
  insertUser.run('admin', 'admin123', 'Administrator', 'Engr. K. Balogun', 'admin@school.edu.ng', '+234 801 000 0001', null, null);
  // Principal
  insertUser.run('principal', 'principal123', 'Principal', 'Dr. Grace Williams', 'principal@school.edu.ng', '+234 801 000 0002', null, null);
  // Teacher
  insertUser.run('teacher', 'teacher123', 'Teacher', 'Mr. David Okon', 'david.okon@school.edu.ng', '+234 803 123 4567', null, tOkon);
  // Parent (Chief Emeka Eze, parent of Chinedu Eze)
  const chinedu = studentIds[0];
  insertUser.run('parent', 'parent123', 'Parent', 'Chief Emeka Eze', 'emeka.eze@outlook.com', '+234 803 777 8899', chinedu.id, null);

  console.log('✅ Database seeded successfully with demo users, classes, subjects, students, scores, and rankings!');
}

runSeed();
