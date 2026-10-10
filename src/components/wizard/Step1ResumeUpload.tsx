import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { DEMO_CANDIDATE_RESUME } from '../../data/seedData';
import { parseResumeHeuristically } from '../../utils/resumeParser';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Edit2, Sparkles, Plus, X } from 'lucide-react';

export const Step1ResumeUpload: React.FC = () => {
  const {
    parsedResume,
    setParsedResume,
    isParsingResume,
    setIsParsingResume,
    setWizardStep,
    addToast
  } = useAppStore();

  const [rawText, setRawText] = useState(DEMO_CANDIDATE_RESUME);
  const [fileName, setFileName] = useState('sarthak_srivastava_resume.pdf');
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const handleParse = async (textToParse: string, name = 'resume.pdf') => {
    try {
      setIsParsingResume(true);
      const data = await api.parseResume(textToParse, name);
      setParsedResume(data);
      addToast('success', `Resume parsed successfully for ${data.name}!`);
    } catch (err: any) {
      console.warn('Resume parse exception, applying heuristic profile:', err);
      const fallback = parseResumeHeuristically(textToParse, name);
      setParsedResume(fallback);
      addToast('success', `Resume parsed successfully for ${fallback.name}!`);
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('warning', 'File size exceeds 5 MB. Please upload a smaller file.');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content || DEMO_CANDIDATE_RESUME);
      handleParse(content || DEMO_CANDIDATE_RESUME, file.name);
    };
    reader.readAsText(file);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || !parsedResume) return;
    setParsedResume({
      ...parsedResume,
      skills: [...parsedResume.skills, newSkill.trim()]
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!parsedResume) return;
    setParsedResume({
      ...parsedResume,
      skills: parsedResume.skills.filter((s) => s !== skillToRemove)
    });
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Upload Your Resume</h2>
        <p className="text-sm text-text-secondary mt-1">
          Our AI analyzes your experience to personalize interview questions, benchmark seniority, and probe real project decisions.
        </p>
      </div>

      {!parsedResume ? (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <GlassCard className="p-8 sm:p-10 border-dashed border-2 border-sage-400/40 text-center hover:border-sage-400/70 transition-colors">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sage-500/15 border border-sage-400/30 flex items-center justify-center text-sage-300">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Drag and drop your PDF or DOCX resume here
                </h3>
                <p className="text-xs text-text-muted mt-1">Supports PDF, DOCX, TXT (Maximum file size: 5 MB)</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage-500 text-white font-medium text-sm hover:bg-sage-600 transition-colors shadow-md">
                    <FileText className="w-4 h-4" />
                    Browse Local File
                  </span>
                </label>

                <GlassButton
                  variant="secondary"
                  onClick={() => handleParse(DEMO_CANDIDATE_RESUME, 'sarthak_srivastava_resume.pdf')}
                  loading={isParsingResume}
                  icon={<Sparkles className="w-4 h-4 text-gold" />}
                >
                  Load Demo Candidate Profile
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Fallback direct text input */}
          <div className="text-center">
            <p className="text-xs text-text-muted mb-2">Or paste your resume text directly:</p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={4}
              placeholder="Paste raw resume text here..."
              className="w-full rounded-2xl bg-sage-950/30 border border-sage-300/20 p-4 text-xs font-mono text-text-secondary focus:outline-none focus:border-sage-400"
            />
            <div className="mt-2 flex justify-end">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => handleParse(rawText)}
                loading={isParsingResume}
              >
                Parse Pasted Text
              </GlassButton>
            </div>
          </div>
        </div>
      ) : (
        /* Parsed profile view & editor */
        <div className="space-y-6">
          {/* Top Banner: Strength score & tips */}
          <GlassCard className="p-6 bg-gradient-to-r from-sage-950/40 via-sage-900/30 to-sage-950/40 border border-sage-400/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sage-300/15">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-text-primary">{parsedResume.name}</h3>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-mint/20 text-mint border border-mint/30">
                    {parsedResume.seniorityEstimate} (~{parsedResume.yearsOfExperience} yrs exp)
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1">{parsedResume.summary}</p>
              </div>

              {/* Strength Score */}
              <div className="flex items-center gap-3 shrink-0 bg-sage-900/50 px-4 py-2.5 rounded-2xl border border-sage-400/30">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold text-text-muted">Resume Strength</div>
                  <div className="text-2xl font-extrabold text-gold">{parsedResume.strengthScore}<span className="text-xs text-text-muted font-normal">/100</span></div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-gold flex items-center justify-center font-bold text-xs text-gold">
                  {parsedResume.strengthScore >= 80 ? 'A' : 'B'}
                </div>
              </div>
            </div>

            {/* 3 Improvement Tips */}
            <div className="pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Key AI Resume Improvement Tips
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-text-secondary">
                {parsedResume.improvementTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-sage-950/30 border border-sage-300/10">
                    <span className="w-4 h-4 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>

          {/* Skills Tag Cloud with Editable additions */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-text-primary">Detected Skills & Technologies</h4>
              <span className="text-xs text-text-muted">{parsedResume.skills.length} skills</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {parsedResume.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sage-500/20 text-text-primary text-xs border border-sage-300/20"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-status-error text-text-muted"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add another skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                className="w-full text-xs rounded-xl bg-sage-950/40 border border-sage-300/20 px-3 py-1.5 text-text-primary focus:outline-none focus:border-sage-400"
              />
              <GlassButton variant="secondary" size="sm" onClick={handleAddSkill}>
                <Plus className="w-3.5 h-3.5" />
              </GlassButton>
            </div>
          </GlassCard>

          {/* Experience Highlights */}
          <GlassCard className="p-6">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Extracted Experience & Projects</h4>
            <div className="space-y-4">
              {parsedResume.experience.map((exp, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-sage-950/25 border border-sage-300/15">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary">{exp.role} @ {exp.company}</span>
                    <span className="text-text-muted">{exp.duration}</span>
                  </div>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-text-secondary">
                    {exp.highlights.map((h, hIdx) => (
                      <li key={hIdx}>{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Actions: Re-upload or proceed */}
          <div className="flex items-center justify-between pt-4">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setParsedResume(null)}
            >
              ← Upload a Different Resume
            </GlassButton>

            <GlassButton
              variant="primary"
              size="md"
              onClick={() => setWizardStep(2)}
            >
              Continue to Select Company →
            </GlassButton>
          </div>
        </div>
      )}
    </div>
  );
};
