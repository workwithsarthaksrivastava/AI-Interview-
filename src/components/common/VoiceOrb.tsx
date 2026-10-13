import React from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: OrbState;
  audioLevel?: number; // 0 to 100
  size?: number; // in pixels
  className?: string;
  subtext?: string;
  showPropagatingRings?: boolean;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state = 'idle',
  audioLevel = 0,
  size = 220,
  className = '',
  subtext,
  showPropagatingRings = true
}) => {
  // Pure dynamic audio reactivity without state update loops
  const pulse =
    state === 'speaking' || state === 'listening'
      ? 1 + (Math.max(0, Math.min(100, audioLevel)) / 100) * 0.18
      : 1;

  const stateLabels: Record<OrbState, string> = {
    idle: 'Interviewer Ready',
    listening: 'Listening to you...',
    thinking: 'Analyzing context...',
    speaking: 'Interviewer Speaking'
  };

  // High-gloss radial sphere gradients with top-left specular illumination & crystal translucency
  const sphereGradients: Record<OrbState, string> = {
    speaking:
      'radial-gradient(circle at 32% 20%, rgba(255, 255, 255, 0.96) 0%, rgba(232, 251, 240, 0.88) 12%, rgba(110, 231, 183, 0.72) 26%, rgba(16, 185, 129, 0.55) 48%, rgba(5, 150, 105, 0.45) 70%, rgba(6, 78, 59, 0.7) 88%, rgba(2, 44, 34, 0.82) 100%)',
    listening:
      'radial-gradient(circle at 32% 20%, rgba(255, 255, 255, 0.96) 0%, rgba(236, 253, 245, 0.88) 12%, rgba(110, 231, 183, 0.72) 26%, rgba(16, 185, 129, 0.55) 48%, rgba(4, 120, 87, 0.45) 70%, rgba(6, 78, 59, 0.7) 88%, rgba(2, 32, 19, 0.82) 100%)',
    thinking:
      'radial-gradient(circle at 32% 20%, rgba(255, 255, 255, 0.96) 0%, rgba(254, 249, 195, 0.88) 12%, rgba(253, 224, 71, 0.72) 26%, rgba(234, 179, 8, 0.55) 48%, rgba(180, 83, 9, 0.45) 70%, rgba(120, 53, 15, 0.7) 88%, rgba(41, 18, 2, 0.82) 100%)',
    idle:
      'radial-gradient(circle at 32% 20%, rgba(255, 255, 255, 0.94) 0%, rgba(240, 246, 239, 0.82) 12%, rgba(184, 214, 178, 0.68) 26%, rgba(107, 149, 98, 0.52) 50%, rgba(62, 100, 53, 0.45) 72%, rgba(30, 55, 25, 0.68) 88%, rgba(14, 27, 11, 0.78) 100%)'
  };

  return (
    <div className={`flex flex-col items-center justify-center relative select-none ${className}`}>
      {/* 1. Deep Ambient Radial Atmosphere Glow */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          width: size * 1.85,
          height: size * 1.85,
          background:
            state === 'speaking'
              ? 'radial-gradient(circle, rgba(110, 231, 183, 0.55) 0%, rgba(52, 211, 153, 0.28) 45%, transparent 70%)'
              : state === 'listening'
              ? 'radial-gradient(circle, rgba(167, 243, 208, 0.6) 0%, rgba(74, 222, 128, 0.28) 45%, transparent 70%)'
              : state === 'thinking'
              ? 'radial-gradient(circle, rgba(253, 224, 71, 0.55) 0%, rgba(202, 138, 4, 0.25) 45%, transparent 70%)'
              : 'radial-gradient(circle, rgba(156, 175, 136, 0.35) 0%, transparent 65%)',
          transform: `scale(${pulse})`
        }}
      />

      {/* 2. Sound Waves Propagating Outward into the Surrounding Space */}
      {showPropagatingRings && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
          {/* Wave Ring 1 */}
          <div
            className="absolute rounded-full border border-emerald-400/45 dark:border-mint/55 animate-soundwave-ring-1"
            style={{ width: size, height: size }}
          />
          {/* Wave Ring 2 (Phased) */}
          <div
            className="absolute rounded-full border border-emerald-400/40 dark:border-mint/45 animate-soundwave-ring-2"
            style={{ width: size, height: size }}
          />
          {/* Wave Ring 3 (Phased) */}
          <div
            className="absolute rounded-full border border-emerald-500/30 dark:border-mint/35 animate-soundwave-ring-3"
            style={{ width: size, height: size }}
          />
          {/* Wide Harmonic Presence Aura Ring */}
          <div
            className="absolute rounded-full border border-emerald-400/25 dark:border-mint/25 animate-soundwave-ring-wide-1"
            style={{ width: size * 1.2, height: size * 1.2 }}
          />
        </div>
      )}

      {/* 3. Shinier Voice Orb Body (Polished 3D Crystal / Glass Sphere with Specular High-Refraction) */}
      <div
        className="relative rounded-full transition-transform duration-150 flex items-center justify-center overflow-hidden backdrop-blur-md"
        style={{
          width: size,
          height: size,
          transform: `scale(${pulse})`,
          background: sphereGradients[state],
          border: '2px solid rgba(255, 255, 255, 0.85)',
          boxShadow: `
            inset 0 4px 16px rgba(255, 255, 255, 0.98),
            inset 0 -10px 25px rgba(0, 0, 0, 0.55),
            inset 0 0 45px rgba(255, 255, 255, 0.45),
            inset 0 0 18px rgba(110, 231, 183, 0.55),
            0 24px 60px -10px rgba(5, 38, 20, 0.65),
            0 0 60px rgba(110, 231, 183, 0.6),
            0 0 100px rgba(52, 211, 153, 0.3)
          `
        }}
      >
        {/* Layer A: High-Refraction Curved Specular Crescent Highlight (Top Dome) */}
        <div
          className="absolute top-1 inset-x-3 h-[48%] rounded-full bg-gradient-to-b from-white/98 via-white/50 to-transparent blur-[0.4px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Layer B: Direct Light Source Reflection Hotspot (Glass Point Refraction & Flare) */}
        <div
          className="absolute top-[12%] left-[22%] w-[28%] h-[20%] rounded-full bg-white blur-[1.2px] transform -rotate-[24deg] pointer-events-none shadow-[0_0_24px_rgba(255,255,255,1),0_0_12px_rgba(110,231,183,0.8)]"
          aria-hidden="true"
        />

        {/* Layer C: Pinpoint Crystal Diamond Sparkle Node */}
        <div
          className="absolute top-[16%] left-[28%] w-2 h-2 rounded-full bg-white shadow-[0_0_12px_4px_rgba(255,255,255,1)] pointer-events-none animate-pulse"
          aria-hidden="true"
        />

        {/* Layer D: Secondary Caustic Bounce Light (Bottom-Right Rim Glow) */}
        <div
          className="absolute -bottom-2 -right-2 w-[72%] h-[56%] rounded-full bg-gradient-to-t from-mint/70 via-mint/30 to-transparent blur-[5px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Layer E: Dynamic Diagonal Gloss Sheen Sweep (Shimmering Light Reflection Beam) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div
            className="w-20 h-[260%] -top-[80%] absolute bg-gradient-to-r from-transparent via-white/70 to-transparent animate-orb-sheen pointer-events-none"
            aria-hidden="true"
          />
        </div>



        {/* Layer G: Dynamic Center Voice Particle & Equalizer Bars */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 px-4">
          {state === 'speaking' ? (
            <div className="flex items-center gap-1.5">
              {[38, 75, 100, 80, 42].map((baseHeight, idx) => {
                const calculatedHeight = Math.max(10, (baseHeight * Math.max(30, audioLevel || 65)) / 100);
                return (
                  <div
                    key={idx}
                    className="w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] transition-all duration-75"
                    style={{ height: `${calculatedHeight}px` }}
                  />
                );
              })}
            </div>
          ) : state === 'listening' ? (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)] transition-opacity"
                  style={{
                    opacity: 0.5 + (audioLevel / 100) * 0.5
                  }}
                />
              ))}
            </div>
          ) : state === 'thinking' ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] animate-pulse delay-100" />
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] animate-pulse delay-200" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse" />
          )}
        </div>
      </div>

      {/* 4. Quiet Status Indicator Text */}
      <div className="mt-5 text-center relative z-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-text-primary">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'speaking'
                ? 'bg-mint shadow-[0_0_8px_#34D399]'
                : state === 'listening'
                ? 'bg-mint shadow-[0_0_8px_#34D399]'
                : state === 'thinking'
                ? 'bg-gold shadow-[0_0_8px_#FDE047]'
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

