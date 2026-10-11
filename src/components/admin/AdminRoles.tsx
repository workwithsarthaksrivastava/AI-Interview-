import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Role, Company } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassModal } from '../common/GlassModal';
import { GlassInput } from '../common/GlassInput';
import { useAppStore } from '../../store/useAppStore';
import {
  Briefcase,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Building2,
  Layers,
  AlertTriangle
} from 'lucide-react';

export const AdminRoles: React.FC = () => {
  const { addToast } = useAppStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [skillsText, setSkillsText] = useState('TypeScript, React, Node.js, System Design');
  const [description, setDescription] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, companiesData] = await Promise.all([
        api.getRoles(),
        api.getCompanies()
      ]);
      setRoles(rolesData || []);
      setCompanies(companiesData || []);
    } catch (e) {
      console.error('Failed to load roles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('warning', 'Please enter a role title.');
      return;
    }

    try {
      setIsSubmitting(true);
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const newRole = await api.createRole({
        title: title.trim(),
        department: department.trim() || 'Engineering',
        description: description.trim() || `Technical mock interview track for ${title.trim()}.`,
        skills: skills.length > 0 ? skills : ['Distributed Systems', 'Algorithms', 'API Design'],
        companyIds: [selectedCompanyId],
        difficultyLevels: ['Fresher', 'Mid', 'Senior'],
        active: true
      });

      setRoles((prev) => [...prev, newRole]);
      addToast('success', `Created role ${newRole.title}!`);
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      setSkillsText('TypeScript, React, Node.js, System Design');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await api.deleteRole(roleToDelete.id);
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      addToast('success', `Removed ${roleToDelete.title} track.`);
      setRoleToDelete(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete role');
    }
  };

  const departments = Array.from(new Set(roles.map((r) => r.department || 'Engineering')));

  const filteredRoles = roles.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = deptFilter === 'all' || r.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Job Roles & Tracks</h2>
          <p className="text-xs text-text-secondary mt-1">
            Add or remove engineering roles, configure tech skills tested, and attach role tracks to companies.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Job Role Track
        </GlassButton>
      </div>

      {/* Filter & Search Bar */}
      <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles or skills (e.g. React, SDE, AI)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-sage-950/40 border border-sage-300/20 text-xs text-text-primary focus:outline-none focus:border-sage-400"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-xl bg-sage-950/40 border border-sage-300/20 text-xs text-text-primary focus:outline-none focus:border-sage-400"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-text-muted">
          Showing {filteredRoles.length} of {roles.length} roles
        </span>
      </GlassCard>

      {/* Roles Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-text-muted">Loading job roles...</div>
      ) : filteredRoles.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-3">
          <Briefcase className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-xs text-text-muted">No roles found matching your filter criteria.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <GlassCard key={role.id} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sage-500/15 border border-sage-400/25 flex items-center justify-center text-mint">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{role.title}</h3>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        {role.department || 'Engineering'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setRoleToDelete(role)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={`Delete ${role.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {role.description}
                </p>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-text-muted uppercase font-semibold block">Core Skills Tested:</span>
                  <div className="flex flex-wrap gap-1">
                    {role.skills?.map((skill, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-sage-500/10 text-mint border border-sage-400/15">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-sage-300/10 flex items-center justify-between text-[11px] text-text-muted">
                <span className="flex items-center gap-1 text-mint font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Track
                </span>
                <span className="font-mono text-[10px]">{role.id}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add Role Modal */}
      <GlassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Job Role Track"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 text-left">
          <GlassInput
            label="Role Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Machine Learning Engineer, Staff SRE"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-sage-950/50 border border-sage-300/20 text-xs text-text-primary focus:outline-none focus:border-sage-400"
            >
              <option value="Engineering">Engineering</option>
              <option value="Data Science & AI">Data Science & AI</option>
              <option value="Cloud Infrastructure & DevOps">Cloud Infrastructure & DevOps</option>
              <option value="Product & Systems Architecture">Product & Systems Architecture</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Target Company Scope</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-sage-950/50 border border-sage-300/20 text-xs text-text-primary focus:outline-none focus:border-sage-400"
            >
              <option value="all">Universal (Available for All Companies)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <GlassInput
            label="Required Skills (comma-separated)"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="e.g. PyTorch, Kubernetes, Kafka, Distributed Systems"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Track Overview / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. In-depth evaluation covering system design trade-offs, concurrency bugs, and production resilience..."
              className="w-full p-3 rounded-xl bg-sage-950/50 border border-sage-300/20 text-xs text-text-primary focus:outline-none focus:border-sage-400"
            />
          </div>

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
              Save Job Role
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <GlassModal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        title="Confirm Role Track Deletion"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <p>
              Are you sure you want to remove the <strong>{roleToDelete?.title}</strong> track? Candidates will no longer be able to select this role for new mock sessions.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setRoleToDelete(null)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="danger"
              size="sm"
              onClick={handleDeleteRole}
            >
              Yes, Remove Role Track
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
