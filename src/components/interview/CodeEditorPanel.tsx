import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Play, RotateCcw, Copy, Check, Code, X } from 'lucide-react';

interface CodeEditorPanelProps {
  onClose: () => void;
  onSyncWithAi: (code: string) => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({ onClose, onSyncWithAi }) => {
  const {
    codeSnippet,
    setCodeSnippet,
    codeLanguage,
    setCodeLanguage,
    addToast
  } = useAppStore();

  const [copied, setCopied] = React.useState(false);
  const [output, setOutput] = React.useState<string | null>(null);

  const languages = ['typescript', 'javascript', 'python', 'java', 'sql', 'cpp'];

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('info', 'Code copied to clipboard.');
  };

  const handleRunMock = () => {
    setOutput('Test execution started...\n✓ Test Suite 1: Basic validation passed\n✓ Test Suite 2: Edge cases verified (empty input, duplicates)\nExecution time: 14ms | Memory: 18.2 MB');
    addToast('success', 'Code verified! Synced with AI interviewer.');
    onSyncWithAi(codeSnippet);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[580px] glass-3 border-l border-sage-300/25 p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 text-left">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-sage-300/15">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-mint" />
            <h3 className="font-bold text-sm text-text-primary">Live Code Editor</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sage-500/20 text-mint border border-mint/25">
              AI Synchronized
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
              className="text-xs rounded-lg bg-sage-950/60 border border-sage-300/20 px-2 py-1 text-text-primary focus:outline-none"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-sage-500/15"
              aria-label="Close code panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Area */}
        <div className="relative rounded-2xl overflow-hidden border border-sage-300/20 bg-sage-950/70 shadow-inner">
          <div className="flex items-center justify-between px-3 py-1.5 bg-sage-900/40 border-b border-sage-300/15 text-[11px] text-text-muted font-mono">
            <span>solution.{codeLanguage === 'python' ? 'py' : codeLanguage === 'java' ? 'java' : 'ts'}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-text-primary"
            >
              {copied ? <Check className="w-3 h-3 text-mint" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <textarea
            value={codeSnippet}
            onChange={(e) => {
              setCodeSnippet(e.target.value);
              onSyncWithAi(e.target.value);
            }}
            rows={14}
            className="w-full p-4 font-mono text-xs text-text-primary bg-transparent resize-none focus:outline-none leading-relaxed"
            placeholder="// Write code here..."
            spellCheck={false}
          />
        </div>

        {/* Output Console */}
        {output && (
          <div className="mt-3 p-3 rounded-xl bg-sage-950/80 border border-sage-300/20 text-[11px] font-mono text-mint-light">
            <div className="text-[10px] uppercase text-text-muted mb-1 font-sans">Execution Output</div>
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-sage-300/15 flex items-center justify-between">
        <span className="text-[11px] text-text-muted">
          AI can see your code updates in real time.
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setCodeSnippet(`// Reset solution template\nfunction solution() {\n  // Code\n}`)
            }
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-sage-500/15 text-xs flex items-center gap-1"
            title="Reset code template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRunMock}
            className="px-4 py-2 rounded-xl bg-gradient-to-b from-sage-600 to-sage-700 dark:from-sage-500 dark:to-sage-600 hover:from-sage-500 hover:to-sage-600 text-white font-medium text-xs flex items-center gap-1.5 border border-sage-300/80 dark:border-sage-300/50 shadow-[0_4px_12px_rgba(40,55,35,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Run & Discuss with AI
          </button>
        </div>
      </div>
    </div>
  );
};
