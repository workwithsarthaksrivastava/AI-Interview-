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
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-2 min-h-[34px]',
    md: 'px-4.5 py-2 text-sm rounded-xl gap-2 min-h-[40px]',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5 font-medium min-h-[44px]'
  };

  const variantClasses = {
    primary:
      'bg-sage-600 hover:bg-sage-500 text-white shadow-sm hover:shadow border border-sage-500/40 active:translate-y-[1px]',
    secondary:
      'bg-sage-400/10 hover:bg-sage-400/20 text-text-primary border border-sage-300/20 active:translate-y-[1px]',
    danger:
      'bg-status-error/90 hover:bg-status-error text-white border border-red-500/40 shadow-sm active:translate-y-[1px]',
    ghost:
      'bg-transparent hover:bg-sage-500/15 text-text-secondary hover:text-text-primary active:translate-y-[1px]',
    mint:
      'bg-mint/15 hover:bg-mint/25 text-mint-light border border-mint/30 active:translate-y-[1px]'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sage-950
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
