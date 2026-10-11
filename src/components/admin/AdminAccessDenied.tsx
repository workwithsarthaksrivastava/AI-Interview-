import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { ADMIN_EMAIL } from '../../utils/authGuards';

export const AdminAccessDenied: React.FC = () => {
  const { currentUser, firebaseUser, loginWithGoogleAction, setCurrentView } = useAppStore();

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <GlassCard className="p-8 sm:p-10 border-red-500/30 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Admin Access Restricted
          </h2>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            The Admin Console is strictly reserved for authorized administrator <strong>{ADMIN_EMAIL}</strong>. Non-admin accounts and candidates cannot view or manage platform settings.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-sage-950/40 border border-sage-300/15 text-xs text-text-secondary text-left space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Active Session</div>
          <div><strong>User:</strong> {currentUser.name || 'Candidate'}</div>
          <div><strong>Email:</strong> {currentUser.email || 'guest'}</div>
          <div><strong>Role:</strong> <span className="text-sage-400 uppercase font-mono text-[10px]">{currentUser.role}</span></div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!firebaseUser && (
            <GlassButton
              variant="primary"
              size="md"
              onClick={loginWithGoogleAction}
              icon={<LogIn className="w-4 h-4" />}
            >
              Sign In with Google
            </GlassButton>
          )}
          <GlassButton
            variant="secondary"
            size="md"
            onClick={() => setCurrentView('landing')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Home
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
