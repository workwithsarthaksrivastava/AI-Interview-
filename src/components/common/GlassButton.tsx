import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5 font-medium'
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-sage-600 to-sage-700 dark:from-sage-500 dark:to-sage-600 text-white shadow-lg shadow-sage-900/40 hover:from-sage-500 hover:to-sage-600 hover:shadow-sage-700/50 active:scale-[0.97] border border-sage-500/50 font-semibold',
    secondary:
      'bg-white dark:bg-sage-400/10 hover:bg-sage-50 dark:hover:bg-sage-400/20 text-text-primary border border-sage-500/40 active:scale-[0.97] font-semibold shadow-sm',
    danger:
      'bg-gradient-to-r from-status-error/80 to-status-error text-white hover:brightness-110 active:scale-[0.97] border border-red-400/30 shadow-md',
    ghost:
      'bg-transparent hover:bg-sage-500/15 dark:hover:bg-sage-500/15 text-text-primary hover:text-text-primary active:scale-[0.97] font-semibold',
    mint:
      'bg-white dark:bg-emerald-950/70 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-800/70 dark:border-emerald-500/50 active:scale-[0.97] font-bold shadow-sm'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none
        disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
