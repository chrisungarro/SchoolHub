import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileSpreadsheet, 
  Trophy, 
  FileText, 
  BarChart3, 
  GraduationCap, 
  HeartHandshake
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'students'
  | 'subjects'
  | 'scores'
  | 'rankings'
  | 'report-cards'
  | 'analytics'
  | 'parent-portal';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'Administrator';

  // Role-based navigation items
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; roles: string[]; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['Administrator', 'Principal', 'Teacher'],
    },
    {
      id: 'students',
      label: 'Student Management',
      icon: <Users className="w-4 h-4" />,
      roles: ['Administrator', 'Principal', 'Teacher'],
      badge: 'Promotion'
    },
    {
      id: 'subjects',
      label: 'Subjects & Classes',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['Administrator', 'Principal'],
    },
    {
      id: 'scores',
      label: 'Score Entry & Excel',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      roles: ['Administrator', 'Teacher', 'Principal'],
      badge: 'CA+Exam'
    },
    {
      id: 'rankings',
      label: 'Student Rankings',
      icon: <Trophy className="w-4 h-4" />,
      roles: ['Administrator', 'Principal', 'Teacher'],
      badge: 'Leaderboard'
    },
    {
      id: 'report-cards',
      label: 'Report Card Generator',
      icon: <FileText className="w-4 h-4" />,
      roles: ['Administrator', 'Principal', 'Teacher'],
      badge: 'PDF'
    },
    {
      id: 'parent-portal',
      label: 'Parent Portal',
      icon: <HeartHandshake className="w-4 h-4" />,
      roles: ['Administrator', 'Parent'],
      badge: role === 'Parent' ? 'Active' : 'Preview'
    },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="no-print w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1">
        
        {/* Role contextual header badge */}
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Access Scope</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">
              {role === 'Parent' ? 'Parent & Guardian View' : `${role} Workspace`}
            </span>
          </div>
          {role === 'Teacher' && user?.teacher && (
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Assigned: {user.teacher.class_name} {user.teacher.assigned_arm}
            </p>
          )}
          {role === 'Parent' && user?.student && (
            <p className="text-[11px] text-indigo-600 mt-1 font-semibold">
              Child: {user.student.first_name} {user.student.last_name} ({user.student.admission_no})
            </p>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {visibleItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-indigo-700 text-indigo-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Grading Scale Guide Info Box */}
        <div className="mt-8 p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Standard Grading</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
            <div><span className="font-bold text-emerald-700">70–100:</span> A (Exc)</div>
            <div><span className="font-bold text-blue-700">60–69:</span> B (V.Good)</div>
            <div><span className="font-bold text-indigo-700">50–59:</span> C (Good)</div>
            <div><span className="font-bold text-amber-700">45–49:</span> D (Fair)</div>
            <div><span className="font-bold text-orange-700">40–44:</span> E (Pass)</div>
            <div><span className="font-bold text-rose-700">&lt; 40:</span> F (Fail)</div>
          </div>
          <div className="mt-2 pt-2 border-t border-indigo-100 text-[10px] text-slate-500 font-medium">
            CA (10) + Test (20) + Exam (70) = 100
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Tony Group of Schools v2.4</span>
        <span className="font-mono text-[10px]">2026</span>
      </div>
    </aside>
  );
};
