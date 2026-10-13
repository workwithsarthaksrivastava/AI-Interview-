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
        relative rounded-[22px] transition-all duration-200 overflow-hidden
        ${elevation}
        ${interactive ? 'hover:-translate-y-1 hover:border-sage-400/30 hover:shadow-xl cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Top-left refraction highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60"
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
