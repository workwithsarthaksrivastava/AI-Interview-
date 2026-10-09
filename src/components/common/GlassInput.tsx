import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-xl bg-sage-900/30 border border-sage-300/20 px-3.5 py-2.5 text-sm text-text-primary
            placeholder:text-text-muted/60 transition-all duration-150
            focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-400/30
            disabled:opacity-50 disabled:bg-sage-950/20
            ${leftIcon ? 'pl-10' : ''}
            ${error ? 'border-status-error/80 focus:ring-status-error/30' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-status-error">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal Card */}
      <div
        className={`relative z-10 w-full ${maxWidth} rounded-3xl glass-2 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left`}
        role="dialog"
      >
        {title && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-sage-300/15">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-sage-500/20 transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
