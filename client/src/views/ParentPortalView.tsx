import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  HeartHandshake, 
  Trophy, 
  TrendingUp, 
  Download, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  BookOpen, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { ReportCardPreview } from './ReportCardPreview';

export const ParentPortalView: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'report-card'>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // If user has a linked student, use that, else default to student 1 (Chinedu Eze)
  const studentId = user?.student?.id || 1;

  useEffect(() => {
    fetchHistory();
  }, [studentId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/performance-history?student_id=${studentId}`);
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.student?.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
              alt="Student"
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Parent / Guardian Portal
                </span>
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled Active
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                {user?.student?.first_name ? `${user.student.first_name} ${user.student.last_name}` : 'Chinedu Eze'}
              </h1>
              <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                {user?.student?.admission_no || 'ADM-2026-001'} • {user?.student?.class_name || 'JSS 1'} Arm {user?.student?.arm || 'A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Academic Overview
            </button>
            <button
              onClick={() => setActiveTab('report-card')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'report-card'
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Terminal Report Card
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Highlights KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Class Position</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-600">1st Position</span>
                <span className="text-xs text-slate-400">/ 12 in class</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Top of Class Excellence
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative Average</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-600">82.4%</span>
                <span className="text-xs text-slate-400">Grade A</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Class Average: <strong className="text-slate-700">64.8%</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Term Attendance</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600">96.9%</span>
                <span className="text-xs text-slate-400">63 / 65 days</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                Rating: Excellent Punctuality
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subjects Registered</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">8</span>
                <span className="text-xs text-slate-400">Core Subjects</span>
              </div>
              <p className="text-[11px] text-indigo-600 font-semibold mt-2">
                All Scores Graded
              </p>
            </div>

          </div>

          {/* Academic Progression Across Terms */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Academic Performance Tracking Across Terms</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track your child's average score, position, and total marks across academic sessions
                </p>
              </div>

              <button
                onClick={() => setActiveTab('report-card')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open First Term Report</span>
              </button>
            </div>

            {/* Term comparison cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Term 1 */}
              <div className="border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50/30 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs text-indigo-900 uppercase">First Term 2025/2026</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Completed
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Class Position:</span>
                    <strong className="text-amber-600">1st Position</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Marks:</span>
                    <strong className="text-slate-900">659 / 800</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Percentage:</span>
                    <strong className="text-indigo-700">82.4% (Grade A)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remark:</span>
                    <span className="text-emerald-700 font-semibold">Exemplary Conduct</span>
                  </div>
                </div>
              </div>

              {/* Term 2 (Upcoming) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 opacity-80">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs text-slate-700 uppercase">Second Term 2025/2026</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                    Resumes Jan 12, 2026
                  </span>
                </div>
                <p className="text-xs text-slate-500 py-4 text-center italic">
                  Academic activities will commence on resumption date.
                </p>
              </div>

              {/* Term 3 (Upcoming) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 opacity-80">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs text-slate-700 uppercase">Third Term 2025/2026</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                    Promotion Term
                  </span>
                </div>
                <p className="text-xs text-slate-500 py-4 text-center italic">
                  Final promotional assessments and annual report card.
                </p>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* Report Card Full Preview Tab */
        <ReportCardPreview studentId={studentId} onBack={() => setActiveTab('overview')} />
      )}

    </div>
  );
};
