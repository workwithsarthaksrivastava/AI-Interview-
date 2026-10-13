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
      'bg-gradient-to-b from-sage-600 to-sage-700 dark:from-sage-500 dark:to-sage-600 text-white border border-sage-300/85 dark:border-sage-300/60 shadow-[0_4px_14px_rgba(40,55,35,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] hover:from-sage-500 hover:to-sage-600 hover:border-sage-200/90 hover:shadow-sage-700/50 active:scale-[0.97] font-semibold',
    secondary:
      'bg-white dark:bg-sage-900/70 hover:bg-sage-50 dark:hover:bg-sage-800/70 text-text-primary border border-sage-300/80 dark:border-sage-400/50 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-sage-400/90 active:scale-[0.97] font-semibold',
    danger:
      'bg-gradient-to-b from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 active:scale-[0.97] border border-red-300/90 dark:border-red-400/80 shadow-[0_4px_14px_rgba(220,38,38,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] hover:border-red-200 font-semibold',
    ghost:
      'bg-transparent hover:bg-sage-500/15 text-text-primary hover:text-text-primary active:scale-[0.97] border border-sage-300/35 hover:border-sage-300/70 dark:border-sage-500/30 dark:hover:border-sage-400/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] font-semibold',
    mint:
      'bg-gradient-to-b from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 text-white hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.97] border border-emerald-300/90 dark:border-mint/80 shadow-[0_4px_14px_rgba(5,150,105,0.28),inset_0_1px_0_rgba(255,255,255,0.5)] hover:border-emerald-200 font-bold'
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
