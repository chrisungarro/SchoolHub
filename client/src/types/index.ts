export type UserRole = 'Administrator' | 'Principal' | 'Teacher' | 'Parent';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  student?: Student | null;
  teacher?: Teacher | null;
}

export interface Student {
  id: number;
  student_id: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: 'Male' | 'Female';
  dob: string;
  class_id: number;
  class_name?: string;
  class_section?: string;
  arm: string;
  photo?: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  parent_address?: string;
  status: 'active' | 'graduated' | 'transferred' | 'promoted';
  created_at?: string;
}

export interface Teacher {
  id: number;
  staff_id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  assigned_class_id?: number;
  class_name?: string;
  assigned_arm?: string;
  photo?: string;
}

export interface ClassItem {
  id: number;
  name: string;
  section: string;
  order_index: number;
  arms: string; // e.g. "A,B"
  student_count?: number;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  category: string;
}

export interface ClassSubject {
  id: number;
  class_id: number;
  subject_id: number;
  code: string;
  name: string;
  category: string;
  max_assignment: number;
  max_test: number;
  max_exam: number;
}

export interface Session {
  id: number;
  name: string;
  is_current: number;
  start_date?: string;
  end_date?: string;
}

export interface Term {
  id: number;
  session_id: number;
  name: string;
  is_current: number;
  next_term_resumption?: string;
  days_opened: number;
}

export interface ScoreRow {
  student_id: number;
  student_code: string;
  admission_no: string;
  student_name: string;
  arm: string;
  photo?: string;
  assignment_score: number;
  test_score: number;
  exam_score: number;
  total_score: number;
  percentage: number;
  grade: string;
  remark: string;
  score_id?: number | null;
}

export interface SubjectReportItem {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  subject_category: string;
  assignment_score: number;
  test_score: number;
  exam_score: number;
  total_score: number;
  percentage: number;
  grade: string;
  remark: string;
  class_highest: number;
  class_lowest: number;
  class_average: number;
  subject_position: number;
  subject_position_str: string;
}

export interface ReportCardFull {
  student: Student;
  session: Session;
  term: Term;
  reportCard: {
    id?: number;
    total_score: number;
    max_possible_score: number;
    average_score: number;
    position: number;
    position_str: string;
    total_students: number;
    class_average: number;
    teacher_comment: string;
    principal_comment: string;
    status: string;
    published_at?: string;
    next_term_resumption: string;
  };
  attendance: {
    days_opened: number;
    days_present: number;
    days_absent: number;
    punctuality_rating: string;
  };
  subjects: SubjectReportItem[];
  affective_traits: { name: string; score: number }[];
  psychomotor_traits: { name: string; score: number }[];
  teacher: { name: string; qualification: string };
  principal: { name: string; qualification: string };
  school_info: {
    name: string;
    motto: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

export interface RankedStudent {
  student_id: number;
  student_name: string;
  admission_no: string;
  gender: string;
  photo?: string;
  class_id: number;
  arm: string;
  scores_count: number;
  total_score: number;
  max_possible_score: number;
  average_score: number;
  position: number;
  position_str: string;
  total_students: number;
  isTied: boolean;
}

export interface AnalyticsData {
  overall: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
  };
  classStats: {
    totalClassStudents: number;
    classAvg: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    failureRate: number;
  };
  top10: RankedStudent[];
  bestSubjects: {
    subject_id: number;
    subject_name: string;
    subject_code: string;
    avg_score: number;
    max_score: number;
    min_score: number;
    student_count: number;
  }[];
  lowestSubjects: {
    subject_id: number;
    subject_name: string;
    subject_code: string;
    avg_score: number;
    max_score: number;
    min_score: number;
    student_count: number;
  }[];
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    F: number;
  };
}
