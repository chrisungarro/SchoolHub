// In-browser persistent backend fallback (localStorage) for static deployments like Vercel
// Mirrors server/index.js + server/ranking.js + server/grading.js

const STORAGE_KEY = 'tgs_school_db_v1';

function calculateGrade(totalScore: number) {
  const score = Math.round(Number(totalScore) || 0);
  if (score >= 70) return { grade: 'A', remark: 'Excellent', gpa: 5.0 };
  if (score >= 60) return { grade: 'B', remark: 'Very Good', gpa: 4.0 };
  if (score >= 50) return { grade: 'C', remark: 'Good', gpa: 3.0 };
  if (score >= 45) return { grade: 'D', remark: 'Fair', gpa: 2.0 };
  if (score >= 40) return { grade: 'E', remark: 'Pass', gpa: 1.0 };
  return { grade: 'F', remark: 'Fail', gpa: 0.0 };
}

function formatOrdinal(n: number) {
  if (!n || n <= 0) return '-';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function createInitialDb() {
  const sessions = [
    { id: 1, name: '2025/2026', is_current: 1, start_date: '2025-09-08', end_date: '2026-07-20' },
    { id: 2, name: '2024/2025', is_current: 0, start_date: '2024-09-09', end_date: '2025-07-18' },
  ];

  const terms = [
    { id: 1, session_id: 1, name: 'First Term', is_current: 1, next_term_resumption: '2026-01-12', days_opened: 65 },
    { id: 2, session_id: 1, name: 'Second Term', is_current: 0, next_term_resumption: '2026-05-04', days_opened: 62 },
    { id: 3, session_id: 1, name: 'Third Term', is_current: 0, next_term_resumption: '2026-09-14', days_opened: 60 },
  ];

  const classes = [
    { id: 1, name: 'Primary 5', section: 'Primary', order_index: 1, arms: 'Gold,Diamond' },
    { id: 2, name: 'Primary 6', section: 'Primary', order_index: 2, arms: 'Gold,Diamond' },
    { id: 3, name: 'JSS 1', section: 'Junior Secondary', order_index: 3, arms: 'A,B' },
    { id: 4, name: 'JSS 2', section: 'Junior Secondary', order_index: 4, arms: 'A,B' },
    { id: 5, name: 'JSS 3', section: 'Junior Secondary', order_index: 5, arms: 'A,B' },
    { id: 6, name: 'SSS 1', section: 'Senior Secondary', order_index: 6, arms: 'Science,Arts,Commercial' },
  ];

  const subjects = [
    { id: 1, code: 'ENG', name: 'English Language', category: 'Languages' },
    { id: 2, code: 'MTH', name: 'Mathematics', category: 'Sciences' },
    { id: 3, code: 'BSC', name: 'Basic Science & Tech', category: 'Sciences' },
    { id: 4, code: 'SST', name: 'Social Studies', category: 'Humanities' },
    { id: 5, code: 'AGR', name: 'Agricultural Science', category: 'Vocational' },
    { id: 6, code: 'ICT', name: 'Computer Studies (ICT)', category: 'Sciences' },
    { id: 7, code: 'CVE', name: 'Civic Education', category: 'Humanities' },
    { id: 8, code: 'BUS', name: 'Business Studies', category: 'Commercial' },
    { id: 9, code: 'CCA', name: 'Cultural & Creative Arts', category: 'Vocational' },
    { id: 10, code: 'FRN', name: 'French Language', category: 'Languages' },
  ];

  const class_subjects: any[] = [];
  let csId = 1;
  for (const subId of [1, 2, 3, 4, 5, 6, 7, 8]) {
    class_subjects.push({ id: csId++, class_id: 3, subject_id: subId, max_assignment: 10, max_test: 20, max_exam: 70 });
    class_subjects.push({ id: csId++, class_id: 4, subject_id: subId, max_assignment: 10, max_test: 20, max_exam: 70 });
  }
  for (const subId of [1, 2, 3, 4, 5, 6]) {
    class_subjects.push({ id: csId++, class_id: 1, subject_id: subId, max_assignment: 10, max_test: 20, max_exam: 70 });
  }

  const teachers = [
    { id: 1, staff_id: 'TCH/2026/001', name: 'Mr. David Okon', email: 'david.okon@tonygroupofschools.edu.ng', phone: '+234 803 123 4567', qualification: 'B.Sc. Ed Mathematics (UNILAG)', assigned_class_id: 3, assigned_arm: 'A', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 2, staff_id: 'TCH/2026/002', name: 'Mrs. Ngozi Adeleke', email: 'ngozi.adeleke@tonygroupofschools.edu.ng', phone: '+234 802 987 6543', qualification: 'B.A. English (UI), M.Ed', assigned_class_id: 3, assigned_arm: 'B', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { id: 3, staff_id: 'TCH/2026/003', name: 'Mr. Ibrahim Musa', email: 'ibrahim.musa@tonygroupofschools.edu.ng', phone: '+234 805 555 1212', qualification: 'B.Tech Computer Science (FUTA)', assigned_class_id: 4, assigned_arm: 'A', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  ];

  const studentsRoster = [
    { first: 'Chinedu', last: 'Eze', mid: 'Kelechi', gender: 'Male', dob: '2013-05-14', arm: 'A', parent: 'Chief Emeka Eze', pPhone: '+234 803 777 8899', pEmail: 'emeka.eze@outlook.com', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', ca: 9, test: 18, exam: 61 },
    { first: 'Amina', last: 'Bello', mid: 'Zahra', gender: 'Female', dob: '2013-08-22', arm: 'A', parent: 'Alhaji Sanusi Bello', pPhone: '+234 802 111 2233', pEmail: 'sanusi.bello@gmail.com', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150', ca: 9, test: 17, exam: 57 },
    { first: 'Oluwaseun', last: 'Adeyemi', mid: 'Samuel', gender: 'Male', dob: '2013-02-19', arm: 'A', parent: 'Engr. Segun Adeyemi', pPhone: '+234 809 333 4455', pEmail: 'segun.adeyemi@yahoo.com', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', ca: 8, test: 16, exam: 53 },
    { first: 'Fatima', last: 'Abubakar', mid: 'Halima', gender: 'Female', dob: '2013-11-03', arm: 'A', parent: 'Barr. Usman Abubakar', pPhone: '+234 807 444 5566', pEmail: 'usman.abubakar@legal.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', ca: 8, test: 16, exam: 50 },
    { first: 'Emeka', last: 'Nwosu', mid: 'Chukwudi', gender: 'Male', dob: '2013-04-12', arm: 'A', parent: 'Dr. Obinna Nwosu', pPhone: '+234 806 222 9900', pEmail: 'obinna.nwosu@med.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', ca: 8, test: 15, exam: 48 },
    { first: 'Zainab', last: 'Mohammed', mid: 'Aliyu', gender: 'Female', dob: '2013-07-30', arm: 'A', parent: 'Dr. Kabir Mohammed', pPhone: '+234 803 888 1234', pEmail: 'kabir.m@gmail.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', ca: 7, test: 15, exam: 46 },
    { first: 'Tunde', last: 'Bakare', mid: 'Olamide', gender: 'Male', dob: '2013-09-15', arm: 'A', parent: 'Pastor Femi Bakare', pPhone: '+234 805 666 7788', pEmail: 'femi.bakare@church.org', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', ca: 7, test: 14, exam: 43 },
    { first: 'Chioma', last: 'Okoli', mid: 'Grace', gender: 'Female', dob: '2013-03-25', arm: 'A', parent: 'Mrs. Ifeoma Okoli', pPhone: '+234 802 555 4321', pEmail: 'ifeoma.okoli@gmail.com', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', ca: 7, test: 13, exam: 41 },
    { first: 'Daniel', last: 'Udoh', mid: 'Emmanuel', gender: 'Male', dob: '2013-10-09', arm: 'A', parent: 'Elder Bassey Udoh', pPhone: '+234 808 999 1122', pEmail: 'bassey.udoh@gmail.com', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', ca: 6, test: 12, exam: 39 },
    { first: 'Blessing', last: 'Kalu', mid: 'Nneka', gender: 'Female', dob: '2013-06-18', arm: 'A', parent: 'Mr. Nnamdi Kalu', pPhone: '+234 803 444 3322', pEmail: 'nnamdi.kalu@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', ca: 6, test: 12, exam: 36 },
    { first: 'Ibrahim', last: 'Sani', mid: 'Garba', gender: 'Male', dob: '2013-01-28', arm: 'A', parent: 'Alhaji Sani Garba', pPhone: '+234 806 777 6655', pEmail: 'sani.garba@state.gov.ng', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', ca: 5, test: 11, exam: 34 },
    { first: 'Maryann', last: 'Bassey', mid: 'Aniebiet', gender: 'Female', dob: '2013-12-05', arm: 'A', parent: 'Capt. Edet Bassey', pPhone: '+234 809 123 9988', pEmail: 'edet.bassey@navy.mil', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', ca: 5, test: 9, exam: 25 },
    { first: 'Somto', last: 'Okafor', mid: 'David', gender: 'Male', dob: '2013-04-05', arm: 'B', parent: 'Mr. Paul Okafor', pPhone: '+234 803 222 1199', pEmail: 'paul.okafor@gmail.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', ca: 8, test: 16, exam: 52 },
    { first: 'Hadiza', last: 'Balarabe', mid: 'Aisha', gender: 'Female', dob: '2013-08-11', arm: 'B', parent: 'Dr. Kabir Balarabe', pPhone: '+234 802 333 4488', pEmail: 'kabir.b@gmail.com', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150', ca: 8, test: 15, exam: 49 },
    { first: 'Kenechukwu', last: 'Nnamani', mid: 'Paul', gender: 'Male', dob: '2013-11-20', arm: 'B', parent: 'Mrs. Uche Nnamani', pPhone: '+234 807 555 7766', pEmail: 'uche.nnamani@yahoo.com', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', ca: 7, test: 13, exam: 44 },
  ];

  const students: any[] = [];
  const scores: any[] = [];
  const attendance: any[] = [];
  const report_cards: any[] = [];

  let scoreId = 1;
  studentsRoster.forEach((s, idx) => {
    const id = idx + 1;
    students.push({
      id,
      student_id: `STU/2026/${String(id).padStart(3, '0')}`,
      admission_no: `ADM-2026-${String(id).padStart(3, '0')}`,
      first_name: s.first,
      last_name: s.last,
      middle_name: s.mid,
      gender: s.gender,
      dob: s.dob,
      class_id: 3,
      arm: s.arm,
      photo: s.avatar,
      parent_name: s.parent,
      parent_phone: s.pPhone,
      parent_email: s.pEmail,
      parent_address: 'Plot 124, Crescent View Estate, Victoria Island, Lagos',
      status: 'active',
    });

    [1, 2, 3, 4, 5, 6, 7, 8].forEach((subId, subIdx) => {
      const variance = ((id + subIdx) % 5) - 2;
      const ca = Math.min(10, Math.max(0, s.ca + (variance > 0 ? 1 : 0)));
      const test = Math.min(20, Math.max(0, s.test + variance));
      const exam = Math.min(70, Math.max(0, s.exam + variance * 2));
      const total = ca + test + exam;
      const { grade, remark } = calculateGrade(total);
      scores.push({
        id: scoreId++,
        student_id: id,
        subject_id: subId,
        class_id: 3,
        arm: s.arm,
        term_id: 1,
        session_id: 1,
        assignment_score: ca,
        test_score: test,
        exam_score: exam,
        total_score: total,
        percentage: total,
        grade,
        remark,
        entered_by: 'Mr. David Okon',
      });
    });

    const daysPresent = 65 - (id % 4);
    attendance.push({
      id,
      student_id: id,
      term_id: 1,
      session_id: 1,
      days_opened: 65,
      days_present: daysPresent,
      days_absent: 65 - daysPresent,
      punctuality_rating: daysPresent >= 64 ? 'Excellent' : 'Very Good',
    });
  });

  const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'Administrator', full_name: 'Engr. K. Balogun', email: 'admin@tonygroupofschools.edu.ng', phone: '+234 801 000 0001', student_id: null, teacher_id: null },
    { id: 2, username: 'principal', password: 'principal123', role: 'Principal', full_name: 'Dr. Grace Williams', email: 'principal@tonygroupofschools.edu.ng', phone: '+234 801 000 0002', student_id: null, teacher_id: null },
    { id: 3, username: 'teacher', password: 'teacher123', role: 'Teacher', full_name: 'Mr. David Okon', email: 'david.okon@tonygroupofschools.edu.ng', phone: '+234 803 123 4567', student_id: null, teacher_id: 1 },
    { id: 4, username: 'parent', password: 'parent123', role: 'Parent', full_name: 'Chief Emeka Eze', email: 'emeka.eze@outlook.com', phone: '+234 803 777 8899', student_id: 1, teacher_id: null },
  ];

  const db = { sessions, terms, classes, subjects, class_subjects, teachers, students, scores, attendance, report_cards, users };
  recomputeClassRankings(db, 3, 'A', 1, 1);
  recomputeClassRankings(db, 3, 'B', 1, 1);
  return db;
}

function getDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = createInitialDb();
  saveDb(initial);
  return initial;
}

function saveDb(db: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {}
}

function recomputeClassRankings(db: any, classId: number, arm: string, termId: number, sessionId: number) {
  const students = db.students.filter((s: any) =>
    s.class_id === classId && s.status === 'active' && (!arm || arm === 'ALL' || s.arm === arm)
  );
  if (students.length === 0) return [];

  const classSubsCount = db.class_subjects.filter((cs: any) => cs.class_id === classId).length || 1;
  const studentTotals = students.map((student: any) => {
    const scs = db.scores.filter((sc: any) => sc.student_id === student.id && sc.term_id === termId && sc.session_id === sessionId);
    const sumTotal = scs.reduce((a: number, c: any) => a + (Number(c.total_score) || 0), 0);
    const count = scs.length;
    const maxPossible = (count > 0 ? count : classSubsCount) * 100;
    const avg = count > 0 ? Number((sumTotal / count).toFixed(2)) : 0;
    return {
      student_id: student.id,
      student_name: `${student.last_name} ${student.first_name} ${student.middle_name || ''}`.trim(),
      admission_no: student.admission_no,
      gender: student.gender,
      photo: student.photo,
      class_id: classId,
      arm: student.arm,
      scores_count: count,
      total_score: Number(sumTotal.toFixed(1)),
      max_possible_score: maxPossible,
      average_score: avg,
    };
  });

  studentTotals.sort((a: any, b: any) => b.total_score - a.total_score);

  let currentPosition = 1;
  const ranked = studentTotals.map((item: any, idx: number, arr: any[]) => {
    if (idx > 0 && item.total_score < arr[idx - 1].total_score) {
      currentPosition = idx + 1;
    }
    const isTied = arr.filter((x: any) => x.total_score === item.total_score).length > 1;
    return {
      ...item,
      position: currentPosition,
      position_str: `${formatOrdinal(currentPosition)} Position${isTied ? ' (Tied)' : ''}`,
      total_students: arr.length,
      isTied,
    };
  });

  for (const r of ranked) {
    const existing = db.report_cards.find((rc: any) => rc.student_id === r.student_id && rc.term_id === termId && rc.session_id === sessionId);
    if (existing) {
      existing.total_score = r.total_score;
      existing.max_possible_score = r.max_possible_score;
      existing.average_score = r.average_score;
      existing.position = r.position;
      existing.total_students = r.total_students;
    } else {
      db.report_cards.push({
        id: db.report_cards.length + 1,
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
        teacher_comment: r.position <= 2
          ? 'An exceptionally brilliant and disciplined student. Keep shining!'
          : 'Good academic progress. Encouraged to maintain consistent study habits.',
        principal_comment: r.position <= 2
          ? 'Outstanding academic excellence and exemplary conduct. Highly recommended for scholarship.'
          : 'A very good result. Keep striving for academic distinction.',
        affective_traits: JSON.stringify([
          { name: 'Punctuality', score: 5 },
          { name: 'Neatness & Decorum', score: 5 },
          { name: 'Politeness & Respect', score: 5 },
          { name: 'Honesty & Integrity', score: 5 },
          { name: 'Leadership & Teamwork', score: 4 },
          { name: 'Attentiveness in Class', score: 5 },
        ]),
        psychomotor_traits: JSON.stringify([
          { name: 'Handwriting / Penmanship', score: 4 },
          { name: 'Sports & Athletics', score: 4 },
          { name: 'Verbal Fluency & Speech', score: 5 },
          { name: 'Creative Arts & Craft', score: 4 },
          { name: 'Laboratory & Practical Skills', score: 5 },
        ]),
        status: 'published',
        published_at: new Date().toISOString(),
      });
    }
  }
  return ranked;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleMockApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  const body = init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : {};
  const db = getDb();

  // AUTH
  if (path === '/api/auth/login' && method === 'POST') {
    const user = db.users.find((u: any) => u.username === body.username && u.password === body.password);
    if (!user) return jsonResponse({ error: 'Invalid username or password' }, 401);
    const student = user.student_id ? db.students.find((s: any) => s.id === user.student_id) : null;
    if (student) {
      const cls = db.classes.find((c: any) => c.id === student.class_id);
      student.class_name = cls?.name;
    }
    const teacher = user.teacher_id ? db.teachers.find((t: any) => t.id === user.teacher_id) : null;
    if (teacher) {
      const cls = db.classes.find((c: any) => c.id === teacher.assigned_class_id);
      teacher.class_name = cls?.name;
    }
    return jsonResponse({ user: { ...user, student, teacher } });
  }

  if (path === '/api/auth/switch-role' && method === 'POST') {
    const user = db.users.find((u: any) => u.role === body.role);
    if (!user) return jsonResponse({ error: `No demo user found for role ${body.role}` }, 404);
    const student = user.student_id ? { ...db.students.find((s: any) => s.id === user.student_id) } : null;
    if (student) {
      const cls = db.classes.find((c: any) => c.id === student.class_id);
      student.class_name = cls?.name;
    }
    const teacher = user.teacher_id ? { ...db.teachers.find((t: any) => t.id === user.teacher_id) } : null;
    if (teacher) {
      const cls = db.classes.find((c: any) => c.id === teacher.assigned_class_id);
      teacher.class_name = cls?.name;
    }
    return jsonResponse({ user: { ...user, student, teacher } });
  }

  // CLASSES
  if (path === '/api/classes' && method === 'GET') {
    const list = db.classes.map((c: any) => ({
      ...c,
      student_count: db.students.filter((s: any) => s.class_id === c.id && s.status === 'active').length,
    }));
    return jsonResponse(list);
  }

  if (path === '/api/classes' && method === 'POST') {
    const id = Math.max(0, ...db.classes.map((c: any) => c.id)) + 1;
    db.classes.push({ id, name: body.name, section: body.section || 'Junior Secondary', order_index: body.order_index || id, arms: body.arms || 'A,B' });
    saveDb(db);
    return jsonResponse({ success: true, id });
  }

  // SUBJECTS
  if (path === '/api/subjects' && method === 'GET') {
    return jsonResponse([...db.subjects].sort((a: any, b: any) => a.name.localeCompare(b.name)));
  }

  if (path === '/api/subjects' && method === 'POST') {
    const id = Math.max(0, ...db.subjects.map((s: any) => s.id)) + 1;
    db.subjects.push({ id, code: String(body.code || '').toUpperCase(), name: body.name, category: body.category || 'General' });
    saveDb(db);
    return jsonResponse({ success: true, id });
  }

  const classSubMatch = path.match(/^\/api\/classes\/(\d+)\/subjects(?:\/(\d+))?$/);
  if (classSubMatch) {
    const classId = Number(classSubMatch[1]);
    const subId = classSubMatch[2] ? Number(classSubMatch[2]) : null;
    if (method === 'GET') {
      const list = db.class_subjects
        .filter((cs: any) => cs.class_id === classId)
        .map((cs: any) => {
          const s = db.subjects.find((sub: any) => sub.id === cs.subject_id) || {};
          return { ...cs, code: s.code, name: s.name, category: s.category };
        });
      return jsonResponse(list);
    }
    if (method === 'POST') {
      const existing = db.class_subjects.find((cs: any) => cs.class_id === classId && cs.subject_id === Number(body.subject_id));
      if (existing) {
        existing.max_assignment = body.max_assignment ?? 10;
        existing.max_test = body.max_test ?? 20;
        existing.max_exam = body.max_exam ?? 70;
      } else {
        db.class_subjects.push({
          id: Math.max(0, ...db.class_subjects.map((c: any) => c.id)) + 1,
          class_id: classId,
          subject_id: Number(body.subject_id),
          max_assignment: body.max_assignment ?? 10,
          max_test: body.max_test ?? 20,
          max_exam: body.max_exam ?? 70,
        });
      }
      saveDb(db);
      return jsonResponse({ success: true });
    }
    if (method === 'DELETE' && subId) {
      db.class_subjects = db.class_subjects.filter((cs: any) => !(cs.class_id === classId && cs.subject_id === subId));
      saveDb(db);
      return jsonResponse({ success: true });
    }
  }

  // STUDENTS
  if (path === '/api/students' && method === 'GET') {
    const classId = url.searchParams.get('class_id');
    const arm = url.searchParams.get('arm');
    const status = url.searchParams.get('status') || 'active';
    const search = (url.searchParams.get('search') || '').toLowerCase();

    const list = db.students
      .filter((s: any) => {
        if (status !== 'all' && s.status !== status) return false;
        if (classId && classId !== 'ALL' && s.class_id !== Number(classId)) return false;
        if (arm && arm !== 'ALL' && s.arm !== arm) return false;
        if (search) {
          const hay = `${s.first_name} ${s.last_name} ${s.student_id} ${s.admission_no}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .map((s: any) => {
        const cls = db.classes.find((c: any) => c.id === s.class_id);
        return { ...s, class_name: cls?.name, class_section: cls?.section };
      })
      .sort((a: any, b: any) => a.last_name.localeCompare(b.last_name));
    return jsonResponse(list);
  }

  if (path === '/api/students' && method === 'POST') {
    const id = Math.max(0, ...db.students.map((s: any) => s.id)) + 1;
    const student_id = body.student_id || `STU/2026/${String(id).padStart(3, '0')}`;
    const admission_no = body.admission_no || `ADM-2026-${String(id).padStart(3, '0')}`;
    db.students.push({
      id,
      student_id,
      admission_no,
      first_name: body.first_name,
      last_name: body.last_name,
      middle_name: body.middle_name || '',
      gender: body.gender,
      dob: body.dob || '2014-01-01',
      class_id: Number(body.class_id),
      arm: body.arm || 'A',
      photo: body.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      parent_name: body.parent_name || '',
      parent_phone: body.parent_phone || '',
      parent_email: body.parent_email || '',
      parent_address: body.parent_address || '',
      status: 'active',
    });
    saveDb(db);
    return jsonResponse({ success: true, id, student_id, admission_no });
  }

  if (path === '/api/students/promote' && method === 'POST') {
    const ids: number[] = body.student_ids || [];
    const targetClassId = Number(body.target_class_id);
    for (const s of db.students) {
      if (ids.includes(s.id)) {
        s.class_id = targetClassId;
        if (body.target_arm) s.arm = body.target_arm;
      }
    }
    saveDb(db);
    return jsonResponse({ success: true, count: ids.length });
  }

  // SCORES
  if (path === '/api/scores' && method === 'GET') {
    const classId = Number(url.searchParams.get('class_id'));
    const arm = url.searchParams.get('arm');
    const subjectId = Number(url.searchParams.get('subject_id'));
    const termId = Number(url.searchParams.get('term_id') || 1);
    const sessionId = Number(url.searchParams.get('session_id') || 1);

    const students = db.students.filter((s: any) =>
      s.class_id === classId && s.status === 'active' && (!arm || arm === 'ALL' || s.arm === arm)
    );
    const rows = students.map((student: any) => {
      const sc = db.scores.find((x: any) =>
        x.student_id === student.id && x.subject_id === subjectId && x.term_id === termId && x.session_id === sessionId
      );
      return {
        student_id: student.id,
        student_code: student.student_id,
        admission_no: student.admission_no,
        student_name: `${student.last_name} ${student.first_name}`.trim(),
        arm: student.arm,
        photo: student.photo,
        assignment_score: sc?.assignment_score || 0,
        test_score: sc?.test_score || 0,
        exam_score: sc?.exam_score || 0,
        total_score: sc?.total_score || 0,
        percentage: sc?.percentage || 0,
        grade: sc?.grade || 'F',
        remark: sc?.remark || 'Fail',
        score_id: sc?.id || null,
      };
    });
    return jsonResponse(rows);
  }

  if (path === '/api/scores/batch' && method === 'POST') {
    const classId = Number(body.class_id);
    const arm = body.arm || 'A';
    const subjectId = Number(body.subject_id);
    const termId = Number(body.term_id || 1);
    const sessionId = Number(body.session_id || 1);
    const list = body.scores || [];

    for (const item of list) {
      const ca = Math.min(10, Math.max(0, Number(item.assignment_score) || 0));
      const test = Math.min(20, Math.max(0, Number(item.test_score) || 0));
      const exam = Math.min(70, Math.max(0, Number(item.exam_score) || 0));
      const total = Number((ca + test + exam).toFixed(1));
      const { grade, remark } = calculateGrade(total);

      const existing = db.scores.find((x: any) =>
        x.student_id === item.student_id && x.subject_id === subjectId && x.term_id === termId && x.session_id === sessionId
      );
      if (existing) {
        existing.assignment_score = ca;
        existing.test_score = test;
        existing.exam_score = exam;
        existing.total_score = total;
        existing.percentage = total;
        existing.grade = grade;
        existing.remark = remark;
      } else {
        db.scores.push({
          id: Math.max(0, ...db.scores.map((s: any) => s.id)) + 1,
          student_id: item.student_id,
          subject_id: subjectId,
          class_id: classId,
          arm: item.arm || arm,
          term_id: termId,
          session_id: sessionId,
          assignment_score: ca,
          test_score: test,
          exam_score: exam,
          total_score: total,
          percentage: total,
          grade,
          remark,
          entered_by: body.entered_by || 'Teacher',
        });
      }
    }
    recomputeClassRankings(db, classId, arm, termId, sessionId);
    saveDb(db);
    return jsonResponse({ success: true, count: list.length });
  }

  // RANKINGS
  if (path === '/api/rankings' && method === 'GET') {
    const classId = Number(url.searchParams.get('class_id') || 3);
    const arm = url.searchParams.get('arm') || 'A';
    const termId = Number(url.searchParams.get('term_id') || 1);
    const sessionId = Number(url.searchParams.get('session_id') || 1);
    const rankings = recomputeClassRankings(db, classId, arm, termId, sessionId);
    saveDb(db);
    return jsonResponse(rankings);
  }

  // REPORT CARDS
  const rcCommentsMatch = path.match(/^\/api\/report-cards\/(\d+)\/comments$/);
  if (rcCommentsMatch && method === 'PUT') {
    const studentId = Number(rcCommentsMatch[1]);
    const termId = Number(body.term_id || 1);
    const sessionId = Number(body.session_id || 1);
    const rc = db.report_cards.find((r: any) => r.student_id === studentId && r.term_id === termId && r.session_id === sessionId);
    if (rc) {
      if (body.teacher_comment !== undefined) rc.teacher_comment = body.teacher_comment;
      if (body.principal_comment !== undefined) rc.principal_comment = body.principal_comment;
      if (body.affective_traits) rc.affective_traits = JSON.stringify(body.affective_traits);
      if (body.psychomotor_traits) rc.psychomotor_traits = JSON.stringify(body.psychomotor_traits);
      saveDb(db);
    }
    return jsonResponse({ success: true });
  }

  const rcMatch = path.match(/^\/api\/report-cards\/(\d+)$/);
  if (rcMatch && method === 'GET') {
    const studentId = Number(rcMatch[1]);
    const termId = Number(url.searchParams.get('term_id') || 1);
    const sessionId = Number(url.searchParams.get('session_id') || 1);

    const student = db.students.find((s: any) => s.id === studentId);
    if (!student) return jsonResponse({ error: 'Student not found' }, 404);
    const cls = db.classes.find((c: any) => c.id === student.class_id);
    const studentFull = { ...student, class_name: cls?.name, class_section: cls?.section };

    recomputeClassRankings(db, student.class_id, student.arm, termId, sessionId);
    saveDb(db);

    const reportCard = db.report_cards.find((r: any) => r.student_id === studentId && r.term_id === termId && r.session_id === sessionId);
    const session = db.sessions.find((s: any) => s.id === sessionId) || db.sessions[0];
    const term = db.terms.find((t: any) => t.id === termId) || db.terms[0];
    const attendance = db.attendance.find((a: any) => a.student_id === studentId && a.term_id === termId && a.session_id === sessionId) || {
      days_opened: term?.days_opened || 65,
      days_present: 62,
      days_absent: 3,
      punctuality_rating: 'Very Good',
    };

    const classScores = db.scores.filter((sc: any) => sc.class_id === student.class_id && sc.arm === student.arm && sc.term_id === termId && sc.session_id === sessionId);
    const studentScores = classScores.filter((sc: any) => sc.student_id === studentId);

    const enrichedSubjects = studentScores.map((sc: any) => {
      const sub = db.subjects.find((s: any) => s.id === sc.subject_id) || {};
      const peers = classScores.filter((p: any) => p.subject_id === sc.subject_id).sort((a: any, b: any) => b.total_score - a.total_score);
      const totals = peers.map((p: any) => Number(p.total_score) || 0);
      let rank = 1;
      let myPos = 1;
      peers.forEach((p: any, idx: number) => {
        if (idx > 0 && p.total_score < peers[idx - 1].total_score) rank = idx + 1;
        if (p.student_id === studentId) myPos = rank;
      });
      return {
        ...sc,
        subject_name: sub.name,
        subject_code: sub.code,
        subject_category: sub.category,
        class_highest: Math.max(...totals, 0),
        class_lowest: Math.min(...totals, 0),
        class_average: totals.length ? Number((totals.reduce((a: number, b: number) => a + b, 0) / totals.length).toFixed(1)) : 0,
        subject_position: myPos,
        subject_position_str: formatOrdinal(myPos),
      };
    });

    const allCards = db.report_cards.filter((r: any) => r.class_id === student.class_id && r.arm === student.arm && r.term_id === termId && r.session_id === sessionId);
    const classAvg = allCards.length ? Number((allCards.reduce((a: number, b: any) => a + (b.average_score || 0), 0) / allCards.length).toFixed(2)) : 0;
    const teacher = db.teachers.find((t: any) => t.assigned_class_id === student.class_id && t.assigned_arm === student.arm) || db.teachers[0];

    return jsonResponse({
      student: studentFull,
      session,
      term,
      reportCard: {
        id: reportCard?.id,
        total_score: reportCard?.total_score ?? 0,
        max_possible_score: reportCard?.max_possible_score ?? 800,
        average_score: reportCard?.average_score ?? 0,
        position: reportCard?.position ?? 1,
        position_str: `${formatOrdinal(reportCard?.position ?? 1)} Position`,
        total_students: reportCard?.total_students ?? 1,
        class_average: classAvg,
        teacher_comment: reportCard?.teacher_comment || 'Good performance.',
        principal_comment: reportCard?.principal_comment || 'Satisfactory result.',
        status: 'published',
        published_at: reportCard?.published_at,
        next_term_resumption: term?.next_term_resumption || '2026-01-12',
      },
      attendance,
      subjects: enrichedSubjects,
      affective_traits: reportCard?.affective_traits ? JSON.parse(reportCard.affective_traits) : [],
      psychomotor_traits: reportCard?.psychomotor_traits ? JSON.parse(reportCard.psychomotor_traits) : [],
      teacher,
      principal: { name: 'Dr. Grace Williams', qualification: 'Ph.D. Educational Admin' },
      school_info: {
        name: 'TONY GROUP OF SCHOOLS',
        motto: 'Knowledge, Integrity & Distinction',
        address: '12-16 Victoria Island Boulevard, Lagos, Nigeria',
        phone: '+234 1 800 2739 / +234 803 123 4567',
        email: 'info@tonygroupofschools.edu.ng',
        website: 'www.tonygroupofschools.edu.ng',
      },
    });
  }

  // ANALYTICS
  if (path === '/api/analytics' && method === 'GET') {
    const classId = Number(url.searchParams.get('class_id') || 3);
    const arm = url.searchParams.get('arm') || 'A';
    const termId = Number(url.searchParams.get('term_id') || 1);
    const sessionId = Number(url.searchParams.get('session_id') || 1);

    const ranked = recomputeClassRankings(db, classId, arm, termId, sessionId);
    saveDb(db);

    const totalClassStudents = ranked.length;
    const classAverages = ranked.map((r: any) => r.average_score);
    const highestScore = ranked.length ? ranked[0].total_score : 0;
    const lowestScore = ranked.length ? ranked[ranked.length - 1].total_score : 0;
    const classAvg = classAverages.length ? Number((classAverages.reduce((a: number, b: number) => a + b, 0) / classAverages.length).toFixed(1)) : 0;
    const passing = ranked.filter((r: any) => r.average_score >= 50).length;
    const passRate = totalClassStudents ? Number(((passing / totalClassStudents) * 100).toFixed(1)) : 0;

    const classScores = db.scores.filter((sc: any) => sc.class_id === classId && sc.term_id === termId && sc.session_id === sessionId);
    const bySubject: Record<number, any[]> = {};
    for (const sc of classScores) {
      if (!bySubject[sc.subject_id]) bySubject[sc.subject_id] = [];
      bySubject[sc.subject_id].push(sc);
    }

    const subjectStats = Object.entries(bySubject).map(([sid, list]) => {
      const sub = db.subjects.find((s: any) => s.id === Number(sid)) || {};
      const totals = list.map((x: any) => Number(x.total_score) || 0);
      return {
        subject_id: Number(sid),
        subject_name: sub.name,
        subject_code: sub.code,
        avg_score: totals.reduce((a, b) => a + b, 0) / totals.length,
        max_score: Math.max(...totals),
        min_score: Math.min(...totals),
        student_count: totals.length,
      };
    }).sort((a, b) => b.avg_score - a.avg_score);

    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 } as Record<string, number>;
    for (const sc of classScores) {
      if (gradeDistribution[sc.grade] !== undefined) gradeDistribution[sc.grade]++;
    }

    return jsonResponse({
      overall: {
        totalStudents: db.students.filter((s: any) => s.status === 'active').length,
        totalTeachers: db.teachers.length,
        totalClasses: db.classes.length,
        totalSubjects: db.subjects.length,
      },
      classStats: {
        totalClassStudents,
        classAvg,
        highestScore,
        lowestScore,
        passRate,
        failureRate: totalClassStudents ? Number((100 - passRate).toFixed(1)) : 0,
      },
      top10: ranked.slice(0, 10),
      bestSubjects: subjectStats.slice(0, 5),
      lowestSubjects: [...subjectStats].reverse().slice(0, 5),
      gradeDistribution,
    });
  }

  // PARENT PERFORMANCE HISTORY
  if (path === '/api/parent/performance-history' && method === 'GET') {
    const studentId = Number(url.searchParams.get('student_id') || 1);
    const history = db.report_cards
      .filter((rc: any) => rc.student_id === studentId)
      .map((rc: any) => {
        const term = db.terms.find((t: any) => t.id === rc.term_id);
        const session = db.sessions.find((s: any) => s.id === rc.session_id);
        return {
          term_id: rc.term_id,
          session_id: rc.session_id,
          total_score: rc.total_score,
          average_score: rc.average_score,
          position: rc.position,
          total_students: rc.total_students,
          term_name: term?.name,
          session_name: session?.name,
        };
      });
    return jsonResponse(history);
  }

  return jsonResponse({ error: `Endpoint ${path} not found` }, 404);
}
