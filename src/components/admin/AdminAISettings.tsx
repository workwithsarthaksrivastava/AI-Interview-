import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AdminSettings, DeepgramCreditStatus, VoiceProviderType, DeepgramAuraVoice } from '../../types';
import { DEFAULT_ADMIN_SETTINGS } from '../../data/seedData';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { useAppStore } from '../../store/useAppStore';
import {
  Sliders,
  Volume2,
  Cpu,
  Save,
  RotateCcw,
  Sparkles,
  Play,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Globe2,
  CreditCard,
  DollarSign
} from 'lucide-react';

export const AdminAISettings: React.FC = () => {
  const { addToast } = useAppStore();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [creditStatus, setCreditStatus] = useState<DeepgramCreditStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sandbox state
  const [sandboxPrompt, setSandboxPrompt] = useState('How would you scale a distributed cache?');
  const [sandboxResponse, setSandboxResponse] = useState('');
  const [isTestingSandbox, setIsTestingSandbox] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.getDeepgramCredit().then((res) => setCreditStatus(res.credit)).catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      addToast('success', `Voice settings saved! Updated to v${updated.promptVersion}.`);
    } catch {
      addToast('error', 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSandbox = async () => {
    try {
      setIsTestingSandbox(true);
      setSandboxResponse('Testing turn with free-tier Gemini Flash text LLM & Deepgram Aura TTS...');
      const res = await api.sendSpeechTurn({
        candidateName: 'Test Candidate',
        companyName: 'Google',
        roleTitle: 'SDE II',
        difficulty: 'Senior',
        interviewType: 'Technical',
        language: 'English',
        plan: null,
        transcriptHistory: [],
        candidateMessage: sandboxPrompt,
        currentQuestionIndex: 0
      });
      setSandboxResponse(res.aiResponseText);
    } catch (e: any) {
      setSandboxResponse('Sandbox test encountered an issue.');
    } finally {
      setIsTestingSandbox(false);
    }
  };

  // Simulate usage / credit drain for testing credit protection
  const handleSimulateCreditDrain = async () => {
    const res = await api.logDeepgramUsage({
      minutes: 180,
      provider: settings.voiceProvider,
      interviewId: 'simulated-batch'
    });
    if (res.credit) {
      setCreditStatus(res.credit);
      addToast('warning', `Simulated usage logged. Remaining: $${res.credit.remainingDollars} (${res.credit.percentUsed}% used)`);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">AI & Voice Architecture Settings</h2>
          <p className="text-xs text-text-secondary mt-1">
            Deepgram-only voice configuration, credit protection, Aura TTS voices, and free-tier text LLM prompts.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="sm"
          onClick={handleSave}
          loading={isSaving}
          icon={<Save className="w-3.5 h-3.5" />}
        >
          Save Voice Config (v{settings.promptVersion})
        </GlassButton>
      </div>

      {/* Deepgram Credit Remaining & Protection Widget */}
      {creditStatus && (
        <GlassCard className="p-6 bg-gradient-to-r from-sage-950/70 via-sage-900/40 to-sage-950/70 border border-sage-400/40 shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-4 border-b border-sage-300/15">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-mint" />
                <h3 className="font-bold text-sm text-text-primary">
                  Deepgram Credit Protection & Usage
                </h3>
                {creditStatus.alertAt80 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-error/20 text-status-error border border-status-error/30 animate-pulse">
                    Alert: ≥80% Credit Used
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-mint/20 text-mint border border-mint/30">
                    Status Healthy
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">{creditStatus.statusMessage}</p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">Credit Remaining</span>
                <div className="text-2xl font-extrabold text-gold">
                  ${creditStatus.remainingDollars.toFixed(2)}
                  <span className="text-xs text-text-muted font-normal"> / ${creditStatus.totalGrantedDollars}</span>
                </div>
              </div>

              <div className="h-10 w-px bg-sage-300/20" />

              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">Est. Interviews Left</span>
                <div className="text-2xl font-extrabold text-mint">
                  ~{creditStatus.estimatedInterviewsLeft}
                </div>
              </div>
            </div>
          </div>

          {/* Credit Progress Bar with 80% Alert Line */}
          <div className="pt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-text-muted">
              <span>{creditStatus.totalMinutesLogged} total minutes logged across mock interviews</span>
              <span>{creditStatus.percentUsed}% utilized</span>
            </div>
            <div className="relative w-full h-2.5 rounded-full bg-sage-950/60 overflow-hidden border border-sage-300/20">
              <div
                className={`h-full transition-all ${
                  creditStatus.percentUsed >= 80 ? 'bg-status-error' : 'bg-gradient-to-r from-sage-500 to-mint'
                }`}
                style={{ width: `${Math.min(100, creditStatus.percentUsed)}%` }}
              />
              {/* 80% alert threshold mark */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-status-error"
                style={{ left: '80%' }}
                title="80% alert threshold"
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-text-muted pt-1">
              <span>Auto-switches to Cascaded or WebSpeech if credit &lt; $25 to protect quota.</span>
              <button
                type="button"
                onClick={handleSimulateCreditDrain}
                className="text-[11px] text-gold hover:underline font-mono"
              >
                [Simulate +3h usage for testing]
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompts & Sandbox */}
        <div className="lg:col-span-2 space-y-5">
          {/* System Prompt: Live Interviewer */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-mint" />
                Interviewer System Instruction (Injected into Agent & Cascaded LLM)
              </label>
            </div>
            <textarea
              rows={6}
              value={settings.systemPrompts.interviewIntro}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  systemPrompts: { ...settings.systemPrompts, interviewIntro: e.target.value }
                })
              }
              className="w-full text-xs font-mono rounded-xl bg-sage-950/60 border border-sage-300/20 p-3 text-text-primary focus:outline-none focus:border-sage-400"
            />
          </GlassCard>

          {/* System Prompt: 12-Section Evaluator */}
          <GlassCard className="p-5 space-y-3">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              12-Section Evaluation Prompt (Free-Tier Gemini 3.8 Flash)
            </label>
            <textarea
              rows={5}
              value={settings.systemPrompts.evaluatorSystemPrompt}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  systemPrompts: { ...settings.systemPrompts, evaluatorSystemPrompt: e.target.value }
                })
              }
              className="w-full text-xs font-mono rounded-xl bg-sage-950/60 border border-sage-300/20 p-3 text-text-primary focus:outline-none focus:border-sage-400"
            />
          </GlassCard>

          {/* Prompt Testing Sandbox */}
          <GlassCard className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-text-primary">Prompt Testing Sandbox</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={sandboxPrompt}
                onChange={(e) => setSandboxPrompt(e.target.value)}
                placeholder="Test candidate input..."
                className="flex-1 text-xs rounded-xl bg-sage-950/40 border border-sage-300/20 px-3 py-2 text-text-primary focus:outline-none"
              />
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={handleTestSandbox}
                loading={isTestingSandbox}
                icon={<Play className="w-3.5 h-3.5" />}
              >
                Simulate Turn
              </GlassButton>
            </div>
            {sandboxResponse && (
              <div className="p-3 rounded-xl bg-sage-950/70 border border-sage-300/20 text-xs text-mint-light">
                <span className="text-[10px] uppercase text-text-muted block mb-1">Model Output:</span>
                <p className="leading-relaxed">{sandboxResponse}</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Col: Deepgram Voice Providers & Settings */}
        <div className="space-y-5">
          {/* Active Voice Provider Priority */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-mint" />
              Voice Provider Architecture
            </h3>

            <div>
              <label className="text-[11px] text-text-secondary block mb-1.5 font-medium">
                Active Provider (Priority Order)
              </label>
              <select
                value={settings.voiceProvider}
                onChange={(e) =>
                  setSettings({ ...settings, voiceProvider: e.target.value as VoiceProviderType })
                }
                className="w-full text-xs rounded-xl bg-sage-950/50 border border-sage-300/20 p-2.5 text-text-primary font-medium"
              >
                <option value="deepgram-agent">1. Deepgram Voice Agent (Standard API over WebSocket)</option>
                <option value="deepgram-cascaded">2. Deepgram Cascaded (Nova-3 STT + Free LLM + Aura TTS)</option>
                <option value="web-speech">3. Web Speech (Browser Native Fallback - Free)</option>
              </select>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Admin can toggle between Agent and Cascaded mode to stretch credit.
              </p>
            </div>

            {/* Deepgram Aura TTS Voice Selection */}
            <div>
              <label className="text-[11px] text-text-secondary block mb-1.5 font-medium">
                Deepgram Aura TTS Voice
              </label>
              <select
                value={settings.deepgramVoice}
                onChange={(e) =>
                  setSettings({ ...settings, deepgramVoice: e.target.value as DeepgramAuraVoice })
                }
                className="w-full text-xs rounded-xl bg-sage-950/50 border border-sage-300/20 p-2 text-text-primary"
              >
                <option value="aura-asteria-en">Aura Asteria (Warm, conversational female)</option>
                <option value="aura-luna-en">Aura Luna (Calm, articulate female)</option>
                <option value="aura-stella-en">Aura Stella (Expressive female)</option>
                <option value="aura-athena-en">Aura Athena (Confident professional female)</option>
                <option value="aura-hera-en">Aura Hera (Mature, steady female)</option>
                <option value="aura-orion-en">Aura Orion (Deep, authoritative male)</option>
                <option value="aura-arcas-en">Aura Arcas (Crisp, technical male)</option>
                <option value="aura-perseus-en">Aura Perseus (Energetic male)</option>
                <option value="aura-zeus-en">Aura Zeus (Executive bar-raiser male)</option>
              </select>
            </div>

            {/* STT Language */}
            <div>
              <label className="text-[11px] text-text-secondary block mb-1.5 font-medium">
                Deepgram Nova-3 STT Language
              </label>
              <select
                value={settings.deepgramSttLanguage}
                onChange={(e) =>
                  setSettings({ ...settings, deepgramSttLanguage: e.target.value as any })
                }
                className="w-full text-xs rounded-xl bg-sage-950/50 border border-sage-300/20 p-2 text-text-primary"
              >
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="multi">Multilingual / Code-switched (multi)</option>
              </select>
            </div>

            {/* Auto-switch toggle */}
            <div className="pt-2 border-t border-sage-300/15 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-text-primary block">Credit Auto-Protection</span>
                <span className="text-[10px] text-text-muted">Auto-downgrade on 402/429 or low credit</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSwitchOnLowCredit}
                onChange={(e) =>
                  setSettings({ ...settings, autoSwitchOnLowCredit: e.target.checked })
                }
                className="w-4 h-4 rounded text-sage-500 border-sage-300/30"
              />
            </div>
          </GlassCard>

          {/* Model Temperature & Strictness */}
          <GlassCard className="p-5 space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-text-secondary mb-1">
                <span>Model Temperature</span>
                <span className="font-mono text-gold font-bold">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full accent-sage-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-text-secondary block mb-1">Strictness Bar</label>
              <select
                value={settings.strictnessLevel}
                onChange={(e) => setSettings({ ...settings, strictnessLevel: e.target.value as any })}
                className="w-full text-xs rounded-xl bg-sage-950/50 border border-sage-300/20 p-2 text-text-primary"
              >
                <option value="Friendly & Lenient">Friendly & Lenient</option>
                <option value="Standard Industry Bar">Standard Industry Bar</option>
                <option value="FAANG Strict">FAANG Strict</option>
              </select>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
