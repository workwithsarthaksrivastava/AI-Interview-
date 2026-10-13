import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  Mic,
  Award,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogleAction, isFirebaseAuthLoading, setCurrentView } = useAppStore();

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-lg space-y-6">
        {/* Main Login Card */}
        <GlassCard className="p-8 sm:p-10 border-sage-300/30 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          {/* Logo & Brand Header */}
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-lg shadow-sage-900/50 text-white font-extrabold text-2xl mx-auto tracking-tight">
              S
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                  Shakchhatkar
                </h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sage-500/20 text-mint border border-sage-400/30">
                  Live Voice AI
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
                Practice two-way voice mock interviews with live barge-in interruptions, resume-tailored grilling, and hiring committee evaluations.
              </p>
            </div>
          </div>

          {/* Primary Google Login Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={loginWithGoogleAction}
              disabled={isFirebaseAuthLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-bg-surface hover:bg-sage-100 text-text-primary font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 border border-border-subtle active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isFirebaseAuthLoading ? (
                <div className="w-5 h-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => setCurrentView('landing')}
              className="text-xs text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 font-medium pt-1"
            >
              <span>Explore demo as guest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Value Pillars List */}
          <div className="pt-4 border-t border-sage-300/15 space-y-2.5 text-left">
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <div className="w-6 h-6 rounded-lg bg-sage-500/15 text-mint flex items-center justify-center shrink-0">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <span>Real-time voice conversation with barge-in interruption</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <div className="w-6 h-6 rounded-lg bg-sage-500/15 text-mint flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>Resume-based personalized questions and seniority benchmarking</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <div className="w-6 h-6 rounded-lg bg-sage-500/15 text-mint flex items-center justify-center shrink-0">
                <Award className="w-3.5 h-3.5" />
              </div>
              <span>12-section hiring report with transcript evidence quotes</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <div className="w-6 h-6 rounded-lg bg-sage-500/15 text-mint flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Private session storage associated strictly with your account</span>
            </div>
          </div>

          {/* Privacy Footnote */}
          <p className="text-[11px] text-text-muted pt-1">
            Protected by enterprise encryption & strict privacy standards.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
