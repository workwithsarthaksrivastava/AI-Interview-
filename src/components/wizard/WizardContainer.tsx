import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Step1ResumeUpload } from './Step1ResumeUpload';
import { Step2CompanySelect } from './Step2CompanySelect';
import { Step3RoleSelect } from './Step3RoleSelect';
import { Step4Schedule } from './Step4Schedule';
import { Step5LobbyCalibration } from './Step5LobbyCalibration';
import { FileText, Building2, UserCheck, Calendar, Sliders } from 'lucide-react';

export const WizardContainer: React.FC = () => {
  const { wizardStep, setWizardStep } = useAppStore();

  const steps = [
    { number: 1, label: 'Resume', icon: <FileText className="w-4 h-4" /> },
    { number: 2, label: 'Company', icon: <Building2 className="w-4 h-4" /> },
    { number: 3, label: 'Role & Type', icon: <UserCheck className="w-4 h-4" /> },
    { number: 4, label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
    { number: 5, label: 'Calibration', icon: <Sliders className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Stepper Header */}
      <div className="rounded-2xl glass-2 p-3 sm:p-5 border border-sage-300/20 shadow-md">
        <div className="flex items-center justify-between relative">
          {/* Background Progress Track */}
          <div className="absolute top-4.5 sm:top-5 left-8 right-8 -translate-y-1/2 h-1 bg-sage-200 dark:bg-sage-800/80 rounded-full z-0 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sage-500 via-emerald-500 to-mint rounded-full transition-all duration-300"
              style={{ width: `${((wizardStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Stepper items */}
          {steps.map((s) => {
            const isCompleted = s.number < wizardStep;
            const isCurrent = s.number === wizardStep;

            return (
              <button
                key={s.number}
                type="button"
                onClick={() => {
                  if (s.number <= wizardStep) setWizardStep(s.number);
                }}
                className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer focus-visible:outline-none"
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-150 select-none ${
                    isCurrent
                      ? 'bg-gradient-to-b from-sage-600 to-sage-700 text-white border border-sage-300/90 dark:border-sage-300/50 shadow-[0_4px_12px_rgba(40,55,35,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] scale-110'
                      : isCompleted
                      ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 text-white border border-emerald-300/80 dark:border-mint/60 shadow-[0_2px_8px_rgba(5,150,105,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] hover:scale-105'
                      : 'bg-white dark:bg-sage-900/70 text-text-secondary dark:text-text-muted border border-sage-300/70 dark:border-sage-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] group-hover:border-sage-400'
                  }`}
                >
                  {isCompleted ? '✓' : s.number}
                </div>
                <span
                  className={`text-[11px] sm:text-xs transition-colors hidden sm:block ${
                    isCurrent
                      ? 'text-text-primary font-bold'
                      : isCompleted
                      ? 'text-emerald-800 dark:text-mint font-semibold'
                      : 'text-text-muted font-medium'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Panels */}
      <div className="rounded-3xl glass-1 p-6 sm:p-8 border border-sage-300/20 shadow-xl transition-all">
        {wizardStep === 1 && <Step1ResumeUpload />}
        {wizardStep === 2 && <Step2CompanySelect />}
        {wizardStep === 3 && <Step3RoleSelect />}
        {wizardStep === 4 && <Step4Schedule />}
        {wizardStep === 5 && <Step5LobbyCalibration />}
      </div>
    </div>
  );
};
