import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  ArrowUpRight, 
  Filter, 
  Sparkles, 
  Calculator,
  RefreshCw,
  Users
} from 'lucide-react';
import type { RankedStudent, ClassItem } from '../types';

interface RankingLeaderboardViewProps {
  onViewReportCard: (studentId: number) => void;
}

export const RankingLeaderboardView: React.FC<RankingLeaderboardViewProps> = ({ onViewReportCard }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(3); // JSS 1 default
  const [selectedArm, setSelectedArm] = useState<string>('A');
  const [rankings, setRankings] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchRankings();
    }
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

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rankings?class_id=${selectedClassId}&arm=${selectedArm}&term_id=1&session_id=1`);
      const data = await res.json();
      setRankings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const armsList = selectedClass?.arms ? selectedClass.arms.split(',') : ['A', 'B'];

  const top1 = rankings[0];
  const top2 = rankings[1];
  const top3 = rankings[2];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Ranking & Leaderboard</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Competition Ranking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic class ranking based on sum of all subject totals, with full support for equal ties.
          </p>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.section})</option>
              ))}
            </select>
          </div>

          <select
            value={selectedArm}
            onChange={(e) => setSelectedArm(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {armsList.map(arm => (
              <option key={arm} value={arm}>Arm {arm}</option>
            ))}
          </select>

          <button
            onClick={fetchRankings}
            className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            title="Refresh Rankings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Official Ranking Formula Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">Ranking Formula Standard</h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              <strong className="text-white font-mono">Total Student Score = &sum;(All Subject Totals)</strong>
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              Tie Rule: Students with identical aggregate scores receive equal positions (e.g. 1st, 2nd, 2nd, 4th).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
          <div>
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Total Ranked</p>
            <p className="text-base font-bold text-white">{rankings.length} Students</p>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div>
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Academic Session</p>
            <p className="text-base font-bold text-white">2025/2026</p>
          </div>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* 2nd Place */}
          {top2 && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-5 relative overflow-hidden flex flex-col items-center text-center order-2 md:order-1">
              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center mb-2 shadow-xs">
                2nd
              </span>
              <img
                src={top2.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                alt={top2.student_name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-100 shadow-sm"
              />
              <h3 className="font-bold text-slate-900 mt-3 text-sm">{top2.student_name}</h3>
              <p className="text-[11px] text-slate-500 font-mono">{top2.admission_no}</p>

              <div className="mt-3 w-full bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Score</span>
                  <p className="font-black text-slate-800 text-sm">{top2.total_score}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Average</span>
                  <p className="font-bold text-indigo-600 text-sm">{top2.average_score}%</p>
                </div>
              </div>

              <button
                onClick={() => onViewReportCard(top2.student_id)}
                className="mt-3 w-full py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                View Report Card
              </button>
            </div>
          )}

          {/* 1st Place (Champion Podium) */}
          {top1 && (
            <div className="bg-gradient-to-b from-amber-50/70 to-white rounded-2xl border-2 border-amber-300 shadow-md p-6 relative overflow-hidden flex flex-col items-center text-center order-1 md:order-2 md:-mt-3">
              <div className="absolute top-3 right-3 text-amber-500">
                <Trophy className="w-6 h-6 animate-bounce" />
              </div>

              <span className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center mb-2 shadow-sm ring-4 ring-amber-100">
                1st
              </span>
              <img
                src={top1.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                alt={top1.student_name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-200 shadow-md"
              />
              <h3 className="font-black text-slate-900 mt-3 text-base">{top1.student_name}</h3>
              <p className="text-[11px] text-amber-700 font-mono font-semibold">{top1.admission_no}</p>

              <div className="mt-3 w-full bg-amber-100/60 rounded-xl p-3 border border-amber-200 flex justify-around text-xs">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Total Score</span>
                  <p className="font-black text-amber-950 text-base">{top1.total_score}</p>
                </div>
                <div className="w-px h-8 bg-amber-300"></div>
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Average</span>
                  <p className="font-black text-indigo-700 text-base">{top1.average_score}%</p>
                </div>
              </div>

              <button
                onClick={() => onViewReportCard(top1.student_id)}
                className="mt-4 w-full py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
              >
                View Report Card
              </button>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="bg-white rounded-2xl border-2 border-amber-700/20 shadow-xs p-5 relative overflow-hidden flex flex-col items-center text-center order-3">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center mb-2 shadow-xs">
                3rd
              </span>
              <img
                src={top3.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                alt={top3.student_name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-100 shadow-sm"
              />
              <h3 className="font-bold text-slate-900 mt-3 text-sm">{top3.student_name}</h3>
              <p className="text-[11px] text-slate-500 font-mono">{top3.admission_no}</p>

              <div className="mt-3 w-full bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Score</span>
                  <p className="font-black text-slate-800 text-sm">{top3.total_score}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Average</span>
                  <p className="font-bold text-indigo-600 text-sm">{top3.average_score}%</p>
                </div>
              </div>

              <button
                onClick={() => onViewReportCard(top3.student_id)}
                className="mt-3 w-full py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                View Report Card
              </button>
            </div>
          )}

        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm">Full Class Ranking Table</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {selectedClass?.name} {selectedArm} • 2025/2026 First Term
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 pl-4">Position</th>
                <th className="py-3">Student Name</th>
                <th className="py-3">Admission No</th>
                <th className="py-3">Gender</th>
                <th className="py-3 text-center">Subjects Taken</th>
                <th className="py-3 text-right">Total Marks Obtained</th>
                <th className="py-3 text-right">Max Obtainable</th>
                <th className="py-3 text-right">Overall Average</th>
                <th className="py-3 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.length > 0 ? (
                rankings.map(s => {
                  const medal = s.position === 1 ? '🥇' : s.position === 2 ? '🥈' : s.position === 3 ? '🥉' : null;
                  return (
                    <tr
                      key={s.student_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        s.position <= 3 ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 pl-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {medal && <span className="text-base">{medal}</span>}
                          <span className={s.position <= 3 ? 'text-indigo-900 font-black' : 'text-slate-700'}>
                            {s.position_str}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                            alt={s.student_name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900">{s.student_name}</span>
                            {s.isTied && (
                              <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Equal Tie
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-slate-500 font-semibold">{s.admission_no}</td>

                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.gender === 'Female' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {s.gender}
                        </span>
                      </td>

                      <td className="py-3.5 text-center font-mono font-medium text-slate-600">
                        {s.scores_count}
                      </td>

                      <td className="py-3.5 text-right font-black text-slate-900 text-sm">
                        {s.total_score}
                      </td>

                      <td className="py-3.5 text-right font-mono text-slate-500">
                        {s.max_possible_score}
                      </td>

                      <td className="py-3.5 text-right font-bold text-indigo-600 text-sm">
                        {s.average_score}%
                      </td>

                      <td className="py-3.5 text-right pr-4">
                        <button
                          onClick={() => onViewReportCard(s.student_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <span>Report</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Calculating class rankings...' : 'No student scores recorded for this class.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
