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
      <div className="rounded-2xl glass-2 p-3 sm:p-4 border border-sage-300/20 shadow-md">
        <div className="flex items-center justify-between relative">
          {/* Background Sage Progress Line */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-sage-950/50 z-0">
            <div
              className="h-full bg-gradient-to-r from-sage-500 via-mint to-sage-400 transition-all duration-300"
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
                className={`relative z-10 flex flex-col items-center gap-1.5 transition-all ${
                  isCurrent ? 'scale-105' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                    isCurrent
                      ? 'bg-sage-500 text-white border-2 border-sage-300 ring-4 ring-sage-500/20 shadow-sage-900/50'
                      : isCompleted
                      ? 'bg-sage-600/60 text-mint border border-mint/30'
                      : 'bg-sage-950/80 text-text-muted border border-sage-300/15'
                  }`}
                >
                  {isCompleted ? '✓' : s.number}
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:block ${
                    isCurrent
                      ? 'text-text-primary font-bold'
                      : isCompleted
                      ? 'text-text-secondary'
                      : 'text-text-muted'
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
