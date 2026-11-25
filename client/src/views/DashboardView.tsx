import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Trophy, 
  Award, 
  CheckCircle2, 
  XCircle, 
  BarChart2, 
  BookOpen, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import type { AnalyticsData, ClassItem } from '../types';

interface DashboardViewProps {
  onViewReportCard: (studentId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onViewReportCard }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(3); // JSS 1 default
  const [selectedArm, setSelectedArm] = useState<string>('A');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedClassId, selectedArm]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?class_id=${selectedClassId}&arm=${selectedArm}&term_id=1&session_id=1`);
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const armsList = selectedClass?.arms ? selectedClass.arms.split(',') : ['A', 'B'];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Analytics Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time performance analytics, class averages, ranking leaderboards, and pass rates.
          </p>
        </div>

        {/* Class and Arm Selectors */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.section})</option>
              ))}
            </select>
          </div>

          <select
            value={selectedArm}
            onChange={(e) => setSelectedArm(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {armsList.map(arm => (
              <option key={arm} value={arm}>Arm {arm}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Class Average */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Average</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {analytics?.classStats.classAvg ?? '--'}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{analytics?.classStats.totalClassStudents || 0}</span> students enrolled in {selectedClass?.name} {selectedArm}
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest Total Score</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {analytics?.classStats.highestScore ?? '--'} <span className="text-xs font-medium text-slate-400">marks</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Lowest score:</span>
            <span className="font-semibold text-rose-600">{analytics?.classStats.lowestScore ?? '--'} marks</span>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Rate (&ge; 50%)</p>
              <h3 className="text-2xl font-black text-blue-600 mt-1">
                {analytics?.classStats.passRate ?? '--'}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">Exemplary</span> performance standard
          </div>
        </div>

        {/* Failure Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failure Rate (&lt; 50%)</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                {analytics?.classStats.failureRate ?? '--'}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Students requiring academic support</span>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Top 10 Leaderboard & Subject Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 10 Students Leaderboard (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Top 10 Class Leaderboard</h2>
                <p className="text-[11px] text-slate-500">Ranked by Total Student Score (Sum of all subject totals)</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {selectedClass?.name} {selectedArm}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5 pl-2">Rank</th>
                  <th className="pb-2.5">Student</th>
                  <th className="pb-2.5">Admission No</th>
                  <th className="pb-2.5 text-right">Total Marks</th>
                  <th className="pb-2.5 text-right">Average</th>
                  <th className="pb-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics?.top10 && analytics.top10.length > 0 ? (
                  analytics.top10.map((s) => {
                    const medal = s.position === 1 ? '🥇' : s.position === 2 ? '🥈' : s.position === 3 ? '🥉' : null;
                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-2 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            {medal && <span className="text-base">{medal}</span>}
                            <span className={s.position <= 3 ? 'text-indigo-700 font-black' : 'text-slate-600'}>
                              {s.position_str}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={s.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                              alt={s.student_name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <span className="font-bold text-slate-800">{s.student_name}</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-500">{s.admission_no}</td>
                        <td className="py-3 text-right font-black text-slate-900">{s.total_score}</td>
                        <td className="py-3 text-right font-semibold text-indigo-600">{s.average_score}%</td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => onViewReportCard(s.student_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <span>Report</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No score records found for this class. Enter scores to view leaderboard.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Grade Distribution & Best Performing Subjects */}
        <div className="space-y-6">
          
          {/* Grade Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Grade Distribution</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              {[
                { grade: 'A', label: 'Excellent (70-100)', color: 'bg-emerald-500', count: analytics?.gradeDistribution.A || 0 },
                { grade: 'B', label: 'Very Good (60-69)', color: 'bg-blue-500', count: analytics?.gradeDistribution.B || 0 },
                { grade: 'C', label: 'Good (50-59)', color: 'bg-indigo-500', count: analytics?.gradeDistribution.C || 0 },
                { grade: 'D', label: 'Fair (45-49)', color: 'bg-amber-500', count: analytics?.gradeDistribution.D || 0 },
                { grade: 'E', label: 'Pass (40-44)', color: 'bg-orange-500', count: analytics?.gradeDistribution.E || 0 },
                { grade: 'F', label: 'Fail (< 40)', color: 'bg-rose-500', count: analytics?.gradeDistribution.F || 0 },
              ].map(item => {
                const totalScores = Object.values(analytics?.gradeDistribution || {}).reduce((a, b) => a + b, 0) || 1;
                const percentage = Math.round((item.count / totalScores) * 100);
                return (
                  <div key={item.grade} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-slate-700">{item.grade} • {item.label}</span>
                      <span className="font-mono text-slate-500">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Performing Subjects */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Best Performing Subjects</span>
            </h2>

            <div className="space-y-3">
              {analytics?.bestSubjects && analytics.bestSubjects.length > 0 ? (
                analytics.bestSubjects.map((sub, i) => (
                  <div key={sub.subject_id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">{sub.subject_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{sub.subject_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900">{sub.avg_score.toFixed(1)}%</span>
                      <p className="text-[10px] text-slate-400">Avg</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No subject scores recorded yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
