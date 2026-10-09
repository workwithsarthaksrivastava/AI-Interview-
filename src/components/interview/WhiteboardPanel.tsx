import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PenTool, Eraser, RotateCcw, X, Layers } from 'lucide-react';

interface WhiteboardPanelProps {
  onClose: () => void;
}

export const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({ onClose }) => {
  const { whiteboardNotes, setWhiteboardNotes } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#BFE3C6');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = tool === 'eraser' ? '#141C13' : color;
    ctx.lineWidth = tool === 'eraser' ? 18 : 2.5;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] glass-3 border-l border-sage-300/25 p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 text-left">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-sage-300/15">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-mint" />
            <h3 className="font-bold text-sm text-text-primary">System Design Whiteboard</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded-lg text-xs ${tool === 'pen' ? 'bg-sage-500/30 text-mint' : 'text-text-muted hover:text-text-primary'}`}
              title="Pen tool"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded-lg text-xs ${tool === 'eraser' ? 'bg-sage-500/30 text-mint' : 'text-text-muted hover:text-text-primary'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-sage-500/15"
              title="Clear canvas"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-sage-500/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="rounded-2xl overflow-hidden border border-sage-300/20 bg-sage-950/80 mb-3 shadow-inner">
          <canvas
            ref={canvasRef}
            width={520}
            height={260}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full cursor-crosshair"
          />
        </div>

        {/* Text Notes Section */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Architecture Notes & Trade-Offs (Read by AI)
          </label>
          <textarea
            value={whiteboardNotes}
            onChange={(e) => setWhiteboardNotes(e.target.value)}
            rows={5}
            placeholder="- Load Balancer: Round Robin / Least Connections&#10;- Database: Sharded Postgres with Read Replicas&#10;- Caching: Redis Cluster with Write-Through"
            className="w-full p-3 rounded-xl bg-sage-950/50 border border-sage-300/20 text-xs font-mono text-text-primary focus:outline-none focus:border-sage-400"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-sage-300/15 text-[11px] text-text-muted flex justify-between items-center">
        <span>Use for block diagrams, database schemas, and API design.</span>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-sage-500/20 hover:bg-sage-500/30 text-text-primary text-xs font-medium"
        >
          Keep in Background
        </button>
      </div>
    </div>
  );
};
