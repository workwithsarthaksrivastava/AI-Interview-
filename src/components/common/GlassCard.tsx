import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'glass-1' | 'glass-2' | 'glass-3';
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  elevation = 'glass-1',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`
        relative rounded-2xl transition-all duration-200 overflow-hidden
        ${elevation}
        ${interactive ? 'hover:border-sage-400/40 cursor-pointer transition-colors' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};
