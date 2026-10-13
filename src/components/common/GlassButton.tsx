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
      'bg-gradient-to-r from-sage-500 to-sage-600 dark:from-sage-500 dark:to-sage-600 text-white shadow-lg shadow-sage-900/40 hover:from-sage-400 hover:to-sage-500 hover:shadow-sage-700/50 active:scale-[0.97] border border-sage-400/30',
    secondary:
      'bg-sage-400/10 dark:bg-sage-400/10 hover:bg-sage-400/20 dark:hover:bg-sage-400/20 text-text-primary border border-sage-400/25 active:scale-[0.97]',
    danger:
      'bg-gradient-to-r from-status-error/80 to-status-error text-white hover:brightness-110 active:scale-[0.97] border border-red-400/30 shadow-md',
    ghost:
      'bg-transparent hover:bg-sage-500/15 dark:hover:bg-sage-500/15 text-text-secondary hover:text-text-primary active:scale-[0.97]',
    mint:
      'bg-mint/20 dark:bg-mint/20 hover:bg-mint/30 dark:hover:bg-mint/30 text-sage-800 dark:text-mint-light border border-mint/30 active:scale-[0.97]'
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
