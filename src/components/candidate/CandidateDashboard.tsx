import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { EvaluationReport } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  FileText,
  Calendar,
  Building2,
  Award,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  Plus
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const { currentUser, parsedResume, setCurrentReport, setCurrentView } = useAppStore();
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getReports()
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Candidate Hub
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Welcome back, <strong>{currentUser.name}</strong> ({currentUser.email}). Track your interview readiness across companies.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={() => setCurrentView('wizard')}
          icon={<Plus className="w-4 h-4" />}
        >
          Take New Mock Interview
        </GlassButton>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sage-500/20 text-mint flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase text-text-muted font-bold block">Interviews Completed</span>
            <div className="text-2xl font-extrabold text-text-primary">{reports.length > 0 ? reports.length : 1}</div>
            <span className="text-[11px] text-mint">100% completion rate</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase text-text-muted font-bold block">Average Hire Score</span>
            <div className="text-2xl font-extrabold text-gold">
              {reports.length > 0 ? Math.round(reports.reduce((acc, r) => acc + r.overallScore, 0) / reports.length) : 84}/100
            </div>
            <span className="text-[11px] text-text-secondary">Strong Hire Band</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-mint/15 text-mint flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase text-text-muted font-bold block">Resume Strength</span>
            <div className="text-2xl font-extrabold text-mint">{parsedResume?.strengthScore || 88}/100</div>
            <span className="text-[11px] text-text-secondary">{parsedResume?.seniorityEstimate || 'Mid-Level'} Candidate</span>
          </div>
        </GlassCard>
      </div>

      {/* Past Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Your Mock Interview Reports</h2>
          <span className="text-xs text-text-muted">{reports.length} Reports</span>
        </div>

        {reports.length === 0 ? (
          <GlassCard className="p-12 text-center space-y-4">
            <p className="text-xs text-text-muted">You haven't completed any mock interviews yet.</p>
            <GlassButton variant="primary" size="sm" onClick={() => setCurrentView('wizard')}>
              Start Your First Interview
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <GlassCard
                key={report.id}
                interactive
                onClick={() => {
                  setCurrentReport(report);
                  setCurrentView('report');
                }}
                className="p-5 border border-sage-300/20 hover:border-sage-400/40"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-text-primary">{report.companyName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sage-500/20 text-mint">
                        {report.interviewType}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-text-secondary">{report.roleTitle}</h3>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-gold">{report.overallScore}<span className="text-xs text-text-muted">/100</span></div>
                    <span className="text-[10px] text-mint font-semibold block">{report.hireReadinessVerdict}</span>
                  </div>
                </div>

                <p className="text-xs text-text-muted line-clamp-2 mb-3">
                  {report.executiveSummary}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-sage-300/15 text-[11px] text-text-muted">
                  <span>{report.date} · {report.durationMinutes} min</span>
                  <span className="text-mint font-medium flex items-center gap-1">
                    View Full 12-Section Report →
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
