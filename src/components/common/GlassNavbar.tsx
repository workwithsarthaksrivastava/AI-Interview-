import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  Shield,
  User,
  LogIn,
  LogOut,
  FileText,
  Home,
  Layers,
  ChevronRight
} from 'lucide-react';
import { isUserAdmin } from '../../utils/authGuards';

export const GlassNavbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    switchUserRole,
    firebaseUser,
    isFirebaseAuthLoading,
    logoutAction,
    isDark,
    toggleTheme,
    reduceTransparency,
    toggleReduceTransparency
  } = useAppStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleNavClick = (view: typeof currentView) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-4 right-4 z-50 select-none">
      {/* Hamburger Menu Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-lg backdrop-blur-md ${
          isMenuOpen
            ? 'bg-sage-500/30 text-mint border-sage-300/80 dark:border-mint/60 shadow-[0_4px_14px_rgba(5,150,105,0.25),inset_0_1px_0_rgba(255,255,255,0.45)]'
            : 'bg-sage-50/50 dark:bg-sage-950/50 border-sage-300/80 dark:border-sage-500/50 text-text-primary hover:bg-sage-500/15 shadow-[0_4px_14px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
        }`}
        title={isMenuOpen ? 'Close Menu' : 'Open Menu'}
        aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Hamburger Dropdown Drawer */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-3 w-80 sm:w-88 max-w-[calc(100vw-2rem)] rounded-2xl glass-3 border border-sage-300/30 p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3.5"
        >
          {/* User Profile Card */}
          {firebaseUser ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sage-500/10 border border-sage-400/20">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'User'}
                  className="w-10 h-10 rounded-full object-cover border border-sage-400/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sage-500/20 flex items-center justify-center text-sage-300">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-text-primary truncate">
                    {firebaseUser.displayName || 'User'}
                  </span>
                  {isUserAdmin(currentUser.email) && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-sage-600/30 text-mint border border-sage-400/30">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted truncate">{firebaseUser.email}</p>
              </div>
              <button
                onClick={() => {
                  logoutAction();
                  setIsMenuOpen(false);
                }}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-sage-500/10 border border-sage-400/20">
              <div>
                <p className="text-sm font-semibold text-text-primary">Guest Session</p>
                <p className="text-xs text-text-muted">Sign in to save reports and history</p>
              </div>
              <button
                onClick={() => handleNavClick('login')}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-b from-sage-600 to-sage-700 text-white border border-sage-300/80 dark:border-mint/50 shadow-[0_2px_8px_rgba(40,55,35,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            </div>
          )}

          {/* Navigation links */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-text-muted">
              Navigation
            </p>

            <button
              onClick={() => handleNavClick('landing')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentView === 'landing'
                  ? 'bg-sage-500/20 text-mint font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-sage-500/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-sage-400" />
                <span>Home & Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>

            <button
              onClick={() => handleNavClick('wizard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentView === 'wizard' || currentView === 'lobby'
                  ? 'bg-sage-500/20 text-mint font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-sage-500/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sage-400" />
                <span>Start Mock Interview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>

            <button
              onClick={() => handleNavClick('candidate-dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentView === 'candidate-dashboard'
                  ? 'bg-sage-500/20 text-mint font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-sage-500/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-sage-400" />
                <span>My Past Reports</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>

            {isUserAdmin(currentUser.email) && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  currentView === 'admin'
                    ? 'bg-sage-500/20 text-mint font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-sage-500/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-sage-400" />
                  <span>Admin Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            )}
          </div>

          {/* Role switcher for admin inside menu */}
          {isUserAdmin(currentUser.email) && (
            <div className="pt-2 border-t border-sage-300/15 space-y-1.5">
              <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-text-muted">
                Workspace Role Mode
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-sage-950/40 rounded-xl border border-sage-300/20">
                <button
                  onClick={() => {
                    switchUserRole('candidate');
                  }}
                  className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all cursor-pointer ${
                    currentUser.role === 'candidate'
                      ? 'bg-sage-600 text-white border border-sage-300/80 shadow-[0_2px_8px_rgba(40,55,35,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] font-semibold'
                      : 'text-text-muted hover:text-text-primary border border-transparent hover:border-sage-300/30'
                  }`}
                >
                  Candidate View
                </button>
                <button
                  onClick={() => {
                    switchUserRole('admin');
                    handleNavClick('admin');
                  }}
                  className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all cursor-pointer ${
                    currentUser.role === 'admin'
                      ? 'bg-sage-600 text-white border border-sage-300/80 shadow-[0_2px_8px_rgba(40,55,35,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] font-semibold'
                      : 'text-text-muted hover:text-text-primary border border-transparent hover:border-sage-300/30'
                  }`}
                >
                  Admin Console
                </button>
              </div>
            </div>
          )}

          {/* Preferences & Accessibility */}
          <div className="pt-2 border-t border-sage-300/15 space-y-2">
            <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-text-muted">
              Preferences & Accessibility
            </p>

            {/* Theme Toggle row */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-sage-500/10 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-sage-600" />}
                <span>Appearance</span>
              </div>
              <span className="text-[11px] font-semibold text-mint px-2 py-0.5 rounded bg-sage-500/15">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>

            {/* Reduced Transparency Toggle row */}
            <button
              onClick={toggleReduceTransparency}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-sage-500/10 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-sage-400" />
                <div className="text-left">
                  <span>Reduced Transparency</span>
                  <p className="text-[10px] text-text-muted font-normal">High-contrast solid glass</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  reduceTransparency
                    ? 'bg-mint/20 text-mint border border-mint/30'
                    : 'bg-sage-500/15 text-text-muted'
                }`}
              >
                {reduceTransparency ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
