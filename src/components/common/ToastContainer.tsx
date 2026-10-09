import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-status-error shrink-0" />,
    info: <Info className="w-4 h-4 text-status-info shrink-0" />
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl glass-2 border border-sage-300/30 shadow-xl animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2.5 text-xs text-text-primary font-medium">
            {icons[toast.type]}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setTimeout(() => removeToast(toast.id), 0)}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
