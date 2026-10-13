import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';

interface HarmonicSoundWaveProps {
  audioLevel?: number; // 0 to 100
  height?: number; // in pixels
  className?: string;
}

interface WaveRibbon {
  color: (alpha: number, isDark: boolean) => string;
  glowColor: (isDark: boolean) => string;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  offsetY: number;
  strandCount: number;
  strandSpread: number;
}

export const HarmonicSoundWave: React.FC<HarmonicSoundWaveProps> = ({
  audioLevel = 65,
  height = 260,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const { isDark } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let canvasHeight = height;
    let dpr = 1;

    const updateDimensions = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || window.innerWidth;
      canvasHeight = height;

      canvas.width = width * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${canvasHeight}px`;
      ctx.scale(dpr, dpr);
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    // Multi-harmonic braided sound wave strands (matching the glowing fiber wave design)
    const ribbons: WaveRibbon[] = [
      // 1. Golden Amber Core (Primary voice resonance, central harmonic)
      {
        color: (a, dark) =>
          dark
            ? `rgba(255, 185, 45, ${a * 0.95})`
            : `rgba(215, 130, 20, ${a * 0.85})`,
        glowColor: (dark) => (dark ? 'rgba(255, 160, 30, 0.65)' : 'rgba(215, 130, 20, 0.35)'),
        amplitude: 36,
        frequency: 2.1,
        speed: 1.1,
        phase: 0,
        offsetY: 0,
        strandCount: 9,
        strandSpread: 2.2
      },
      // 2. Luminous Fiery Orange / Warm Glow layer
      {
        color: (a, dark) =>
          dark
            ? `rgba(255, 105, 50, ${a * 0.85})`
            : `rgba(195, 70, 30, ${a * 0.75})`,
        glowColor: (dark) => (dark ? 'rgba(255, 90, 40, 0.55)' : 'rgba(195, 70, 30, 0.3)'),
        amplitude: 42,
        frequency: 2.4,
        speed: 1.35,
        phase: 1.2,
        offsetY: 4,
        strandCount: 7,
        strandSpread: 2.5
      },
      // 3. Rose / Magenta Harmonic Stream (mid frequencies)
      {
        color: (a, dark) =>
          dark
            ? `rgba(240, 60, 130, ${a * 0.8})`
            : `rgba(175, 40, 95, ${a * 0.75})`,
        glowColor: (dark) => (dark ? 'rgba(240, 50, 130, 0.55)' : 'rgba(175, 40, 95, 0.25)'),
        amplitude: 48,
        frequency: 1.85,
        speed: -0.95,
        phase: 2.4,
        offsetY: -3,
        strandCount: 8,
        strandSpread: 2.8
      },
      // 4. Cyan / Electric Teal Waveform (upper harmonics)
      {
        color: (a, dark) =>
          dark
            ? `rgba(56, 189, 248, ${a * 0.85})`
            : `rgba(14, 130, 185, ${a * 0.75})`,
        glowColor: (dark) => (dark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(14, 130, 185, 0.25)'),
        amplitude: 52,
        frequency: 2.7,
        speed: 0.85,
        phase: 3.8,
        offsetY: -6,
        strandCount: 9,
        strandSpread: 2.4
      },
      // 5. Emerald / Mint Luminous Aura Wave (brand matching frequency)
      {
        color: (a, dark) =>
          dark
            ? `rgba(74, 222, 128, ${a * 0.75})`
            : `rgba(22, 125, 60, ${a * 0.7})`,
        glowColor: (dark) => (dark ? 'rgba(74, 222, 128, 0.45)' : 'rgba(22, 125, 60, 0.2)'),
        amplitude: 38,
        frequency: 3.2,
        speed: -1.2,
        phase: 4.9,
        offsetY: 6,
        strandCount: 6,
        strandSpread: 2.0
      },
      // 6. Deep Indigo / Electric Violet undertone
      {
        color: (a, dark) =>
          dark
            ? `rgba(139, 92, 246, ${a * 0.65})`
            : `rgba(100, 60, 180, ${a * 0.6})`,
        glowColor: (dark) => (dark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(100, 60, 180, 0.15)'),
        amplitude: 45,
        frequency: 1.5,
        speed: 0.7,
        phase: 5.5,
        offsetY: 2,
        strandCount: 6,
        strandSpread: 2.6
      }
    ];

    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001; // elapsed in seconds
      ctx.clearRect(0, 0, width, canvasHeight);

      const centerY = canvasHeight / 2;
      const reactivity = 0.55 + (Math.max(10, Math.min(100, audioLevel)) / 100) * 0.7;

      // In dark mode use screen/lighter for radiant optical bloom
      ctx.globalCompositeOperation = isDark ? 'screen' : 'source-over';

      // Step along X resolution
      const step = Math.max(3, Math.floor(width / 320));

      ribbons.forEach((ribbon) => {
        const baseAmp = ribbon.amplitude * reactivity;
        const speedTime = elapsed * ribbon.speed;

        for (let s = 0; s < ribbon.strandCount; s++) {
          const strandOffset = (s - (ribbon.strandCount - 1) / 2) * ribbon.strandSpread;
          const alphaFactor = 1 - Math.abs(s - (ribbon.strandCount - 1) / 2) / (ribbon.strandCount * 0.8);
          const strandAlpha = Math.max(0.18, alphaFactor);

          ctx.beginPath();
          ctx.strokeStyle = ribbon.color(strandAlpha, isDark);
          ctx.lineWidth = s === Math.floor(ribbon.strandCount / 2) ? 1.8 : 1.1;

          if (isDark && s === Math.floor(ribbon.strandCount / 2)) {
            ctx.shadowColor = ribbon.glowColor(isDark);
            ctx.shadowBlur = 10;
          } else {
            ctx.shadowBlur = 0;
          }

          let first = true;

          // Compute continuous wave across the full width [0, width]
          for (let x = 0; x <= width; x += step) {
            const normX = x / width; // 0.0 to 1.0

            // Broad window envelope: active across the entire screen, smooth rise around the center
            const envelope =
              0.4 + 0.6 * Math.sin(Math.PI * normX) * (1 - 0.25 * Math.abs(normX - 0.5));

            // Multi-harmonic sine superposition
            const primary =
              Math.sin(normX * Math.PI * 2 * ribbon.frequency + speedTime + ribbon.phase);
            const secondary =
              0.35 * Math.sin(normX * Math.PI * 4 * ribbon.frequency - speedTime * 1.4 + ribbon.phase * 0.5);
            const tertiary =
              0.18 * Math.cos(normX * Math.PI * 6.5 + speedTime * 0.8 + strandOffset * 0.1);

            const waveY =
              centerY +
              ribbon.offsetY +
              strandOffset +
              envelope * baseAmp * (primary + secondary + tertiary);

            if (first) {
              ctx.moveTo(x, waveY);
              first = false;
            } else {
              ctx.lineTo(x, waveY);
            }
          }

          ctx.stroke();
        }
      });

      // Reset composite operation & shadow
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [audioLevel, height, isDark]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-visible pointer-events-none ${className}`}
      style={{
        height: `${height}px`,
        maskImage: 'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)'
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
