import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ArrowUpCircle, 
  Search, 
  Filter, 
  Eye, 
  Phone, 
  Mail, 
  Calendar, 
  X, 
  Check, 
  GraduationCap
} from 'lucide-react';
import type { Student, ClassItem } from '../types';

interface StudentManagementViewProps {
  onViewReportCard: (studentId: number) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({ onViewReportCard }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('3'); // JSS 1 default
  const [selectedArm, setSelectedArm] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showPromoteModal, setShowPromoteModal] = useState<boolean>(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Register Form State
  const [regForm, setRegForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    gender: 'Male',
    dob: '2014-05-15',
    class_id: 3,
    arm: 'A',
    student_id: '',
    admission_no: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    parent_address: '',
    photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
  });

  // Promote Form State
  const [targetClassId, setTargetClassId] = useState<number>(4); // JSS 2 default
  const [targetArm, setTargetArm] = useState<string>('A');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClassId, selectedArm, searchQuery]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/students?status=active`;
      if (selectedClassId && selectedClassId !== 'ALL') url += `&class_id=${selectedClassId}`;
      if (selectedArm && selectedArm !== 'ALL') url += `&arm=${selectedArm}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      if (res.ok) {
        setShowRegisterModal(false);
        // Reset form
        setRegForm({
          first_name: '',
          last_name: '',
          middle_name: '',
          gender: 'Male',
          dob: '2014-05-15',
          class_id: Number(selectedClassId) || 3,
          arm: 'A',
          student_id: '',
          admission_no: '',
          parent_name: '',
          parent_phone: '',
          parent_email: '',
          parent_address: '',
          photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
        });
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;

    try {
      const res = await fetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: selectedStudentIds,
          target_class_id: targetClassId,
          target_arm: targetArm,
        }),
      });

      if (res.ok) {
        setShowPromoteModal(false);
        setSelectedStudentIds([]);
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelectStudent = (id: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register students, manage parent contact information, and execute batch promotion.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Promote Students Button */}
          <button
            onClick={() => setShowPromoteModal(true)}
            disabled={selectedStudentIds.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedStudentIds.length > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Promote Selected ({selectedStudentIds.length})</span>
          </button>

          {/* Register New Student */}
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by student name, ID, or admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Arm Filter */}
        <select
          value={selectedArm}
          onChange={(e) => setSelectedArm(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Arms</option>
          <option value="A">Arm A</option>
          <option value="B">Arm B</option>
          <option value="Gold">Gold</option>
          <option value="Diamond">Diamond</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 pl-4 w-10">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && selectedStudentIds.length === students.length}
                    onChange={toggleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-3">Student Name</th>
                <th className="py-3">Student ID</th>
                <th className="py-3">Admission No</th>
                <th className="py-3">Class & Arm</th>
                <th className="py-3">Gender</th>
                <th className="py-3">Parent / Guardian</th>
                <th className="py-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length > 0 ? (
                students.map(s => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      <td className="py-3.5 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(s.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                            alt={`${s.first_name} ${s.last_name}`}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{s.last_name} {s.first_name} {s.middle_name}</p>
                            <span className="text-[10px] text-slate-400">DOB: {s.dob}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-600 font-medium">{s.student_id}</td>
                      <td className="py-3.5 font-mono text-indigo-600 font-semibold">{s.admission_no}</td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {s.class_name || 'Class'} - Arm {s.arm}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.gender === 'Female' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {s.gender}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div>
                          <p className="font-semibold text-slate-800">{s.parent_name || 'Guardian'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5 text-slate-400" /> {s.parent_phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right pr-4">
                        <button
                          onClick={() => onViewReportCard(s.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Report Card</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    {loading ? 'Loading students roster...' : 'No students matching the criteria found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: REGISTER STUDENT MODAL */}
      {/* ------------------------------------------------------------- */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Register New Student</h2>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-4">
              {/* Student Identity */}
              <div>
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Student Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.first_name}
                      onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                      placeholder="e.g. Kelechi"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.last_name}
                      onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                      placeholder="e.g. Eze"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={regForm.middle_name}
                      onChange={(e) => setRegForm({ ...regForm, middle_name: e.target.value })}
                      placeholder="e.g. David"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender *</label>
                    <select
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={regForm.dob}
                      onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class & Arm *</label>
                    <div className="flex gap-2">
                      <select
                        value={regForm.class_id}
                        onChange={(e) => setRegForm({ ...regForm, class_id: Number(e.target.value) })}
                        className="w-2/3 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={regForm.arm}
                        onChange={(e) => setRegForm({ ...regForm, arm: e.target.value })}
                        className="w-1/3 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="A">Arm A</option>
                        <option value="B">Arm B</option>
                        <option value="Gold">Gold</option>
                        <option value="Diamond">Diamond</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Student ID (Leave blank to auto-generate)
                    </label>
                    <input
                      type="text"
                      value={regForm.student_id}
                      onChange={(e) => setRegForm({ ...regForm, student_id: e.target.value })}
                      placeholder="STU/2026/020"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Admission Number (Leave blank to auto-generate)
                    </label>
                    <input
                      type="text"
                      value={regForm.admission_no}
                      onChange={(e) => setRegForm({ ...regForm, admission_no: e.target.value })}
                      placeholder="ADM-2026-020"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Photo URL</label>
                  <input
                    type="url"
                    value={regForm.photo}
                    onChange={(e) => setRegForm({ ...regForm, photo: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Parent / Guardian Information */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Parent / Guardian Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Parent Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.parent_name}
                      onChange={(e) => setRegForm({ ...regForm, parent_name: e.target.value })}
                      placeholder="e.g. Chief Emeka Eze"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Parent Phone *</label>
                    <input
                      type="tel"
                      required
                      value={regForm.parent_phone}
                      onChange={(e) => setRegForm({ ...regForm, parent_phone: e.target.value })}
                      placeholder="+234 803 000 0000"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Parent Email</label>
                    <input
                      type="email"
                      value={regForm.parent_email}
                      onChange={(e) => setRegForm({ ...regForm, parent_email: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={regForm.parent_address}
                    onChange={(e) => setRegForm({ ...regForm, parent_address: e.target.value })}
                    placeholder="Residential address in Lagos"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: STUDENT PROMOTION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ArrowUpCircle className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Promote Students</h2>
              </div>
              <button onClick={() => setShowPromoteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePromoteSubmit} className="space-y-4 mt-4">
              <p className="text-xs text-slate-600">
                You are about to promote <strong className="text-slate-900">{selectedStudentIds.length}</strong> selected student(s) to the next academic level.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class *</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.section})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Arm</label>
                <select
                  value={targetArm}
                  onChange={(e) => setTargetArm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="A">Arm A</option>
                  <option value="B">Arm B</option>
                  <option value="Gold">Gold</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
                >
                  Confirm Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
