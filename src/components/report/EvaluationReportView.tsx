import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { EvaluationReport } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { downloadEvaluationReportPdf } from '../../utils/pdfGenerator';
import {
  Award,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  Clock,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Volume2,
  Video,
  Sparkles,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

export const EvaluationReportView: React.FC = () => {
  const { currentReport, setCurrentView, addToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'speech' | 'plan' | 'transcript'>('overview');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!currentReport) {
    return (
      <div className="p-12 text-center">
        <p className="text-text-muted">No evaluation report available.</p>
        <GlassButton variant="primary" size="sm" onClick={() => setCurrentView('landing')} className="mt-4">
          Return to Home
        </GlassButton>
      </div>
    );
  }

  const r = currentReport;

  // Download PDF
  const handlePrintPdf = () => {
    try {
      downloadEvaluationReportPdf(r);
      addToast('success', 'Evaluation report PDF downloaded successfully!');
    } catch (err: any) {
      console.error('Failed to generate PDF directly, opening print preview:', err);
      window.print();
      addToast('info', 'Opening print preview for PDF save...');
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(r, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `interviewiq_report_${r.id}.json`);
    dl.click();
    addToast('success', 'JSON data exported!');
  };

  // Share Link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `?share=${r.shareToken}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    addToast('success', 'Private share link copied to clipboard.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-left print:p-0 print:m-0">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-widest text-mint block">
            Executive Bar-Raiser Evaluation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mt-1">
            Performance & Hire-Readiness Report
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Generated on {r.date} · Evaluated against {r.companyName}'s canonical hiring bar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleShare}
            icon={copiedLink ? <Check className="w-3.5 h-3.5 text-mint" /> : <Share2 className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'Copied' : 'Share Report'}
          </GlassButton>

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleExportJson}
            icon={<FileText className="w-3.5 h-3.5" />}
          >
            Export JSON
          </GlassButton>

          <GlassButton
            variant="primary"
            size="sm"
            onClick={handlePrintPdf}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download PDF
          </GlassButton>
        </div>
      </div>

      {/* 2. Cover & Verdict Summary Card */}
      <GlassCard className="p-6 sm:p-8 bg-sage-950/40 border border-sage-400/25 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-sage-300/15">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-mint mb-2">
              <span className="font-semibold text-text-primary">{r.companyName}</span>
              <span aria-hidden="true" className="text-sage-400/40">·</span>
              <span className="text-text-secondary">{r.roleTitle}</span>
              <span aria-hidden="true" className="text-sage-400/40">·</span>
              <span className="text-text-muted">{r.difficulty} Bar</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Candidate: {r.candidateName}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Interview Type: {r.interviewType} · Duration: {r.durationMinutes} Minutes
            </p>
          </div>

          {/* Verdict & Score Cluster */}
          <div className="flex items-center gap-5 sm:gap-8 bg-sage-900/60 p-4 sm:p-5 rounded-3xl border border-sage-300/30 shadow-lg">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-text-muted block">Overall Score</span>
              <div className="text-4xl sm:text-5xl font-extrabold text-gold tracking-tight">
                {r.overallScore}
                <span className="text-sm font-normal text-text-muted">/100</span>
              </div>
              <span className="text-xs font-semibold text-mint">{r.gradeBand} Band</span>
            </div>

            <div className="h-12 w-px bg-sage-300/20" />

            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Hiring Bar Verdict</span>
              <div className="text-base sm:text-lg font-bold text-text-primary mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-status-success" />
                <span>{r.hireReadinessVerdict}</span>
              </div>
              <span className="text-[11px] text-text-secondary block mt-0.5">
                Ready for on-site rounds at {r.companyName}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Executive Hiring Summary
          </h3>
          <p className="text-sm text-text-primary leading-relaxed bg-sage-950/30 p-4 rounded-2xl border border-sage-300/15">
            {r.executiveSummary}
          </p>
        </div>
      </GlassCard>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-sage-300/15 text-xs font-medium print:hidden">
        {[
          { id: 'overview', label: '1. Score Dashboard & Strengths' },
          { id: 'questions', label: '2. Question-by-Question Breakdown' },
          { id: 'speech', label: '3. Speech & Voice Analytics' },
          { id: 'plan', label: '4. Improvement Roadmap' },
          { id: 'transcript', label: '5. Transcript & Rubric Appendix' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-sage-500/25 text-mint font-bold border border-sage-300/80 dark:border-mint/60 shadow-[0_2px_8px_rgba(40,55,35,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-sage-500/10 border border-transparent hover:border-sage-300/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 2: Score Dashboard & Competency Breakdown */}
      {(activeTab === 'overview' || window.matchMedia('print').matches) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Scores List */}
            <GlassCard className="p-6 space-y-4">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-mint" />
                Category Competency Scores
              </h3>
              <p className="text-xs text-text-muted">
                Benchmarked against {r.companyName}'s target standard (dotted line indicates hiring benchmark).
              </p>

              <div className="space-y-3.5 pt-2">
                {r.categoryScores.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text-primary">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-text-muted">Target: {cat.benchmark}</span>
                        <span className="font-bold text-gold">{cat.score}/100</span>
                      </div>
                    </div>
                    {/* Progress Bar with Benchmark Marker */}
                    <div className="relative w-full h-2 rounded-full bg-sage-950/50 overflow-hidden border border-sage-300/15">
                      <div
                        className="h-full bg-gradient-to-r from-sage-500 to-mint rounded-full transition-all"
                        style={{ width: `${cat.score}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gold-light"
                        style={{ left: `${cat.benchmark}%` }}
                        title={`Benchmark: ${cat.benchmark}`}
                      />
                    </div>
                    <p className="text-[11px] text-text-secondary italic pt-0.5">{cat.justification}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Strengths & Weaknesses (Top 5 each with evidence quotes) */}
            <div className="space-y-6">
              {/* Top Strengths */}
              <GlassCard className="p-6 space-y-3">
                <h3 className="text-sm font-bold text-mint flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-mint" />
                  Key Strengths (Verified with Quotes)
                </h3>
                <div className="space-y-2.5">
                  {r.topStrengths.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-sage-950/30 border border-sage-300/15 text-xs">
                      <div className="font-bold text-text-primary mb-1">{s.title}</div>
                      <blockquote className="text-[11px] text-text-secondary italic border-l-2 border-mint pl-2 mb-1">
                        "{s.evidenceQuote}"
                      </blockquote>
                      <div className="text-[10px] text-mint">Impact: {s.impact}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Top Weaknesses & Remediation */}
              <GlassCard className="p-6 space-y-3">
                <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gold" />
                  Areas to Strengthen (With Remediation)
                </h3>
                <div className="space-y-2.5">
                  {r.topWeaknesses.map((w, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-sage-950/30 border border-sage-300/15 text-xs">
                      <div className="font-bold text-text-primary mb-1">{w.title}</div>
                      <blockquote className="text-[11px] text-text-secondary italic border-l-2 border-gold pl-2 mb-1">
                        "{w.evidenceQuote}"
                      </blockquote>
                      <div className="text-[10px] text-text-muted">Fix: {w.remediation}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Bar-Raiser Red Flags (if identified) */}
              {r.redFlags && r.redFlags.length > 0 && (
                <GlassCard className="p-6 space-y-3 border-status-error/30 bg-status-error/5">
                  <h3 className="text-sm font-bold text-status-error flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-status-error" />
                    Bar-Raiser Red Flags & Critical Risks ({r.redFlags.length})
                  </h3>
                  <div className="space-y-2.5">
                    {r.redFlags.map((rf, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-sage-950/50 border border-status-error/25 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text-primary">{rf.flag}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            rf.severity === 'High'
                              ? 'bg-status-error/20 text-status-error'
                              : rf.severity === 'Medium'
                              ? 'bg-gold/20 text-gold'
                              : 'text-text-muted'
                          }`}>
                            {rf.severity} Severity
                          </span>
                        </div>
                        {rf.excerpt && (
                          <blockquote className="text-[11px] text-text-secondary italic border-l-2 border-status-error/40 pl-2">
                            "{rf.excerpt}"
                          </blockquote>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Company-Specific Insights */}
          <GlassCard className="p-6 space-y-3 bg-gradient-to-r from-sage-900/30 to-sage-950/50">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-mint" />
              {r.companyName} Hiring Bar Analysis
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {r.companySpecificInsights.barComparison}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20">
                <span className="font-bold text-status-success block mb-1">Likely to Clear:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-text-secondary">
                  {r.companySpecificInsights.likelyToPassRounds.map((round, idx) => (
                    <li key={idx}>{round}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-xl bg-gold/10 border border-gold/25">
                <span className="font-bold text-gold block mb-1">Needs Target Practice:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-text-secondary">
                  {r.companySpecificInsights.likelyToStruggleRounds.map((round, idx) => (
                    <li key={idx}>{round}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 3: Question-by-Question Breakdown */}
      {(activeTab === 'questions' || window.matchMedia('print').matches) && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-text-primary">
              Question-by-Question Detailed Breakdown ({r.questionsBreakdown.length} Questions)
            </h3>
            <span className="text-xs text-text-muted">Click each question to view ideal model answers & critique</span>
          </div>

          {r.questionsBreakdown.map((q, idx) => {
            const isExpanded = expandedQuestion === idx;

            return (
              <GlassCard
                key={idx}
                className="p-5 border border-sage-300/20 transition-all cursor-pointer"
                onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-sage-500/20 text-mint font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {q.questionNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-mint bg-sage-500/20 px-2 py-0.5 rounded">
                          {q.category}
                        </span>
                        <span className="text-[11px] text-text-muted">Time taken: {q.timeTakenSeconds}s · [{q.transcriptTimestamp}]</span>
                      </div>
                      <h4 className="font-bold text-sm text-text-primary">{q.questionText}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-gold">{q.scoreOutOf10}/10</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-sage-300/15 space-y-3.5 text-xs text-left animate-in fade-in duration-150">
                    {/* Candidate Answer Excerpt */}
                    <div className="p-3 rounded-xl bg-sage-950/40 border border-sage-300/15">
                      <span className="font-semibold text-text-muted block text-[10px] uppercase mb-1">
                        Your Answer (Excerpt from Transcript):
                      </span>
                      <p className="italic text-text-primary leading-relaxed">"{q.candidateAnswerExcerpt}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20">
                        <span className="font-bold text-status-success block mb-1">What Was Good:</span>
                        <p className="text-text-secondary">{q.whatWasGood}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/20">
                        <span className="font-bold text-status-error block mb-1">What Was Missing / Mistakes:</span>
                        <p className="text-text-secondary">{q.whatWasMissing || q.mistakesOrErrors}</p>
                      </div>
                    </div>

                    {/* Ideal Model Answer */}
                    <div className="p-3.5 rounded-xl bg-gold/10 border border-gold/25">
                      <span className="font-bold text-gold block mb-1">Ideal Model Answer (Bar-Raiser Benchmark):</span>
                      <p className="text-text-primary leading-relaxed">{q.idealModelAnswer}</p>
                    </div>

                    {q.followUpAsked && (
                      <div className="text-[11px] text-text-muted p-2 rounded-lg bg-sage-950/30">
                        <strong>Follow-up Probed: </strong>"{q.followUpAsked}" — <span>{q.followUpHandling}</span>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* SECTION 4: Speech & Voice Analytics */}
      {(activeTab === 'speech' || window.matchMedia('print').matches) && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <GlassCard className="p-4 text-center">
              <span className="text-[10px] uppercase text-text-muted block">Speaking Pace</span>
              <div className="text-2xl font-extrabold text-mint mt-1">{r.speechAnalytics.overallWpm} WPM</div>
              <span className="text-[11px] text-text-secondary">{r.speechAnalytics.paceConsistency}</span>
            </GlassCard>

            <GlassCard className="p-4 text-center">
              <span className="text-[10px] uppercase text-text-muted block">Filler Words</span>
              <div className="text-2xl font-extrabold text-gold mt-1">{r.speechAnalytics.fillerWordsCount} Total</div>
              <span className="text-[11px] text-text-secondary">Low impact</span>
            </GlassCard>

            <GlassCard className="p-4 text-center">
              <span className="text-[10px] uppercase text-text-muted block">Talk-to-Listen Ratio</span>
              <div className="text-2xl font-extrabold text-mint mt-1">{r.speechAnalytics.talkToListenRatioPercent}%</div>
              <span className="text-[11px] text-text-secondary">Candidate dominated</span>
            </GlassCard>

            <GlassCard className="p-4 text-center">
              <span className="text-[10px] uppercase text-text-muted block">Clarity Score</span>
              <div className="text-2xl font-extrabold text-text-primary mt-1">{r.speechAnalytics.clarityScore}%</div>
              <span className="text-[11px] text-text-secondary">Articulate & direct</span>
            </GlassCard>
          </div>

          {/* Filler words breakdown */}
          <GlassCard className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-text-primary">Filler Words Breakdown</h3>
            <div className="flex flex-wrap gap-2">
              {r.speechAnalytics.fillerWordsBreakdown.map((item, idx) => (
                <div key={idx} className="px-3 py-1.5 rounded-xl bg-sage-950/40 border border-sage-300/20 text-xs flex items-center gap-2">
                  <span className="font-mono text-gold font-bold">"{item.word}"</span>
                  <span className="text-text-muted">× {item.count}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Language quality & phrasing */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Language Quality & Vocabulary Upgrades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-mint block mb-1">Strong Phrases Used:</span>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  {r.speechAnalytics.languageQuality.strongPhrases.map((phrase, i) => (
                    <li key={i}>{phrase}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-gold block mb-1">Weak Phrases to Replace:</span>
                <div className="space-y-2">
                  {r.speechAnalytics.languageQuality.weakPhrasesToReplace.map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-sage-950/30 border border-sage-300/10">
                      <div className="text-status-error line-through">{item.weak}</div>
                      <div className="text-mint font-medium mt-0.5">→ {item.replacement}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 5: Improvement Roadmap & Action Plan */}
      {(activeTab === 'plan' || window.matchMedia('print').matches) && (
        <div className="space-y-6">
          {/* Priority Skills to Fix */}
          <GlassCard className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-mint flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-mint" />
              Top 5 Priority Skills to Master Before On-Site
            </h3>
            <div className="flex flex-wrap gap-2">
              {r.personalizedImprovementPlan.top5PrioritySkillsToFix.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-sage-500/20 border border-sage-400/30 text-xs font-semibold text-text-primary"
                >
                  {idx + 1}. {skill}
                </span>
              ))}
            </div>
          </GlassCard>

          {/* 7-Day & 30-Day Schedules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-Day Schedule */}
            <GlassCard className="p-6 space-y-3">
              <h3 className="text-sm font-bold text-text-primary">7-Day Fast Sprint Plan</h3>
              <div className="space-y-2.5">
                {r.personalizedImprovementPlan.sevenDaySchedule.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-sage-950/30 border border-sage-300/15 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gold block">{s.day}</span>
                      <span className="text-text-primary">{s.task}</span>
                    </div>
                    <span className="text-[11px] text-text-muted shrink-0 ml-3">{s.timeNeeded}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* 30-Day Comprehensive Schedule */}
            <GlassCard className="p-6 space-y-3">
              <h3 className="text-sm font-bold text-text-primary">30-Day Mastery Schedule</h3>
              <div className="space-y-2.5">
                {r.personalizedImprovementPlan.thirtyDaySchedule.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-sage-950/30 border border-sage-300/15 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-mint">{m.week}</span>
                      <span className="text-[11px] text-text-muted">{m.outcome}</span>
                    </div>
                    <p className="text-text-secondary">{m.focus}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* 10 Targeted Practice Questions */}
          <GlassCard className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-text-primary">Targeted Practice Questions Tailored to Weaknesses</h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-text-secondary">
              {r.personalizedImprovementPlan.targetedPracticeQuestions.map((q, idx) => (
                <li key={idx} className="p-2.5 rounded-xl bg-sage-950/30 border border-sage-300/10">
                  <span className="text-text-primary font-medium">{q}</span>
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>
      )}

      {/* SECTION 6: Transcript & Appendix */}
      {(activeTab === 'transcript' || window.matchMedia('print').matches) && (
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-base font-bold text-text-primary">Full Verified Transcript</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 text-xs">
            {r.appendix.fullTranscript.map((turn, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${
                  turn.speaker === 'ai'
                    ? 'bg-sage-500/10 border-sage-300/20 text-text-primary'
                    : 'bg-sage-950/40 border-sage-300/15 text-text-secondary'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-text-muted mb-1 font-mono">
                  <span>{turn.speaker.toUpperCase()} ({turn.speaker === 'ai' ? r.companyName : r.candidateName})</span>
                  <span>[{turn.timestamp}]</span>
                </div>
                <p className="leading-relaxed">{turn.text}</p>
              </div>
            ))}
          </div>

          {/* Code Submission */}
          {r.appendix.codeSubmissions && (
            <div className="mt-4 pt-4 border-t border-sage-300/15">
              <h4 className="text-xs font-bold text-text-primary mb-2">Code Submission in Editor</h4>
              <pre className="p-3 rounded-xl bg-sage-950/70 border border-sage-300/20 text-[11px] font-mono text-mint-light overflow-x-auto">
                {r.appendix.codeSubmissions}
              </pre>
            </div>
          )}
        </GlassCard>
      )}

      {/* Bottom CTA to Retake or Book Follow-Up */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <GlassButton variant="ghost" size="sm" onClick={() => setCurrentView('candidate-dashboard')}>
          ← Back to Past Reports
        </GlassButton>

        <GlassButton
          variant="primary"
          size="md"
          onClick={() => setCurrentView('wizard')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Schedule Another Mock Interview
        </GlassButton>
      </div>
    </div>
  );
};
