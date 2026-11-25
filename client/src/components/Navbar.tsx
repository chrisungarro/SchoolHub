import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  LogOut, 
  Calendar,
  Sparkles
} from 'lucide-react';
import type { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, switchRole, logout } = useAuth();

  const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { role: 'Administrator', label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'bg-purple-600' },
    { role: 'Principal', label: 'Principal', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'bg-blue-600' },
    { role: 'Teacher', label: 'Teacher', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'bg-emerald-600' },
    { role: 'Parent', label: 'Parent Portal', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-amber-600' },
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">TONY GROUP OF SCHOOLS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Report Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Academic Report Card & Grading System</p>
            </div>
          </div>

          {/* Center Info: Academic Term Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>2025/2026 Academic Session</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              First Term
            </span>
          </div>

          {/* Right: Quick Role Switcher Pill Bar & User Info */}
          <div className="flex items-center gap-3">
            {/* Demo Role Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <span className="text-[11px] font-semibold text-slate-500 px-2 hidden md:inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Switch Role:
              </span>
              {roles.map(r => {
                const isActive = user?.role === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => switchRole(r.role)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? `${r.color} text-white shadow-sm`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title={`Switch view to ${r.role}`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.full_name || 'System User'}</p>
                <p className="text-[11px] text-indigo-600 font-medium">{user?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-500/20">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
