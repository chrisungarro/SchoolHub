import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  Filter, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import type { ClassItem, Subject, ScoreRow } from '../types';

export const ScoreEntryView: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(3); // JSS 1 default
  const [selectedArm, setSelectedArm] = useState<string>('A');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(2); // Mathematics default
  const [selectedTermId, setSelectedTermId] = useState<number>(1);
  const [selectedSessionId, setSelectedSessionId] = useState<number>(1);

  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchScores();
    }
  }, [selectedClassId, selectedArm, selectedSubjectId, selectedTermId, selectedSessionId]);

  const fetchMetadata = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
      ]);
      const clsData = await clsRes.json();
      const subData = await subRes.json();
      setClasses(clsData);
      setSubjects(subData);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScores = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(
        `/api/scores?class_id=${selectedClassId}&arm=${selectedArm}&subject_id=${selectedSubjectId}&term_id=${selectedTermId}&session_id=${selectedSessionId}`
      );
      const data = await res.json();
      setScoreRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper grading formula
  const getGradeAndRemark = (total: number) => {
    const score = Math.round(total || 0);
    if (score >= 70) return { grade: 'A', remark: 'Excellent', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 60) return { grade: 'B', remark: 'Very Good', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (score >= 50) return { grade: 'C', remark: 'Good', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (score >= 45) return { grade: 'D', remark: 'Fair', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (score >= 40) return { grade: 'E', remark: 'Pass', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { grade: 'F', remark: 'Fail', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  // Handle score change live
  const handleScoreChange = (index: number, field: 'assignment_score' | 'test_score' | 'exam_score', value: string) => {
    const num = Number(value) || 0;
    const updated = [...scoreRows];
    const row = { ...updated[index], [field]: num };

    // Auto-calculate Total = Assignment + Test + Exam
    const ca = Number(row.assignment_score) || 0;
    const test = Number(row.test_score) || 0;
    const exam = Number(row.exam_score) || 0;
    const total = Number((ca + test + exam).toFixed(1));
    const percentage = total;
    const { grade, remark } = getGradeAndRemark(total);

    row.total_score = total;
    row.percentage = percentage;
    row.grade = grade;
    row.remark = remark;

    updated[index] = row;
    setScoreRows(updated);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/scores/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          arm: selectedArm,
          subject_id: selectedSubjectId,
          term_id: selectedTermId,
          session_id: selectedSessionId,
          scores: scoreRows,
          entered_by: 'Teacher',
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    const url = `/api/scores/export-excel?class_id=${selectedClassId}&arm=${selectedArm}&subject_id=${selectedSubjectId}&term_id=${selectedTermId}&session_id=${selectedSessionId}`;
    try {
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('spreadsheetml')) {
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedClass?.name || 'Class'}_${selectedSubject?.code || 'Subject'}_Scores.xlsx`.replace(/\s+/g, '_');
        link.click();
        return;
      }
    } catch {}

    // Client-side CSV fallback for static deployments (Vercel)
    const headers = ['Student ID', 'Admission No', 'Student Name', 'Arm', 'Assignment (Max 10)', 'Test (Max 20)', 'Exam (Max 70)', 'Total (Max 100)', 'Grade', 'Remark'];
    const csvRows = [
      headers.join(','),
      ...scoreRows.map(r => [
        `"${r.student_code}"`,
        `"${r.admission_no}"`,
        `"${r.student_name}"`,
        `"${r.arm}"`,
        r.assignment_score,
        r.test_score,
        r.exam_score,
        r.total_score,
        `"${r.grade}"`,
        `"${r.remark}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedClass?.name || 'Class'}_${selectedSubject?.code || 'Subject'}_Scores.csv`.replace(/\s+/g, '_');
    link.click();
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('class_id', String(selectedClassId));
    formData.append('arm', selectedArm);
    formData.append('subject_id', String(selectedSubjectId));
    formData.append('term_id', String(selectedTermId));
    formData.append('session_id', String(selectedSessionId));

    try {
      setImportStatus('Importing spreadsheet...');
      const res = await fetch('/api/scores/import-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus(`Successfully imported ${data.importedCount} student scores!`);
        fetchScores();
      } else {
        setImportStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message}`);
    } finally {
      setTimeout(() => setImportStatus(null), 5000);
      e.target.value = '';
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Score Entry & Assessment</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Auto-Calculations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter Assignment (10 marks), Test (20 marks), and Exam (70 marks). Total, Grade, and Position are computed automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Download Excel Sheet for offline score entry"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Excel</span>
          </button>

          {/* Import Excel */}
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import Excel</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="hidden" />
          </label>

          {/* Save All */}
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save All Scores'}</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importStatus && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>{importStatus}</span>
          </div>
          <button onClick={() => setImportStatus(null)} className="text-blue-500 hover:text-blue-700 font-bold">×</button>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">All scores successfully saved! Student class rankings and positions have been automatically recalculated.</span>
        </div>
      )}

      {/* Selector Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        
        {/* Class */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Class:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Arm */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Arm:</span>
          <select
            value={selectedArm}
            onChange={(e) => setSelectedArm(e.target.value)}
            className="font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="A">Arm A</option>
            <option value="B">Arm B</option>
            <option value="Gold">Gold</option>
            <option value="Diamond">Diamond</option>
          </select>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Subject:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            className="font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-indigo-700 focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        {/* Term */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Term:</span>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(Number(e.target.value))}
            className="font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>First Term (Current)</option>
            <option value={2}>Second Term</option>
            <option value={3}>Third Term</option>
          </select>
        </div>

        <div className="ml-auto text-slate-400 font-medium">
          Editing: <strong className="text-slate-800">{selectedSubject?.name}</strong> • {selectedClass?.name} {selectedArm}
        </div>
      </div>

      {/* Score Entry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-3 font-semibold">
            <span>Continuous Assessment Breakdown:</span>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">Assignment (10 marks)</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">Test Score (20 marks)</span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">Examination (70 marks)</span>
          </div>
          <span className="text-[11px] text-slate-400">Total Marks Obtainable: <strong>100</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                <th className="py-3 pl-4 w-12">#</th>
                <th className="py-3">Student Name</th>
                <th className="py-3">Admission No</th>
                <th className="py-3 text-center w-32">Assignment (Max 10)</th>
                <th className="py-3 text-center w-32">Test (Max 20)</th>
                <th className="py-3 text-center w-36">Exam (Max 70)</th>
                <th className="py-3 text-center w-28 font-black text-slate-800">Total (100)</th>
                <th className="py-3 text-center w-24">Grade</th>
                <th className="py-3 text-center pr-4 w-32">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scoreRows.length > 0 ? (
                scoreRows.map((row, idx) => {
                  const caExceeded = row.assignment_score > 10;
                  const testExceeded = row.test_score > 20;
                  const examExceeded = row.exam_score > 70;
                  const gradeInfo = getGradeAndRemark(row.total_score);

                  return (
                    <tr key={row.student_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={row.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                            alt={row.student_name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="font-bold text-slate-800">{row.student_name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-slate-500">{row.admission_no}</td>

                      {/* Assignment Input */}
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={row.assignment_score}
                          onChange={(e) => handleScoreChange(idx, 'assignment_score', e.target.value)}
                          className={`w-20 text-center py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                            caExceeded
                              ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-200'
                              : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                          }`}
                        />
                      </td>

                      {/* Test Input */}
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={row.test_score}
                          onChange={(e) => handleScoreChange(idx, 'test_score', e.target.value)}
                          className={`w-20 text-center py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                            testExceeded
                              ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-200'
                              : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                          }`}
                        />
                      </td>

                      {/* Exam Input */}
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="70"
                          value={row.exam_score}
                          onChange={(e) => handleScoreChange(idx, 'exam_score', e.target.value)}
                          className={`w-24 text-center py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                            examExceeded
                              ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-200'
                              : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                          }`}
                        />
                      </td>

                      {/* Total (Auto-calculated) */}
                      <td className="py-3 text-center font-black text-sm text-slate-900">
                        {row.total_score}
                      </td>

                      {/* Grade Badge */}
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black border ${gradeInfo.color}`}>
                          {row.grade}
                        </span>
                      </td>

                      {/* Remark */}
                      <td className="py-3 text-center pr-4">
                        <span className="font-semibold text-slate-700 text-xs">
                          {row.remark}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading class roster and scores...' : 'No students found in this class/arm.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Total Students in Sheet: <strong className="text-slate-800">{scoreRows.length}</strong>
          </span>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save All Scores'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
