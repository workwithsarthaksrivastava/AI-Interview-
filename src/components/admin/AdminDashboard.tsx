import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { InterviewSession, EvaluationReport, User, QuestionItem } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  Users,
  Video,
  TrendingUp,
  Download,
  Activity,
  FileCheck2,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRealData() {
      try {
        setLoading(true);
        const [usersData, interviewsData, reportsData, questionsData, logsData] = await Promise.all([
          api.getUsers().catch(() => []),
          api.getInterviews().catch(() => []),
          api.getReports().catch(() => []),
          api.getQuestions().catch(() => []),
          api.getAuditLogs().catch(() => [])
        ]);

        if (isMounted) {
          setUsers(usersData || []);
          setInterviews(interviewsData || []);
          setReports(reportsData || []);
          setQuestions(questionsData || []);
          setAuditLogs(logsData || []);
        }
      } catch (err) {
        console.error('Failed to load real database metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRealData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportCsv = (table: string) => {
    window.open(`/api/export/csv/${table}`, '_blank');
  };

  const totalCandidates = users.length;
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter((i) => i.status === 'completed').length;
  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled').length;
  const inProgressInterviews = interviews.filter((i) => i.status === 'live' || i.status === 'evaluating' || i.status === 'lobby').length;

  const avgScore =
    reports.length > 0
      ? (reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reports.length).toFixed(1)
      : null;

  const strongHireCount = reports.filter(
    (r) => r.hireReadinessVerdict === 'Strong Hire' || r.hireReadinessVerdict === 'Lean Hire'
  ).length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Admin Overview</h2>
          <p className="text-xs text-text-secondary mt-1">
            Real-time platform metrics, live sessions, question bank depth, and audit trail synced from the database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => handleExportCsv('interviews')}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Interviews CSV
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => handleExportCsv('questions')}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Question Bank CSV
          </GlassButton>
        </div>
      </div>

      {/* Real Synced KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Registered Candidates</span>
            <Users className="w-4 h-4 text-mint" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary">
            {loading ? '...' : totalCandidates}
          </div>
          <span className="text-[11px] text-text-muted">Synced user profiles</span>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Interviews Created</span>
            <Video className="w-4 h-4 text-mint" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary">
            {loading ? '...' : totalInterviews}
          </div>
          <span className="text-[11px] text-mint">
            {completedInterviews} completed
          </span>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Average Hire Score</span>
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-extrabold text-gold">
            {loading ? '...' : avgScore !== null ? `${avgScore}/100` : '—'}
          </div>
          <span className="text-[11px] text-text-secondary">
            {reports.length > 0 ? `${reports.length} scored reports` : 'No reports yet'}
          </span>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Question Bank</span>
            <HelpCircle className="w-4 h-4 text-mint" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary">
            {loading ? '...' : questions.length}
          </div>
          <span className="text-[11px] text-text-muted">Active interview questions</span>
        </GlassCard>
      </div>

      {/* Real Sessions Status Breakdown & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Session Breakdown */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-mint" />
            Interview Session Breakdown
          </h3>
          <p className="text-xs text-text-muted">Live distribution of candidate interview statuses in the database.</p>

          <div className="space-y-3 pt-1">
            {[
              {
                label: 'Completed Interviews',
                count: completedInterviews,
                color: 'bg-mint'
              },
              {
                label: 'Scheduled Calls',
                count: scheduledInterviews,
                color: 'bg-sage-400'
              },
              {
                label: 'In-Progress Sessions',
                count: inProgressInterviews,
                color: 'bg-gold'
              },
              {
                label: 'Generated Evaluation Reports',
                count: reports.length,
                color: 'bg-sage-300'
              }
            ].map((item, idx) => {
              const maxCount = Math.max(1, totalInterviews, reports.length);
              const percentage = Math.min(100, Math.round((item.count / maxCount) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-text-primary">{item.label}</span>
                    <span className="text-text-muted">{item.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-sage-950/40 overflow-hidden border border-sage-300/15">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalInterviews === 0 && (
            <div className="p-3 text-center text-xs text-text-muted rounded-xl bg-sage-950/30">
              No interview sessions recorded in the database yet.
            </div>
          )}
        </GlassCard>

        {/* Real-time System Audit Trail */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-mint" />
              Live System Audit Log
            </h3>
            <span className="text-[10px] uppercase font-bold text-mint bg-sage-500/20 px-2 py-0.5 rounded">
              Live
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">No audit events logged yet.</p>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-sage-950/30 border border-sage-300/10">
                  <div className="flex justify-between items-center text-[10px] text-text-muted font-mono mb-0.5">
                    <span className="font-bold text-text-primary">{log.action}</span>
                    <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}</span>
                  </div>
                  <p className="text-text-secondary text-[11px]">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Real Synchronized Evaluation Reports Table */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-mint" />
            Recent Evaluation Reports in Database
          </h3>
          <span className="text-xs text-text-muted">{reports.length} total</span>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No reports synchronized yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-sage-300/15 text-text-muted">
                  <th className="py-2 px-3 font-semibold">Candidate</th>
                  <th className="py-2 px-3 font-semibold">Target Company</th>
                  <th className="py-2 px-3 font-semibold">Role</th>
                  <th className="py-2 px-3 font-semibold">Score</th>
                  <th className="py-2 px-3 font-semibold">Verdict</th>
                  <th className="py-2 px-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-300/10">
                {reports.slice(0, 6).map((r) => (
                  <tr key={r.id} className="hover:bg-sage-500/5">
                    <td className="py-2 px-3 font-medium text-text-primary">{r.candidateName}</td>
                    <td className="py-2 px-3 text-text-secondary">{r.companyName}</td>
                    <td className="py-2 px-3 text-text-secondary">{r.roleTitle}</td>
                    <td className="py-2 px-3 font-bold text-gold">{r.overallScore}/100</td>
                    <td className="py-2 px-3 text-mint">{r.hireReadinessVerdict}</td>
                    <td className="py-2 px-3 text-text-muted">{r.date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
