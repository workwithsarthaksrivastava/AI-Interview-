import React from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: OrbState;
  audioLevel?: number; // 0 to 100
  size?: number; // in pixels
  className?: string;
  subtext?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state = 'idle',
  audioLevel = 0,
  size = 220,
  className = '',
  subtext
}) => {
  // Pure dynamic audio reactivity without state update loops
  const pulse =
    state === 'speaking' || state === 'listening'
      ? 1 + (Math.max(0, Math.min(100, audioLevel)) / 100) * 0.22
      : 1;

  const stateLabels: Record<OrbState, string> = {
    idle: 'Interviewer Ready',
    listening: 'Listening to you...',
    thinking: 'Analyzing context...',
    speaking: 'Interviewer Speaking'
  };

  return (
    <div className={`flex flex-col items-center justify-center relative select-none ${className}`}>
      {/* Outer ambient glow */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          width: size * 1.6,
          height: size * 1.6,
          background:
            state === 'speaking'
              ? 'radial-gradient(circle, rgba(156, 175, 136, 0.45) 0%, rgba(127, 153, 112, 0.2) 50%, transparent 75%)'
              : state === 'listening'
              ? 'radial-gradient(circle, rgba(191, 227, 198, 0.5) 0%, rgba(143, 204, 160, 0.2) 50%, transparent 75%)'
              : state === 'thinking'
              ? 'radial-gradient(circle, rgba(227, 201, 138, 0.4) 0%, rgba(156, 175, 136, 0.2) 50%, transparent 75%)'
              : 'radial-gradient(circle, rgba(156, 175, 136, 0.25) 0%, transparent 60%)',
          transform: `scale(${pulse})`
        }}
      />

      {/* Subtle harmonic presence rings */}
      {(state === 'listening' || state === 'speaking') && (
        <div
          className="absolute rounded-full border border-sage-400/25 transition-all duration-300 pointer-events-none"
          style={{
            width: size * (1.15 + (Math.max(0, Math.min(100, audioLevel)) / 100) * 0.15),
            height: size * (1.15 + (Math.max(0, Math.min(100, audioLevel)) / 100) * 0.15),
            opacity: 0.4
          }}
        />
      )}

      {/* Center Voice Orb Body */}
      <div
        className="relative rounded-full transition-transform duration-200 flex items-center justify-center overflow-hidden shadow-xl"
        style={{
          width: size,
          height: size,
          transform: `scale(${pulse})`,
          background:
            state === 'speaking'
              ? 'linear-gradient(145deg, #7F9970 0%, #4D6145 60%, #2A3626 100%)'
              : state === 'listening'
              ? 'linear-gradient(145deg, #8FCCA0 0%, #647C59 60%, #1F2A1C 100%)'
              : state === 'thinking'
              ? 'linear-gradient(145deg, #C4A759 0%, #7F9970 60%, #2A3626 100%)'
              : 'linear-gradient(145deg, #647C59 0%, #374632 70%, #141C13 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 16px 40px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Soft top-edge specular highlight */}
        <div className="absolute top-1 inset-x-8 h-1/3 rounded-full bg-gradient-to-b from-white/20 to-transparent blur-[1px] pointer-events-none" />

        {/* Dynamic center waveform / core particle */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 px-4">
          {state === 'speaking' ? (
            <div className="flex items-center gap-1">
              {[35, 70, 95, 75, 40].map((baseHeight, idx) => {
                const calculatedHeight = Math.max(8, (baseHeight * Math.max(30, audioLevel || 55)) / 100);
                return (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-white/95 transition-all duration-75"
                    style={{ height: `${calculatedHeight}px` }}
                  />
                );
              })}
            </div>
          ) : state === 'listening' ? (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className="w-2.5 h-2.5 rounded-full bg-mint-light/90 transition-opacity"
                  style={{
                    opacity: 0.4 + (audioLevel / 100) * 0.6
                  }}
                />
              ))}
            </div>
          ) : state === 'thinking' ? (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gold-light/90 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-gold-light/90 animate-pulse delay-100" />
              <span className="w-2 h-2 rounded-full bg-gold-light/90 animate-pulse delay-200" />
            </div>
          ) : (
            <div className="w-3 h-3 rounded-full bg-white/60" />
          )}
        </div>
      </div>

      {/* Status indicator text */}
      <div className="mt-5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-text-primary">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state === 'speaking'
                ? 'bg-mint'
                : state === 'listening'
                ? 'bg-mint'
                : state === 'thinking'
                ? 'bg-gold'
                : 'bg-sage-400'
            }`}
          />
          <span className="tracking-wide">
            {stateLabels[state]}
          </span>
        </div>
        {subtext && <p className="text-xs text-text-muted mt-0.5 max-w-xs">{subtext}</p>}
      </div>
    </div>
  );
};
