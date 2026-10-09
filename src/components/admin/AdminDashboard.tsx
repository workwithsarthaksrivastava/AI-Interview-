import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  Users,
  Video,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Download,
  Activity,
  Building2,
  Filter
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLogs().then(setAuditLogs).catch(console.error);
  }, []);

  const handleExportCsv = (table: string) => {
    window.open(`/api/export/csv/${table}`, '_blank');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Admin Overview</h2>
          <p className="text-xs text-text-secondary mt-1">
            Real-time platform metrics, active sessions, API token usage, and drop-off funnel.
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Total Candidates</span>
            <Users className="w-4 h-4 text-mint" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary">1,482</div>
          <span className="text-[11px] text-mint">+14% this month</span>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Interviews Conducted</span>
            <Video className="w-4 h-4 text-mint" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary">3,890</div>
          <span className="text-[11px] text-mint">94.2% completion rate</span>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Average Hire Score</span>
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-extrabold text-gold">78.4<span className="text-xs text-text-muted">/100</span></div>
          <span className="text-[11px] text-text-secondary">Across all tiers</span>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs">
            <span>Est. AI API Cost</span>
            <DollarSign className="w-4 h-4 text-mint" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary">$42.80</div>
          <span className="text-[11px] text-text-muted">~$0.011 / mock call</span>
        </GlassCard>
      </div>

      {/* Funnel & Active Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop-off Funnel Across Wizard */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Candidate Conversion Funnel</h3>
          <p className="text-xs text-text-muted">Conversion across the 5 wizard stages.</p>

          <div className="space-y-3 pt-1">
            {[
              { stage: '1. Resume Upload', count: 1482, percent: 100 },
              { stage: '2. Select Company', count: 1410, percent: 95 },
              { stage: '3. Select Role', count: 1340, percent: 90 },
              { stage: '4. Schedule Call', count: 1260, percent: 85 },
              { stage: '5. Lobby Calibration Passed', count: 1195, percent: 81 }
            ].map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-text-primary">{f.stage}</span>
                  <span className="text-text-muted">{f.count} users ({f.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-sage-950/40 overflow-hidden border border-sage-300/15">
                  <div
                    className="h-full bg-gradient-to-r from-sage-500 to-mint rounded-full"
                    style={{ width: `${f.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-sage-950/30 border border-sage-300/10">
                <div className="flex justify-between items-center text-[10px] text-text-muted font-mono mb-0.5">
                  <span className="font-bold text-text-primary">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-text-secondary text-[11px]">{log.details}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
