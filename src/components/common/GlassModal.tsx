import React from 'react';

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
