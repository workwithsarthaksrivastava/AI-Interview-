import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AdminDashboard } from './AdminDashboard';
import { AdminCompanies } from './AdminCompanies';
import { AdminRoles } from './AdminRoles';
import { AdminQuestions } from './AdminQuestions';
import { AdminAISettings } from './AdminAISettings';
import { AdminDocs } from './AdminDocs';
import { AdminAccessDenied } from './AdminAccessDenied';
import { isUserAdmin } from '../../utils/authGuards';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  HelpCircle,
  Sliders,
  FileCode,
  ArrowLeft
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { adminTab, setAdminTab, setCurrentView, currentUser } = useAppStore();

  if (!isUserAdmin(currentUser.email)) {
    return <AdminAccessDenied />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview & KPIs', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
    { id: 'roles', label: 'Job Roles', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'questions', label: 'Question Bank', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'ai-settings', label: 'AI Settings & Sandbox', icon: <Sliders className="w-4 h-4" /> },
    { id: 'docs', label: 'Architecture & Docs', icon: <FileCode className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left">
      {/* Top Bar for Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-sage-300/15 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            className="p-2 rounded-xl bg-sage-950/40 hover:bg-sage-500/20 text-text-muted hover:text-text-primary border border-sage-300/15 transition-colors"
            title="Return to Main App"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Shakchhatkar Admin Console
            </h1>
            <p className="text-xs text-text-muted">Master Control · Company & Role Governance · Real-Time Analytics</p>
          </div>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-2 border border-sage-300/20 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                adminTab === item.id
                  ? 'bg-sage-500 text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary hover:bg-sage-500/10'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div>
        {adminTab === 'dashboard' && <AdminDashboard />}
        {adminTab === 'companies' && <AdminCompanies />}
        {adminTab === 'roles' && <AdminRoles />}
        {adminTab === 'questions' && <AdminQuestions />}
        {adminTab === 'ai-settings' && <AdminAISettings />}
        {adminTab === 'docs' && <AdminDocs />}
      </div>
    </div>
  );
};
