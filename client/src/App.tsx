import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, type NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { StudentManagementView } from './views/StudentManagementView';
import { SubjectManagementView } from './views/SubjectManagementView';
import { ScoreEntryView } from './views/ScoreEntryView';
import { RankingLeaderboardView } from './views/RankingLeaderboardView';
import { ReportCardPreview } from './views/ReportCardPreview';
import { ParentPortalView } from './views/ParentPortalView';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<number>(1);

  // If role is Parent, automatically present the Parent Portal
  React.useEffect(() => {
    if (user?.role === 'Parent') {
      setActiveTab('parent-portal');
    } else if (activeTab === 'parent-portal') {
      setActiveTab('dashboard');
    }
  }, [user?.role]);

  const handleOpenReportCard = (studentId: number) => {
    setSelectedStudentForReport(studentId);
    setActiveTab('report-cards');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView onViewReportCard={handleOpenReportCard} />
            )}

            {activeTab === 'students' && (
              <StudentManagementView onViewReportCard={handleOpenReportCard} />
            )}

            {activeTab === 'subjects' && (
              <SubjectManagementView />
            )}

            {activeTab === 'scores' && (
              <ScoreEntryView />
            )}

            {activeTab === 'rankings' && (
              <RankingLeaderboardView onViewReportCard={handleOpenReportCard} />
            )}

            {activeTab === 'report-cards' && (
              <ReportCardPreview
                studentId={selectedStudentForReport}
                onBack={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'parent-portal' && (
              <ParentPortalView />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
