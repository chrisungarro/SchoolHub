import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'school.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- 1. SESSIONS
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_current INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT
    );

    -- 2. TERMS
    CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_current INTEGER DEFAULT 0,
      next_term_resumption TEXT,
      days_opened INTEGER DEFAULT 60,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    -- 3. CLASSES
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      section TEXT NOT NULL DEFAULT 'Junior Secondary',
      order_index INTEGER DEFAULT 1,
      arms TEXT DEFAULT 'A,B'
    );

    -- 4. SUBJECTS
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'General'
    );

    -- 5. CLASS_SUBJECTS (Subject assignments to classes & maximum score weights)
    CREATE TABLE IF NOT EXISTS class_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      max_assignment INTEGER DEFAULT 10,
      max_test INTEGER DEFAULT 20,
      max_exam INTEGER DEFAULT 70,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE(class_id, subject_id)
    );

    -- 6. TEACHERS
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      qualification TEXT,
      assigned_class_id INTEGER,
      assigned_arm TEXT,
      photo TEXT,
      FOREIGN KEY (assigned_class_id) REFERENCES classes(id) ON DELETE SET NULL
    );

    -- 7. STUDENTS
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      admission_no TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      middle_name TEXT,
      gender TEXT NOT NULL,
      dob TEXT,
      class_id INTEGER NOT NULL,
      arm TEXT NOT NULL DEFAULT 'A',
      photo TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      parent_address TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT
    );

    -- 8. SCORES
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      arm TEXT NOT NULL,
      term_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      assignment_score REAL DEFAULT 0,
      test_score REAL DEFAULT 0,
      exam_score REAL DEFAULT 0,
      total_score REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      grade TEXT DEFAULT 'F',
      remark TEXT DEFAULT 'Fail',
      entered_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE(student_id, subject_id, term_id, session_id)
    );

    -- 9. ATTENDANCE
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      term_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      days_opened INTEGER DEFAULT 60,
      days_present INTEGER DEFAULT 58,
      days_absent INTEGER DEFAULT 2,
      punctuality_rating TEXT DEFAULT 'Excellent',
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE(student_id, term_id, session_id)
    );

    -- 10. REPORT_CARDS
    CREATE TABLE IF NOT EXISTS report_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      arm TEXT NOT NULL,
      term_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      total_score REAL DEFAULT 0,
      max_possible_score REAL DEFAULT 0,
      average_score REAL DEFAULT 0,
      position INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      teacher_comment TEXT,
      principal_comment TEXT,
      affective_traits TEXT,
      psychomotor_traits TEXT,
      status TEXT DEFAULT 'published',
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE(student_id, term_id, session_id)
    );

    -- 11. USERS (Roles: Administrator, Principal, Teacher, Parent)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      student_id INTEGER,
      teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ SQLite Database & Tables initialized successfully.');
}
