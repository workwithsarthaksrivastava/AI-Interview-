import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_EVALUATION_REPORT } from '../../data/seedData';
import { VoiceOrb } from '../common/VoiceOrb';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  Mic,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  FileText,
  Sliders,
  CheckCircle2,
  Lock,
  Code
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentView, setWizardStep, setCurrentReport } = useAppStore();

  const handleStartInterview = () => {
    setWizardStep(1);
    setCurrentView('wizard');
  };

  const handleViewSampleReport = () => {
    setCurrentReport(DEMO_EVALUATION_REPORT);
    setCurrentView('report');
  };

  return (
    <div className="relative overflow-hidden space-y-20 py-8 sm:py-12 text-left">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
        {/* Top Kicker */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage-500/15 border border-sage-300/30 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-gold animate-spin" />
          <span className="text-xs font-semibold text-mint tracking-wide">
            Powered by Deepgram Voice Agent & Free-Tier Flash Reasoning
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
            Master Real Interviews with <br />
            <span className="bg-gradient-to-r from-sage-300 via-mint to-sage-400 bg-clip-text text-transparent">
              Live Conversational AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed font-normal">
            Practice two-way voice interviews with real-time barge-in interruption, personalized resume deep-dives, company persona matching, and 12-section hiring committee reports.
          </p>
        </div>

        {/* Centerpiece Voice Orb with Interactive Ripples */}
        <div className="relative py-6 flex items-center justify-center">
          <VoiceOrb state="speaking" audioLevel={65} size={210} subtext="Real-time 24kHz conversational voice audio" />

          {/* Floating Stat Card Left */}
          <div className="hidden lg:block absolute left-4 top-1/4 -translate-y-1/2 rounded-2xl glass-2 p-3.5 border border-sage-300/25 shadow-xl max-w-[190px] text-left animate-in fade-in slide-in-from-left duration-500">
            <span className="text-[10px] uppercase font-bold text-mint block">Sub-Second Audio</span>
            <div className="text-lg font-bold text-text-primary">480ms Latency</div>
            <p className="text-[10px] text-text-muted mt-0.5">Supports natural barge-in interruptions</p>
          </div>

          {/* Floating Stat Card Right */}
          <div className="hidden lg:block absolute right-4 top-1/3 -translate-y-1/2 rounded-2xl glass-2 p-3.5 border border-sage-300/25 shadow-xl max-w-[190px] text-left animate-in fade-in slide-in-from-right duration-500">
            <span className="text-[10px] uppercase font-bold text-gold block">Bar-Raiser Verdict</span>
            <div className="text-lg font-bold text-text-primary">12-Section Audit</div>
            <p className="text-[10px] text-text-muted mt-0.5">Detailed transcript quotes & actionable plan</p>
          </div>
        </div>

        {/* Hero CTA Button Cluster */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleStartInterview}
            icon={<ArrowRight className="w-5 h-5" />}
            className="text-base px-8 py-4 shadow-xl shadow-sage-900/60"
          >
            Start Free Mock Interview
          </GlassButton>

          <GlassButton
            variant="secondary"
            size="lg"
            onClick={() => setCurrentView('candidate-dashboard')}
            icon={<FileText className="w-5 h-5" />}
          >
            View Candidate Hub
          </GlassButton>

          <GlassButton
            variant="mint"
            size="lg"
            onClick={handleViewSampleReport}
            icon={<Award className="w-5 h-5" />}
          >
            View Sample 12-Section Report
          </GlassButton>
        </div>
      </section>

      {/* Frosted Marquee Strip of Companies */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="p-4 sm:p-5 rounded-3xl glass-1 border border-sage-300/20 shadow-lg text-center">
          <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold block mb-3">
            Company-Specific Hiring Rubrics & Personas Included
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-85">
            {['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys', 'Tech Startups'].map((comp) => (
              <span
                key={comp}
                className="font-bold text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors cursor-default"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works: 4 Overlapping Glass Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 text-left">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
            How InterviewIQ Works
          </h2>
          <p className="text-xs text-text-secondary">
            From parsing your achievements to realistic live grilling and actionable feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Resume-Based Depth',
              desc: 'Upload your PDF/DOCX. Gemini extracts key projects, skills, and past decisions to formulate tough, personalized technical questions.',
              icon: <FileText className="w-5 h-5 text-mint" />
            },
            {
              step: '02',
              title: 'Company Persona Bar',
              desc: 'Select your target company (Google, Amazon, TCS, etc.). The AI adapts its tone, rigor, and rubrics to match real interviewers.',
              icon: <Building2 className="w-5 h-5 text-mint" />
            },
            {
              step: '03',
              title: 'Live Voice & Barge-In',
              desc: 'Speak naturally. Cut in when needed. Code in the built-in Monaco editor or sketch architecture on the whiteboard.',
              icon: <Mic className="w-5 h-5 text-mint" />
            },
            {
              step: '04',
              title: '12-Section Evaluation',
              desc: 'Receive an exhaustive report with exact transcript evidence quotes, speech pace analytics, and a 30-day practice roadmap.',
              icon: <Award className="w-5 h-5 text-mint" />
            }
          ].map((card, i) => (
            <GlassCard key={i} className="p-6 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-sage-500/15 border border-sage-300/20 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="text-xs font-mono font-bold text-mint">{card.step}</span>
                </div>
                <h3 className="font-bold text-base text-text-primary">{card.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mt-1.5">{card.desc}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Feature Highlights Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <GlassCard className="p-8 sm:p-10 bg-gradient-to-r from-sage-950/70 via-sage-900/40 to-sage-950/70 border border-sage-400/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <ShieldCheck className="w-6 h-6 text-mint" />
              <h4 className="font-bold text-sm text-text-primary">Strict Privacy Guarantee</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Audio is transcribed securely and discarded. Webcam checks are purely local in-browser heuristics.
              </p>
            </div>

            <div className="space-y-2">
              <Zap className="w-6 h-6 text-gold" />
              <h4 className="font-bold text-sm text-text-primary">Mandatory Pre-Flight Lobby</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Live mic frequency waveform calibration, speaker check, and sample greeting test ensure zero call dropouts.
              </p>
            </div>

            <div className="space-y-2">
              <Code className="w-6 h-6 text-mint" />
              <h4 className="font-bold text-sm text-text-primary">Interactive Coding & Board</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Discuss data structures, test edge cases, and run code while discussing Big-O complexity with the AI interviewer.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
