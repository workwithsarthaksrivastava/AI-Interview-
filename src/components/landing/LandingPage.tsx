import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_EVALUATION_REPORT, SEED_COMPANIES } from '../../data/seedData';
import { api } from '../../services/api';
import { Company } from '../../types';
import { VoiceOrb } from '../common/VoiceOrb';
import { HarmonicSoundWave } from '../common/HarmonicSoundWave';
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
  Code
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentView, setWizardStep, setCurrentReport } = useAppStore();
  const [companies, setCompanies] = useState<Company[]>(SEED_COMPANIES);

  useEffect(() => {
    api.getCompanies()
      .then((data) => {
        if (data && data.length > 0) setCompanies(data);
      })
      .catch(() => {});
  }, []);

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

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
            Master Real Interviews with <br />
            <span className="bg-gradient-to-r from-sage-700 via-emerald-700 to-sage-800 dark:from-sage-300 dark:via-mint dark:to-sage-400 bg-clip-text text-transparent">
              Shakchhatkar AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed font-normal">
            Practice two-way voice interviews with real-time barge-in interruption, personalized resume deep-dives, company persona matching, and 12-section hiring committee reports.
          </p>
        </div>

        {/* Centerpiece Voice Orb with Continuous Propagating Sound Waves Across Landing Page */}
        <div className="relative py-12 flex items-center justify-center overflow-visible">
          {/* Expansive Acoustic Wave Field Propagating Across the Landing Page */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible -z-0" aria-hidden="true">
            {/* Phased Concentric Wavefronts Radiating into the Page */}
            <div className="absolute w-[360px] h-[360px] rounded-full border border-emerald-500/35 dark:border-mint/40 animate-soundwave-ring-1" />
            <div className="absolute w-[520px] h-[520px] rounded-full border border-emerald-500/30 dark:border-mint/35 animate-soundwave-ring-2" />
            <div className="absolute w-[720px] h-[720px] rounded-full border border-emerald-500/25 dark:border-mint/30 animate-soundwave-ring-3" />
            <div className="absolute w-[980px] h-[980px] rounded-full border border-emerald-500/20 dark:border-mint/25 animate-soundwave-ring-wide-1" />
            <div className="absolute w-[1300px] h-[1300px] rounded-full border border-emerald-500/15 dark:border-mint/20 animate-soundwave-ring-ultra" />

            {/* Radiant Sound Aura Beam Center */}
            <div className="absolute w-[440px] h-[440px] rounded-full bg-gradient-to-r from-emerald-500/20 via-mint/25 to-emerald-500/20 blur-3xl pointer-events-none" />
          </div>

          {/* Full-width CONTINUOUS Harmonic Sound Wave flowing through the Orb without ANY gap */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-screen max-w-[100vw] pointer-events-none z-0 overflow-visible flex items-center justify-center">
            <HarmonicSoundWave height={280} audioLevel={70} className="w-full opacity-90" />
          </div>

          {/* Center Voice Orb with Polished 3D Glass Surface */}
          <div className="relative z-10">
            <VoiceOrb state="speaking" audioLevel={68} size={228} subtext="Real-time conversational voice audio" />
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
            icon={<Award className="w-5 h-5 text-emerald-950 dark:text-emerald-200" />}
          >
            View Sample 12-Section Report
          </GlassButton>
        </div>
      </section>

      {/* Synchronized Companies Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="p-4 sm:p-5 rounded-3xl glass-1 border border-sage-300/20 shadow-lg text-center">
          <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold block mb-3">
            Company-Specific Hiring Rubrics & Personas Synced from Database
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-85">
            {companies.slice(0, 8).map((comp) => (
              <span
                key={comp.id}
                className="font-bold text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors cursor-default"
              >
                {comp.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works: 4 Overlapping Glass Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 text-left">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
            How Shakchhatkar Works
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
              desc: 'Upload your PDF or DOCX. The AI parses real project milestones, tech stack, and responsibilities to formulate tailored questions.',
              icon: <FileText className="w-5 h-5 text-mint" />
            },
            {
              step: '02',
              title: 'Company Persona Bar',
              desc: 'Select your target company. The system applies matching difficulty levels, architectural rigor, and company evaluation rubrics.',
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
              <ShieldCheck className="w-6 h-6 text-sage-600 dark:text-mint" />
              <h4 className="font-bold text-sm text-text-primary">Strict Privacy Guarantee</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Candidate audio and session data are stored securely and associated only with your account.
              </p>
            </div>

            <div className="space-y-2">
              <Zap className="w-6 h-6 text-sage-700 dark:text-gold" />
              <h4 className="font-bold text-sm text-text-primary">Pre-Flight Lobby Calibration</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Microphone frequency checks, speaker tests, and greeting calibration ensure optimal audio quality.
              </p>
            </div>

            <div className="space-y-2">
              <Code className="w-6 h-6 text-sage-600 dark:text-mint" />
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
