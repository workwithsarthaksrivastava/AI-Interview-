import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { Role, InterviewType, InterviewDifficulty, InterviewLanguage } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { CheckCircle, Sparkles, Clock, Globe2, Gauge, BookOpen } from 'lucide-react';

export const Step3RoleSelect: React.FC = () => {
  const {
    selectedCompany,
    selectedRole,
    setSelectedRole,
    parsedResume,
    interviewType,
    setInterviewType,
    difficulty,
    setDifficulty,
    durationMinutes,
    setDurationMinutes,
    language,
    setLanguage,
    setWizardStep
  } = useAppStore();

  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (selectedCompany) {
      api.getRoles(selectedCompany.id).then(setRoles).catch(console.error);
    }
  }, [selectedCompany]);

  const interviewTypes: InterviewType[] = ['Technical', 'HR', 'Behavioral', 'System Design', 'Mixed'];
  const difficultyLevels: InterviewDifficulty[] = ['Fresher', 'Mid', 'Senior'];
  const durations = [15, 30, 45];
  const languages: InterviewLanguage[] = ['English', 'Hindi', 'Hinglish'];

  // Check if role has AI match recommendation from resume
  const getAiMatch = (roleId: string) => {
    if (!parsedResume?.recommendedRoles) return null;
    return parsedResume.recommendedRoles.find(
      (r) => r.roleId === roleId || r.roleTitle.toLowerCase().includes(roleId.toLowerCase())
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Select Role & Customize Session</h2>
        <p className="text-sm text-text-secondary mt-1">
          Targeting <span className="font-semibold text-mint">{selectedCompany?.name || 'Company'}</span>. AI match scores are calculated from your uploaded experience.
        </p>
      </div>

      {/* Role Selection List */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          Available Positions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {roles.map((role) => {
            const isSelected = selectedRole?.id === role.id;
            const match = getAiMatch(role.id);

            return (
              <GlassCard
                key={role.id}
                interactive
                onClick={() => setSelectedRole(role)}
                className={`p-4 transition-all ${
                  isSelected
                    ? 'border-2 border-sage-400 bg-sage-500/15 ring-1 ring-sage-400/40 shadow-lg'
                    : 'border border-sage-300/15 hover:border-sage-300/35'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">{role.title}</h4>
                    <span className="text-[11px] text-text-muted">{role.department}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-sage-500 flex items-center justify-center text-white shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 mb-2.5">
                  {role.description}
                </p>

                {/* AI Match Badge if available */}
                {match && (
                  <div className="mb-2.5 p-2 rounded-lg bg-gold/10 border border-gold/25 flex items-start gap-1.5 text-xs text-gold-light">
                    <Sparkles className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gold">{match.matchPercentage}% AI Resume Match: </span>
                      <span className="text-[11px] text-text-secondary">{match.reason}</span>
                    </div>
                  </div>
                )}

                {/* Skills Preview */}
                <div className="flex flex-wrap gap-1">
                  {role.skills.slice(0, 4).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-sage-950/30 text-text-muted border border-sage-300/10"
                    >
                      {s}
                    </span>
                  ))}
                  {role.skills.length > 4 && (
                    <span className="text-[10px] px-1 text-text-muted">
                      +{role.skills.length - 4} more
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Session Customization Parameters */}
      <GlassCard className="p-6 space-y-5">
        <h3 className="text-sm font-semibold text-text-primary">
          Round Parameters & Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Interview Type */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sage-400" />
              Round Type
            </label>
            <div className="flex flex-col gap-1.5">
              {interviewTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInterviewType(t)}
                  className={`px-3 py-2 text-xs rounded-xl text-left border transition-all ${
                    interviewType === t
                      ? 'bg-sage-500/25 border-sage-400 text-text-primary font-semibold shadow-sm'
                      : 'bg-sage-950/30 border-sage-300/15 text-text-secondary hover:border-sage-300/30'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sage-400" />
              Difficulty Level
            </label>
            <div className="flex flex-col gap-1.5">
              {difficultyLevels.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-2 text-xs rounded-xl text-left border transition-all ${
                    difficulty === d
                      ? 'bg-sage-500/25 border-sage-400 text-text-primary font-semibold shadow-sm'
                      : 'bg-sage-950/30 border-sage-300/15 text-text-secondary hover:border-sage-300/30'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sage-400" />
              Target Duration
            </label>
            <div className="flex flex-col gap-1.5">
              {durations.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`px-3 py-2 text-xs rounded-xl text-left border transition-all ${
                    durationMinutes === m
                      ? 'bg-sage-500/25 border-sage-400 text-text-primary font-semibold shadow-sm'
                      : 'bg-sage-950/30 border-sage-300/15 text-text-secondary hover:border-sage-300/30'
                  }`}
                >
                  {m} Minutes
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-sage-400" />
              Conversation Language
            </label>
            <div className="flex flex-col gap-1.5">
              {languages.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-2 text-xs rounded-xl text-left border transition-all ${
                    language === l
                      ? 'bg-sage-500/25 border-sage-400 text-text-primary font-semibold shadow-sm'
                      : 'bg-sage-950/30 border-sage-300/15 text-text-secondary hover:border-sage-300/30'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between pt-4">
        <GlassButton variant="ghost" size="sm" onClick={() => setWizardStep(2)}>
          ← Back to Company
        </GlassButton>

        <GlassButton
          variant="primary"
          size="md"
          disabled={!selectedRole}
          onClick={() => setWizardStep(4)}
        >
          Continue to Schedule Call →
        </GlassButton>
      </div>
    </div>
  );
};
