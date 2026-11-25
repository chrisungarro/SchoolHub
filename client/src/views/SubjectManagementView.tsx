import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Settings2, 
  CheckCircle, 
  Layers, 
  X, 
  Trash2, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import type { Subject, ClassItem, ClassSubject } from '../types';

export const SubjectManagementView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(3); // JSS 1 default
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);

  // Forms
  const [newSubject, setNewSubject] = useState({ code: '', name: '', category: 'Sciences' });
  const [assignForm, setAssignForm] = useState({
    subject_id: 1,
    max_assignment: 10,
    max_test: 20,
    max_exam: 70,
  });

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassSubjects(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchInitial = async () => {
    try {
      const [subRes, clsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/classes'),
      ]);
      const subs = await subRes.json();
      const cls = await clsRes.json();
      setSubjects(subs);
      setClasses(cls);
      if (subs.length > 0) {
        setAssignForm(prev => ({ ...prev, subject_id: subs[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSubjects = async (clsId: number) => {
    try {
      const res = await fetch(`/api/classes/${clsId}/subjects`);
      const data = await res.json();
      setClassSubjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });
      if (res.ok) {
        setShowAddSubjectModal(false);
        setNewSubject({ code: '', name: '', category: 'Sciences' });
        fetchInitial();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/classes/${selectedClassId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      if (res.ok) {
        setShowAssignModal(false);
        fetchClassSubjects(selectedClassId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveSubject = async (subjectId: number) => {
    if (!confirm('Are you sure you want to unassign this subject from this class?')) return;
    try {
      const res = await fetch(`/api/classes/${selectedClassId}/subjects/${subjectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchClassSubjects(selectedClassId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Subject & Curriculum Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school subjects, class curricula, and score assessment weights (Assignment: 10, Test: 20, Exam: 70).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Subject</span>
          </button>

          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Assign to {selectedClass?.name || 'Class'}</span>
          </button>
        </div>
      </div>

      {/* Class Curriculum Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Class Selector & Assigned Subjects Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Class Curriculum & Assessment Structure</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Maximum marks breakdown per subject for selected class
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Select Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.section})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assessment Breakdown Callout */}
          <div className="mb-4 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-950">
            <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold">Standard Weight Distribution: </span>
              Continuous Assessment (Assignment: <strong>10 marks</strong>) + Continuous Assessment (Test: <strong>20 marks</strong>) + Terminal Exam (<strong>70 marks</strong>) = <strong>100 Marks</strong> Total.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5 pl-2">Subject Name</th>
                  <th className="pb-2.5">Code</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5 text-center">Assignment (CA)</th>
                  <th className="pb-2.5 text-center">Test (CA)</th>
                  <th className="pb-2.5 text-center">Exam</th>
                  <th className="pb-2.5 text-center font-bold text-slate-700">Total Max</th>
                  <th className="pb-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classSubjects.length > 0 ? (
                  classSubjects.map(sub => {
                    const totalMax = sub.max_assignment + sub.max_test + sub.max_exam;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-2 font-bold text-slate-900">{sub.name}</td>
                        <td className="py-3 font-mono text-indigo-600 font-bold">{sub.code}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {sub.category}
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono font-semibold text-slate-700">{sub.max_assignment}</td>
                        <td className="py-3 text-center font-mono font-semibold text-slate-700">{sub.max_test}</td>
                        <td className="py-3 text-center font-mono font-semibold text-slate-700">{sub.max_exam}</td>
                        <td className="py-3 text-center font-mono font-bold text-indigo-700">{totalMax}</td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => handleRemoveSubject(sub.subject_id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Unassign Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No subjects currently assigned to {selectedClass?.name}. Click "Assign to {selectedClass?.name}" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Column: Master Subjects Catalog (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-700" />
                <span>Master Subjects Directory</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">All registered school subjects</p>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {subjects.length} subjects
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {subjects.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{s.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.code} • {s.category}</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE SUBJECT */}
      {/* ------------------------------------------------------------- */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Subject</h2>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code (e.g. MTH, ENG, ICT) *</label>
                <input
                  type="text"
                  required
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CHE"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Chemistry"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Category</label>
                <select
                  value={newSubject.category}
                  onChange={(e) => setNewSubject({ ...newSubject, category: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Languages">Languages</option>
                  <option value="Sciences">Sciences</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Vocational">Vocational / Technical</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ASSIGN SUBJECT TO CLASS */}
      {/* ------------------------------------------------------------- */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Assign Subject to {selectedClass?.name}</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Subject *</label>
                <select
                  value={assignForm.subject_id}
                  onChange={(e) => setAssignForm({ ...assignForm, subject_id: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Maximum Score Assessment Weights:</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Assignment</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={assignForm.max_assignment}
                      onChange={(e) => setAssignForm({ ...assignForm, max_assignment: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Test Score</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={assignForm.max_test}
                      onChange={(e) => setAssignForm({ ...assignForm, max_test: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Exam Score</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={assignForm.max_exam}
                      onChange={(e) => setAssignForm({ ...assignForm, max_exam: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 text-right">
                  Total: <strong className="text-indigo-600">{assignForm.max_assignment + assignForm.max_test + assignForm.max_exam} marks</strong>
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Assign to Curriculum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
