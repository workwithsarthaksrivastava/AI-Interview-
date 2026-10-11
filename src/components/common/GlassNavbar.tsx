import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sparkles, Sun, Moon, Shield, User, Layers, LogIn, LogOut } from 'lucide-react';
import { isUserAdmin } from '../../utils/authGuards';

export const GlassNavbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    switchUserRole,
    firebaseUser,
    isFirebaseAuthLoading,
    loginWithGoogleAction,
    logoutAction,
    isDark,
    toggleTheme,
    reduceTransparency,
    toggleReduceTransparency
  } = useAppStore();

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 select-none">
      <nav className="max-w-7xl mx-auto rounded-2xl glass-2 border border-sage-300/20 px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg">
        {/* Brand */}
        <div
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-md shadow-sage-900/40 text-white font-bold text-lg group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-text-primary">
                Shakchhatkar
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sage-500/20 text-mint border border-sage-400/30">
                Live AI
              </span>
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block">Real-Time Voice Mock Platform</p>
          </div>
        </div>

        {/* Center Nav items */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setCurrentView('wizard')}
            className={`transition-colors hover:text-sage-300 ${
              currentView === 'wizard' || currentView === 'lobby' ? 'text-sage-400 font-semibold' : 'text-text-secondary'
            }`}
          >
            Start Mock Interview
          </button>
          <button
            onClick={() => setCurrentView('candidate-dashboard')}
            className={`transition-colors hover:text-sage-300 ${
              currentView === 'candidate-dashboard' ? 'text-sage-400 font-semibold' : 'text-text-secondary'
            }`}
          >
            My Past Reports
          </button>
          {isUserAdmin(currentUser.email) && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 transition-colors hover:text-sage-300 ${
                currentView === 'admin' ? 'text-sage-400 font-semibold' : 'text-text-secondary'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Console
            </button>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role switcher toggle: strictly visible to sarthaksrivastava1084@gmail.com */}
          {isUserAdmin(currentUser.email) && (
            <div className="flex items-center bg-sage-950/40 rounded-xl p-1 border border-sage-300/20">
              <button
                onClick={() => switchUserRole('candidate')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  currentUser.role === 'candidate'
                    ? 'bg-sage-600/70 text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Preview Candidate view"
              >
                Candidate
              </button>
              <button
                onClick={() => {
                  switchUserRole('admin');
                  setCurrentView('admin');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  currentUser.role === 'admin'
                    ? 'bg-sage-600/70 text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Admin Console"
              >
                Admin
              </button>
            </div>
          )}

          {/* Firebase Google Auth button */}
          {firebaseUser ? (
            <div className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl bg-sage-500/15 border border-sage-400/30 text-xs">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-sage-400/40"
                />
              ) : (
                <User className="w-4 h-4 text-sage-300" />
              )}
              <span className="font-medium text-text-primary hidden sm:inline max-w-[90px] truncate">
                {firebaseUser.displayName?.split(' ')[0] || firebaseUser.email?.split('@')[0]}
              </span>
              <button
                onClick={logoutAction}
                className="p-1 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors ml-0.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('login')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-500/20 hover:bg-sage-500/30 border border-sage-400/40 text-xs font-semibold text-text-primary transition-all shadow-sm cursor-pointer"
              title="Sign In"
            >
              <LogIn className="w-3.5 h-3.5 text-sage-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-sage-500/15 border border-sage-300/15 transition-colors"
            title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-sage-600" />}
          </button>

          {/* Transparency reduction toggle */}
          <button
            onClick={toggleReduceTransparency}
            className={`p-2 rounded-xl border border-sage-300/15 transition-colors text-xs ${
              reduceTransparency
                ? 'bg-sage-500/30 text-mint'
                : 'text-text-muted hover:text-text-primary hover:bg-sage-500/15'
            }`}
            title="Toggle reduced transparency for low-contrast or accessibility needs"
            aria-label="Toggle reduced transparency"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </header>
  );
};
