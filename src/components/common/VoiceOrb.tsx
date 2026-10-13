import React from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: OrbState;
  audioLevel?: number; // 0 to 100
  size?: number; // in pixels
  className?: string;
  subtext?: string;
  showStatus?: boolean;
  showStatusBadge?: boolean;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state = 'idle',
  audioLevel = 0,
  size = 220,
  className = '',
  subtext,
  showStatus = true,
  showStatusBadge = true
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

      {/* Concentric ripple rings */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <div
            className="absolute rounded-full border border-mint/30 animate-ping opacity-30 pointer-events-none"
            style={{
              width: size * 1.35,
              height: size * 1.35,
              animationDuration: state === 'speaking' ? '2.4s' : '3.2s'
            }}
          />
          <div
            className="absolute rounded-full border border-sage-300/20 animate-ping opacity-20 pointer-events-none"
            style={{
              width: size * 1.7,
              height: size * 1.7,
              animationDuration: '3.6s'
            }}
          />
        </>
      )}

      {/* Rotating shimmer ring for 'thinking' */}
      {state === 'thinking' && (
        <div
          className="absolute rounded-full border border-dashed border-gold/40 animate-spin pointer-events-none"
          style={{
            width: size * 1.25,
            height: size * 1.25,
            animationDuration: '6s'
          }}
        />
      )}

      {/* Center Voice Orb Body */}
      <div
        className="relative rounded-full transition-transform duration-150 flex items-center justify-center overflow-hidden shadow-2xl"
        style={{
          width: size,
          height: size,
          transform: `scale(${pulse})`,
          background:
            state === 'speaking'
              ? 'linear-gradient(135deg, #A8BE95 0%, #7F9970 50%, #4D6145 100%)'
              : state === 'listening'
              ? 'linear-gradient(135deg, #BFE3C6 0%, #8FCCA0 50%, #647C59 100%)'
              : state === 'thinking'
              ? 'linear-gradient(135deg, #E3C98A 0%, #A8BE95 50%, #4D6145 100%)'
              : 'linear-gradient(135deg, #7F9970 0%, #4D6145 60%, #2A3626 100%)',
          border: '2px solid rgba(255, 255, 255, 0.35)',
          boxShadow: 'inset 0 4px 20px rgba(255, 255, 255, 0.4), 0 12px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Glass specular highlights */}
        <div className="absolute top-2 left-6 w-1/2 h-1/3 rounded-full bg-gradient-to-b from-white/50 to-transparent blur-[2px] pointer-events-none" />
        <div className="absolute -bottom-4 right-4 w-2/3 h-1/2 rounded-full bg-gradient-to-t from-black/40 to-transparent blur-sm pointer-events-none" />

        {/* Dynamic center waveform / core particle */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 px-4">
          {state === 'speaking' ? (
            <div className="flex items-center gap-1">
              {[40, 75, 100, 85, 45].map((height, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full bg-white/90 shadow-sm transition-all duration-100"
                  style={{
                    height: `${Math.max(12, (height * (audioLevel || 60)) / 100)}px`
                  }}
                />
              ))}
            </div>
          ) : state === 'listening' ? (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className="w-3 h-3 rounded-full bg-mint-light animate-pulse"
                  style={{ animationDelay: `${dot * 0.2}s` }}
                />
              ))}
            </div>
          ) : state === 'thinking' ? (
            <div className="w-8 h-8 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-white/70 shadow-lg shadow-white/40 animate-pulse" />
          )}
        </div>
      </div>

      {/* Status indicator text */}
      {showStatus && (showStatusBadge || subtext) && (
        <div className="mt-5 text-center">
          {showStatusBadge && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sage-900/40 border border-sage-300/20 backdrop-blur-md">
              <span
                className={`w-2 h-2 rounded-full ${
                  state === 'speaking'
                    ? 'bg-sage-300 animate-ping'
                    : state === 'listening'
                    ? 'bg-mint animate-pulse'
                    : state === 'thinking'
                    ? 'bg-gold animate-spin'
                    : 'bg-sage-400'
                }`}
              />
              <span className="text-xs font-medium tracking-wide text-text-primary">
                {stateLabels[state]}
              </span>
            </div>
          )}
          {subtext && <p className="text-xs text-text-muted mt-1.5 max-w-xs">{subtext}</p>}
        </div>
      )}
    </div>
  );
};
