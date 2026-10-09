import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VoiceOrb } from '../common/VoiceOrb';
import { Sparkles, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export const EvaluatingScreen: React.FC = () => {
  const { selectedCompany, selectedRole } = useAppStore();

  const [stepIndex, setStepIndex] = useState(0);

  const evaluationSteps = [
    'Transcribing audio timestamps and speech cadence...',
    'Analyzing algorithmic complexity and code correctness...',
    'Benchmarking against company-specific Bar-Raiser rubric...',
    'Auditing STAR behavioral frameworks and ownership signals...',
    'Synthesizing 12-section performance report and roadmap...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < evaluationSteps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6">
        <VoiceOrb state="thinking" size={180} />
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        <span className="text-xs uppercase font-bold tracking-wider text-mint flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-gold animate-spin" />
          AI Bar-Raiser Committee In Session
        </span>

        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
          Analyzing Your Interview...
        </h2>

        <p className="text-xs text-text-muted">
          Evaluating transcript turns against {selectedCompany?.name || 'Company'}'s hiring bar for {selectedRole?.title || 'Engineer'}.
        </p>

        {/* Dynamic Progress Checklist */}
        <div className="mt-6 p-4 rounded-2xl glass-2 border border-sage-300/20 text-left space-y-2.5 shadow-lg">
          {evaluationSteps.map((step, idx) => {
            const isDone = idx < stepIndex;
            const isCurrent = idx === stepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 text-xs transition-all ${
                  isDone
                    ? 'text-mint font-medium'
                    : isCurrent
                    ? 'text-text-primary font-bold'
                    : 'text-text-muted/50'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-mint shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-sage-300/20 shrink-0" />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
