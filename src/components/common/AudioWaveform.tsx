import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  stream: MediaStream | null;
  isActive: boolean;
  color?: string;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  stream,
  isActive,
  color = '#BFE3C6',
  height = 48
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !stream || !isActive) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animId: number;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const render = () => {
        if (!ctx || !canvas) return;
        animId = requestAnimationFrame(render);
        analyser!.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = ((dataArray[i] / 255) * canvas.height * 0.85);

          // Sage to Mint gradient
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#7F9970');
          gradient.addColorStop(1, color);

          ctx.fillStyle = gradient;
          ctx.fillRect(
            x,
            canvas.height / 2 - barHeight / 2,
            Math.max(2, barWidth - 2),
            Math.max(4, barHeight)
          );

          x += barWidth;
        }
      };

      render();
    } catch (e) {
      console.warn('Web Audio visualization error:', e);
    }

    return () => {
      cancelAnimationFrame(animId);
      if (source) source.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [stream, isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={height}
      className="w-full rounded-xl bg-sage-950/30 border border-sage-300/15"
    />
  );
};
