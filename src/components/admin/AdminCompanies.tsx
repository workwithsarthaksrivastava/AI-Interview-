import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Company } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassModal } from '../common/GlassModal';
import { GlassInput } from '../common/GlassInput';
import { useAppStore } from '../../store/useAppStore';
import {
  Building2,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const AdminCompanies: React.FC = () => {
  const { addToast } = useAppStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [hiringStyle, setHiringStyle] = useState('');
  const [logo, setLogo] = useState('');

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanies();
      setCompanies(data || []);
    } catch (e) {
      console.error('Failed to load companies:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Please enter a company name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newComp = await api.createCompany({
        name: name.trim(),
        industry: industry.trim() || 'Cloud & Technology Services',
        hiringStyle: hiringStyle.trim() || 'Technical Problem Solving, Architectural Rigor, Behavioral Alignment',
        logo: logo.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80',
        active: true,
        typicalRounds: ['Coding & Technical Screen (1 round)', 'System Architecture (1 round)', 'Behavioral & Leadership (1 round)'],
        personaProfile: {
          focusAreas: ['Distributed Systems', 'Production Resilience', 'Algorithms'],
          difficulty: 'Senior',
          tone: 'Rigorous & Technical',
          typicalQuestionStyles: ['System scaling', 'Edge case breakdown', 'Behavioral STAR probe'],
          coreValues: ['Customer-Centricity', 'Excellence', 'Ownership'],
          hiringBarCriteria: ['Clear trade-off reasoning', 'Structured communication', 'No hand-waving']
        }
      });

      setCompanies((prev) => [...prev, newComp]);
      addToast('success', `Added company ${newComp.name}!`);
      setIsAddModalOpen(false);
      setName('');
      setIndustry('');
      setHiringStyle('');
      setLogo('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      await api.deleteCompany(companyToDelete.id);
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      addToast('success', `Removed ${companyToDelete.name} from the platform.`);
      setCompanyToDelete(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete company');
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.hiringStyle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Companies Management</h2>
          <p className="text-xs text-text-secondary mt-1">
            Add or remove target companies, manage interview personas, and configure hiring rubrics.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Target Company
        </GlassButton>
      </div>

      {/* Filter & Search Bar */}
      <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name or industry..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-sage-950/40 border border-sage-300/20 text-xs text-text-primary focus:outline-none focus:border-sage-400"
          />
        </div>
        <span className="text-xs text-text-muted">
          Showing {filteredCompanies.length} of {companies.length} companies
        </span>
      </GlassCard>

      {/* Companies Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-text-muted">Loading target companies...</div>
      ) : filteredCompanies.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-3">
          <Building2 className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-xs text-text-muted">No companies found matching your search.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <GlassCard key={company.id} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={company.logo}
                      alt={company.name}
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80';
                      }}
                      className="w-10 h-10 rounded-xl object-cover border border-sage-300/20 bg-sage-900/50"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{company.name}</h3>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        {company.industry || 'Technology'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCompanyToDelete(company)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={`Delete ${company.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {company.hiringStyle}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {company.typicalRounds?.slice(0, 2).map((rnd, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-sage-950/40 text-text-muted border border-sage-300/10">
                      {rnd}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-sage-300/10 flex items-center justify-between text-[11px] text-text-muted">
                <span className="flex items-center gap-1 text-mint font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active in candidate catalog
                </span>
                <span className="font-mono text-[10px]">{company.id}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      <GlassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Target Company"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4 text-left">
          <GlassInput
            label="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix, Stripe, Datadog"
            required
          />

          <GlassInput
            label="Industry Domain"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Cloud Streaming, Fintech, Observability"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Hiring Style / Philosophy</label>
            <textarea
              value={hiringStyle}
              onChange={(e) => setHiringStyle(e.target.value)}
              rows={3}
              placeholder="e.g. Rigorous architectural problem solving, distributed systems scale, leadership principles..."
              className="w-full p-3 rounded-xl bg-sage-950/50 border border-sage-300/20 text-xs text-text-primary focus:outline-none focus:border-sage-400"
            />
          </div>

          <GlassInput
            label="Logo Image URL (Optional)"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://example.com/logo.png"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-sage-300/15">
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
            >
              Save Company
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <GlassModal
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        title="Confirm Company Deletion"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <p>
              Are you sure you want to remove <strong>{companyToDelete?.name}</strong>? Candidates will no longer be able to select this company in the interview wizard.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setCompanyToDelete(null)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="danger"
              size="sm"
              onClick={handleDeleteCompany}
            >
              Yes, Remove Company
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
