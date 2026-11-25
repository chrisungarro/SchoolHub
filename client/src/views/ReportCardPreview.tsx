import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Edit3, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  X, 
  Calendar, 
  User, 
  Award,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ReportCardFull, Student } from '../types';

interface ReportCardPreviewProps {
  studentId?: number;
  onBack?: () => void;
}

export const ReportCardPreview: React.FC<ReportCardPreviewProps> = ({ studentId = 1, onBack }) => {
  const [data, setData] = useState<ReportCardFull | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<number>(studentId);

  // Edit Comments Modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [teacherComment, setTeacherComment] = useState<string>('');
  const [principalComment, setPrincipalComment] = useState<string>('');
  const [affectiveTraits, setAffectiveTraits] = useState<{ name: string; score: number }[]>([]);
  const [psychomotorTraits, setPsychomotorTraits] = useState<{ name: string; score: number }[]>([]);
  const [savingComments, setSavingComments] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStudentsRoster();
  }, []);

  useEffect(() => {
    if (currentStudentId) {
      fetchReportCard(currentStudentId);
    }
  }, [currentStudentId]);

  const fetchStudentsRoster = async () => {
    try {
      const res = await fetch('/api/students?status=active');
      const list = await res.json();
      setStudentsList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReportCard = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report-cards/${id}?term_id=1&session_id=1`);
      const reportData: ReportCardFull = await res.json();
      setData(reportData);
      setTeacherComment(reportData.reportCard.teacher_comment);
      setPrincipalComment(reportData.reportCard.principal_comment);
      setAffectiveTraits(reportData.affective_traits);
      setPsychomotorTraits(reportData.psychomotor_traits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloadingPdf(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const filename = `${data?.student.last_name}_${data?.student.first_name}_ReportCard.pdf`.replace(/\s+/g, '_');
      pdf.save(filename);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveComments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingComments(true);
    try {
      const res = await fetch(`/api/report-cards/${currentStudentId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term_id: 1,
          session_id: 1,
          teacher_comment: teacherComment,
          principal_comment: principalComment,
          affective_traits: affectiveTraits,
          psychomotor_traits: psychomotorTraits,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchReportCard(currentStudentId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingComments(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold">Generating authentic academic report card...</p>
      </div>
    );
  }

  const { student, reportCard, attendance, subjects, school_info, teacher, principal } = data;

  return (
    <div className="space-y-6">
      
      {/* Action Toolbar (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Official Student Report Card</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Print-ready academic terminal report with subject breakdowns, positions, and comments.
            </p>
          </div>
        </div>

        {/* Student Dropdown Selector & Print Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select
            value={currentStudentId}
            onChange={(e) => setCurrentStudentId(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {studentsList.map(s => (
              <option key={s.id} value={s.id}>
                {s.last_name} {s.first_name} ({s.admission_no}) - {s.class_name} {s.arm}
              </option>
            ))}
          </select>

          {/* Edit Comments */}
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>Edit Remarks</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* OFFICIAL REPORT CARD CONTAINER (TARGET FOR PRINT & PDF)      */}
      {/* ============================================================= */}
      <div
        ref={reportRef}
        className="print-card-container bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 max-w-4xl mx-auto text-slate-900 relative"
      >
        {/* Outer Official Double Border for Distinction */}
        <div className="border-4 border-slate-900 p-5 rounded-xl">
          
          {/* 1. SCHOOL OFFICIAL CREST & HEADER */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <div className="flex justify-center items-center gap-3 mb-1">
              <div className="w-14 h-14 rounded-2xl bg-indigo-900 text-amber-400 flex items-center justify-center font-black text-2xl shadow-inner border-2 border-amber-300">
                <GraduationCap className="w-9 h-9" />
              </div>
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-none uppercase">
                  {school_info.name}
                </h2>
                <p className="text-xs font-bold text-indigo-900 italic tracking-wider mt-0.5">
                  Motto: "{school_info.motto}"
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {school_info.address} • Tel: {school_info.phone} • Email: {school_info.email}
                </p>
              </div>
            </div>

            <div className="mt-3 inline-block bg-slate-900 text-white px-6 py-1 rounded-full text-xs font-black tracking-widest uppercase">
              Continuous Assessment & Terminal Examination Report Card
            </div>
          </div>

          {/* 2. STUDENT BIO-DATA & ATTENDANCE BOX */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-slate-300 text-xs">
            {/* Student Photo */}
            <div className="flex flex-col items-center justify-center border-r border-slate-200 pr-2">
              <img
                src={student.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                alt={student.first_name}
                className="w-24 h-24 rounded-xl object-cover border-2 border-slate-800 shadow-xs"
              />
              <span className="mt-1 font-mono font-bold text-[10px] text-slate-600">{student.admission_no}</span>
            </div>

            {/* Biographical Info (2 cols) */}
            <div className="md:col-span-2 space-y-1.5 justify-center flex flex-col">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Student Name:</span>
                  <p className="font-black text-slate-900 text-sm">{student.last_name} {student.first_name} {student.middle_name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Student ID:</span>
                  <p className="font-mono font-bold text-slate-800">{student.student_id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Class & Arm:</span>
                  <p className="font-bold text-indigo-900">{student.class_name} - Arm {student.arm}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Gender / DOB:</span>
                  <p className="font-semibold text-slate-800">{student.gender} • {student.dob}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Academic Session:</span>
                  <p className="font-bold text-slate-800">2025/2026 Session</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Term:</span>
                  <p className="font-bold text-emerald-800">First Term</p>
                </div>
              </div>
            </div>

            {/* Attendance & Term Calendar Box (1 col) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-col justify-center space-y-1">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                Attendance Record
              </span>
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-slate-500">Days School Opened:</span>
                <span className="font-bold text-slate-800">{attendance.days_opened}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Days Present:</span>
                <span className="font-bold text-emerald-700">{attendance.days_present}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Days Absent:</span>
                <span className="font-bold text-rose-700">{attendance.days_absent}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200">
                <span className="text-slate-500">Punctuality:</span>
                <span className="font-bold text-indigo-700">{attendance.punctuality_rating}</span>
              </div>
            </div>
          </div>

          {/* 3. ACADEMIC PERFORMANCE SCORES TABLE */}
          <div className="py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
              <span>Cognitive Domain: Academic Performance Summary</span>
            </h3>

            <table className="w-full text-left border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-center text-[10px] uppercase tracking-wider">
                  <th className="border border-slate-900 py-2 px-2 text-left">Subjects Offered</th>
                  <th className="border border-slate-900 py-2 px-1 w-16">Assign.<br />(10)</th>
                  <th className="border border-slate-900 py-2 px-1 w-16">Test<br />(20)</th>
                  <th className="border border-slate-900 py-2 px-1 w-16">Exam<br />(70)</th>
                  <th className="border border-slate-900 py-2 px-1 w-16 bg-slate-800">Total<br />(100)</th>
                  <th className="border border-slate-900 py-2 px-1 w-14">Class<br />High</th>
                  <th className="border border-slate-900 py-2 px-1 w-14">Class<br />Low</th>
                  <th className="border border-slate-900 py-2 px-1 w-14">Class<br />Avg</th>
                  <th className="border border-slate-900 py-2 px-1 w-16">Subject<br />Pos.</th>
                  <th className="border border-slate-900 py-2 px-1 w-12">Grade</th>
                  <th className="border border-slate-900 py-2 px-2 text-left">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {subjects.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 text-[11px]">
                    <td className="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">
                      {s.subject_name} <span className="font-mono text-[9px] text-slate-400">({s.subject_code})</span>
                    </td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono">{s.assignment_score}</td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono">{s.test_score}</td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono">{s.exam_score}</td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono font-black text-slate-950 bg-slate-50">
                      {s.total_score}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono text-slate-500">{s.class_highest}</td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono text-slate-500">{s.class_lowest}</td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono text-slate-500">{s.class_average}</td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-bold text-indigo-700">
                      {s.subject_position_str}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-black">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        s.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        s.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        s.grade === 'C' ? 'bg-indigo-100 text-indigo-800' :
                        s.grade === 'D' ? 'bg-amber-100 text-amber-800' :
                        s.grade === 'E' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.grade}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-700 font-medium">
                      {s.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. OVERALL SUMMARY STATISTICS BAR */}
          <div className="bg-slate-100 border-2 border-slate-800 rounded-xl p-3 my-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center divide-x divide-slate-300">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Marks Obtained</span>
                <p className="text-base font-black text-slate-950">{reportCard.total_score} <span className="text-xs font-normal text-slate-500">/ {reportCard.max_possible_score}</span></p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Overall Percentage</span>
                <p className="text-base font-black text-indigo-700">{reportCard.average_score}%</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Position in Class</span>
                <p className="text-base font-black text-amber-600">
                  {reportCard.position_str} <span className="text-xs font-normal text-slate-500">out of {reportCard.total_students}</span>
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Class Average</span>
                <p className="text-base font-bold text-slate-700">{reportCard.class_average}%</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Decision / Outcome</span>
                <p className="text-sm font-black text-emerald-700 uppercase">PASSED (EXEMPLARY)</p>
              </div>
            </div>
          </div>

          {/* 5. AFFECTIVE & PSYCHOMOTOR DOMAINS + GRADING SCALE REFERENCE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3 border-t border-slate-200 text-xs">
            
            {/* Affective Traits (Rating: 1 - 5) */}
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
              <span className="font-bold text-slate-900 uppercase text-[10px] block mb-1.5 border-b pb-1">
                Affective Domain (Character)
              </span>
              <div className="space-y-1 text-[11px]">
                {data.affective_traits.map(t => (
                  <div key={t.name} className="flex justify-between items-center">
                    <span className="text-slate-600">{t.name}</span>
                    <span className="font-bold text-slate-800 font-mono">{'★'.repeat(t.score)} ({t.score}/5)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Psychomotor Traits */}
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
              <span className="font-bold text-slate-900 uppercase text-[10px] block mb-1.5 border-b pb-1">
                Psychomotor Domain (Skills)
              </span>
              <div className="space-y-1 text-[11px]">
                {data.psychomotor_traits.map(t => (
                  <div key={t.name} className="flex justify-between items-center">
                    <span className="text-slate-600">{t.name}</span>
                    <span className="font-bold text-slate-800 font-mono">{'★'.repeat(t.score)} ({t.score}/5)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Grading Scale Key */}
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
              <span className="font-bold text-slate-900 uppercase text-[10px] block mb-1.5 border-b pb-1">
                Grading System Scale
              </span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div><strong className="text-emerald-700">70–100%:</strong> A (Excellent)</div>
                <div><strong className="text-blue-700">60–69%:</strong> B (Very Good)</div>
                <div><strong className="text-indigo-700">50–59%:</strong> C (Good)</div>
                <div><strong className="text-amber-700">45–49%:</strong> D (Fair)</div>
                <div><strong className="text-orange-700">40–44%:</strong> E (Pass)</div>
                <div><strong className="text-rose-700">Below 40%:</strong> F (Fail)</div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-medium">
                Next Term Resumes: <strong className="text-slate-800">{reportCard.next_term_resumption}</strong>
              </div>
            </div>

          </div>

          {/* 6. TEACHER & PRINCIPAL COMMENTS & SIGNATURES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-slate-900 text-xs">
            
            {/* Form Teacher's Section */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <span className="text-[10px] font-bold uppercase text-slate-500">Form Teacher's Comment:</span>
              <p className="font-semibold text-slate-900 italic mt-1 min-h-[40px] text-[11px]">
                "{reportCard.teacher_comment}"
              </p>
              <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex justify-between items-end">
                <div>
                  <p className="font-bold text-slate-900">{teacher.name}</p>
                  <p className="text-[10px] text-slate-500">{teacher.qualification}</p>
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-slate-800 mb-1"></div>
                  <span className="text-[9px] text-slate-400">Teacher's Signature</span>
                </div>
              </div>
            </div>

            {/* Principal's Section with Official Stamp */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white relative overflow-hidden">
              <span className="text-[10px] font-bold uppercase text-slate-500">Principal's Comment & Endorsement:</span>
              <p className="font-semibold text-slate-900 italic mt-1 min-h-[40px] text-[11px]">
                "{reportCard.principal_comment}"
              </p>
              <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex justify-between items-end">
                <div>
                  <p className="font-bold text-slate-900">{principal.name}</p>
                  <p className="text-[10px] text-slate-500">{principal.qualification}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Official School Stamp Seal */}
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-700 flex flex-col items-center justify-center text-[7px] font-black uppercase text-indigo-800 leading-tight rotate-12 bg-indigo-50/40">
                    <span>TONY</span>
                    <span>SEAL</span>
                    <span>2026</span>
                  </div>
                  <div className="text-right">
                    <div className="w-24 border-b border-slate-800 mb-1"></div>
                    <span className="text-[9px] text-slate-400">Principal's Signature</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT COMMENTS & ATTRIBUTES */}
      {/* ------------------------------------------------------------- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Edit Remarks & Domain Ratings</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComments} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form Teacher's Comment</label>
                <textarea
                  rows={2}
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Principal's Endorsement Comment</label>
                <textarea
                  rows={2}
                  value={principalComment}
                  onChange={(e) => setPrincipalComment(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Affective Ratings (1 to 5 Stars):</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {affectiveTraits.map((t, idx) => (
                    <div key={t.name} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-600">{t.name}</span>
                      <select
                        value={t.score}
                        onChange={(e) => {
                          const updated = [...affectiveTraits];
                          updated[idx].score = Number(e.target.value);
                          setAffectiveTraits(updated);
                        }}
                        className="text-xs font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5"
                      >
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingComments}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  {savingComments ? 'Saving...' : 'Save Remarks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
