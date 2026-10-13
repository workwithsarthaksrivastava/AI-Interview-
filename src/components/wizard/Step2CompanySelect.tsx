import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { Company } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { Search, CheckCircle, Info, Building2, ShieldCheck } from 'lucide-react';

export const Step2CompanySelect: React.FC = () => {
  const {
    selectedCompany,
    setSelectedCompany,
    setWizardStep
  } = useAppStore();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPersonaDrawer, setSelectedPersonaDrawer] = useState<Company | null>(null);

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(console.error);
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Select Target Company</h2>
          <p className="text-sm text-text-secondary mt-1">
            Each company uses a custom interview persona profile, culture rubric, and question style.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search companies or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-xl bg-sage-950/40 border border-sage-300/20 pl-9 pr-3 py-2 text-text-primary focus:outline-none focus:border-sage-400"
          />
        </div>
      </div>

      {/* Grid of companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((company) => {
          const isSelected = selectedCompany?.id === company.id;

          return (
            <GlassCard
              key={company.id}
              interactive
              onClick={() => setSelectedCompany(company)}
              className={`p-5 flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-2 border-sage-400 shadow-xl shadow-sage-900/40 ring-1 ring-sage-400/50 bg-sage-500/10'
                  : 'border border-sage-300/15 hover:border-sage-300/40'
              }`}
            >
              <div>
                {/* Header: Logo & Name */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-11 h-11 rounded-xl object-cover border border-sage-300/20 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">{company.name}</h3>
                      <p className="text-[11px] text-text-muted">{company.industry}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-sage-500 flex items-center justify-center text-white shadow-sm shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Hiring style summary */}
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-sage-950/30 border border-sage-300/10">
                    <span className="font-semibold text-text-secondary block text-[10px] uppercase">
                      Hiring Rubric & Style:
                    </span>
                    <span className="text-text-primary">{company.hiringStyle}</span>
                  </div>

                  {/* Typical rounds */}
                  <div className="text-[11px] text-text-muted">
                    <span className="font-medium text-text-secondary">Typical Rounds: </span>
                    {company.typicalRounds.join(' · ')}
                  </div>
                </div>
              </div>

              {/* Persona Profile quick toggle */}
              <div className="mt-4 pt-3 border-t border-sage-300/15 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPersonaDrawer(company);
                  }}
                  className="text-xs font-medium text-mint hover:underline flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  View Interview Persona Profile
                </button>

                <span className="text-xs text-text-muted font-medium">
                  {company.personaProfile.difficulty} Bar
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Drawer / Modal for Company Persona Profile */}
      {selectedPersonaDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedPersonaDrawer(null)}
          />
          <div className="relative z-10 max-w-lg w-full rounded-3xl glass-2 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-sage-300/20 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedPersonaDrawer.logo}
                  alt={selectedPersonaDrawer.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <h3 className="font-bold text-base text-text-primary">
                  {selectedPersonaDrawer.name} Persona Profile
                </h3>
              </div>
              <button
                onClick={() => setSelectedPersonaDrawer(null)}
                className="text-text-muted hover:text-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-secondary max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <span className="font-semibold text-text-primary block mb-1">Tone & Atmosphere:</span>
                <p className="p-2.5 rounded-xl bg-sage-950/30 border border-sage-300/10">
                  {selectedPersonaDrawer.personaProfile.tone}
                </p>
              </div>

              <div>
                <span className="font-semibold text-text-primary block mb-1">Key Focus Areas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPersonaDrawer.personaProfile.focusAreas.map((area, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-sage-500/20 text-text-primary text-[11px] border border-sage-300/20">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-text-primary block mb-1">Typical Question Styles:</span>
                <ul className="list-disc list-inside space-y-1">
                  {selectedPersonaDrawer.personaProfile.typicalQuestionStyles.map((style, idx) => (
                    <li key={idx}>{style}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-text-primary block mb-1">Hiring Bar Criteria:</span>
                <ul className="list-disc list-inside space-y-1">
                  {selectedPersonaDrawer.personaProfile.hiringBarCriteria.map((bar, idx) => (
                    <li key={idx}>{bar}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedCompany(selectedPersonaDrawer);
                  setSelectedPersonaDrawer(null);
                }}
              >
                Select {selectedPersonaDrawer.name}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between pt-4">
        <GlassButton variant="ghost" size="sm" onClick={() => setWizardStep(1)}>
          ← Back to Resume
        </GlassButton>

        <GlassButton
          variant="primary"
          size="md"
          disabled={!selectedCompany}
          onClick={() => setWizardStep(3)}
        >
          Continue to Select Role →
        </GlassButton>
      </div>
    </div>
  );
};
