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

export default function App() {
  const { currentView } = useAppStore();

  return (
    <div className="relative min-h-screen text-text-primary overflow-x-hidden selection:bg-sage-500/30 selection:text-sage-100 flex flex-col justify-between">
      {/* Layered Atmospheric Drifting Mesh Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Blob 1: Soft Sage */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-sage-400/15 blur-[100px] animate-blob-1" />

        {/* Blob 2: Mint Glow */}
        <div className="absolute top-1/3 -right-32 w-[560px] h-[560px] rounded-full bg-mint/10 blur-[120px] animate-blob-2" />

        {/* Blob 3: Pale Gold Warmth */}
        <div className="absolute -bottom-32 left-1/4 w-[480px] h-[480px] rounded-full bg-gold/10 blur-[110px] animate-blob-3" />
      </div>

      {/* Glass Top Navigation (hidden during live call for full immersion) */}
      {currentView !== 'interview' && currentView !== 'evaluating' && <GlassNavbar />}

      {/* Main View Router */}
      <main className="relative z-10 flex-1 w-full">
        {currentView === 'landing' && <LandingPage />}
        {(currentView === 'wizard' || currentView === 'lobby') && <WizardContainer />}
        {currentView === 'interview' && <LiveInterviewRoom />}
        {currentView === 'evaluating' && <EvaluatingScreen />}
        {currentView === 'report' && <EvaluationReportView />}
        {currentView === 'candidate-dashboard' && <CandidateDashboard />}
        {currentView === 'admin' && <AdminLayout />}
      </main>

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Subtle Footer (hidden in interview and evaluating modes) */}
      {currentView !== 'interview' && currentView !== 'evaluating' && (
        <footer className="relative z-10 py-6 border-t border-sage-300/10 text-center text-xs text-text-muted select-none">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <strong>InterviewIQ</strong> · AI Mock Interview Platform with Live Voice & Interruption
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
