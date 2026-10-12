import React from 'react';
import { useAppStore } from './store/useAppStore';
import { GlassNavbar } from './components/common/GlassNavbar';
import { ToastContainer } from './components/common/ToastContainer';
import { LandingPage } from './components/landing/LandingPage';
import { WizardContainer } from './components/wizard/WizardContainer';
import { LiveInterviewRoom } from './components/interview/LiveInterviewRoom';
import { EvaluatingScreen } from './components/report/EvaluatingScreen';
import { EvaluationReportView } from './components/report/EvaluationReportView';
import { CandidateDashboard } from './components/candidate/CandidateDashboard';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminAccessDenied } from './components/admin/AdminAccessDenied';
import { LoginPage } from './components/auth/LoginPage';
import { isUserAdmin } from './utils/authGuards';

export default function App() {
  const { currentView, currentUser } = useAppStore();

  return (
    <div className="relative min-h-screen text-text-primary overflow-x-hidden selection:bg-sage-500/30 selection:text-sage-100 flex flex-col justify-between">
      {/* Refined Architectural Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-canvas-subtle" aria-hidden="true">
        <div className="absolute inset-0 bg-architectural-grid opacity-60" />
      </div>

      {/* Glass Top Navigation (hidden during live call or initial login for full focus) */}
      {currentView !== 'interview' && currentView !== 'evaluating' && currentView !== 'login' && <GlassNavbar />}

      {/* Main View Router */}
      <main className="relative z-10 flex-1 w-full">
        {currentView === 'login' && <LoginPage />}
        {currentView === 'landing' && <LandingPage />}
        {(currentView === 'wizard' || currentView === 'lobby') && <WizardContainer />}
        {currentView === 'interview' && <LiveInterviewRoom />}
        {currentView === 'evaluating' && <EvaluatingScreen />}
        {currentView === 'report' && <EvaluationReportView />}
        {currentView === 'candidate-dashboard' && (!isUserAdmin(currentUser.email) ? <CandidateDashboard /> : <AdminAccessDenied />)}
        {currentView === 'admin' && (isUserAdmin(currentUser.email) ? <AdminLayout /> : <AdminAccessDenied />)}
      </main>

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Subtle Footer (hidden in interview, evaluating and login modes) */}
      {currentView !== 'interview' && currentView !== 'evaluating' && currentView !== 'login' && (
        <footer className="relative z-10 py-6 border-t border-sage-300/10 text-center text-xs text-text-muted select-none">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <strong>Shakchhatkar</strong> · AI Mock Interview Platform with Live Voice & Interruption
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Powered by Deepgram Voice Architecture & Gemini Flash</span>
              <span>·</span>
              <span>WCAG AA Accessible</span>
              <span>·</span>
              <span>Strict Privacy Standards</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
