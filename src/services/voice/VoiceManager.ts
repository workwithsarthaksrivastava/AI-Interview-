import {
  VoiceProvider,
  VoiceProviderType,
  VoiceSessionConfig,
  VoiceProviderEvents,
  DeepgramCreditStatus
} from '../../types';
import { DeepgramAgentProvider } from './DeepgramAgentProvider';
import { DeepgramCascadedProvider } from './DeepgramCascadedProvider';
import { WebSpeechProvider } from './WebSpeechProvider';

export class VoiceManager {
  private activeProvider: VoiceProvider | null = null;
  private currentProviderType: VoiceProviderType = 'deepgram-agent';
  private sessionStartTime: number = 0;
  private interviewId: string = '';

  constructor(preferredProvider: VoiceProviderType = 'deepgram-agent') {
    this.currentProviderType = preferredProvider;
  }

  get currentProviderName(): VoiceProviderType {
    return this.activeProvider?.name || this.currentProviderType;
  }

  async start(
    config: VoiceSessionConfig,
    events: VoiceProviderEvents,
    interviewId = 'session'
  ): Promise<VoiceProviderType> {
    this.sessionStartTime = Date.now();
    this.interviewId = interviewId;

    // Check server key configuration & credit status before starting
    try {
      const creditRes = await fetch('/api/deepgram/credit');
      const creditJson = await creditRes.json();
      if (creditJson.success) {
        if (!creditJson.hasKey || creditJson.activeProvider === 'web-speech') {
          this.currentProviderType = 'web-speech';
        } else if (creditJson.activeProvider) {
          this.currentProviderType = creditJson.activeProvider;
        }
      }
    } catch {
      this.currentProviderType = 'web-speech';
    }

    const wrappedEvents: VoiceProviderEvents = {
      ...events,
      onProviderFallback: async (from, to, reason) => {
        console.warn(`Voice fallback triggered: ${from} -> ${to} (${reason})`);
        events.onProviderFallback?.(from, to, reason);

        // Stop current provider and failover to next in priority
        if (this.activeProvider) {
          try {
            await this.activeProvider.stop();
          } catch (e) {
            console.warn('Error stopping failing provider:', e);
          }
        }

        this.currentProviderType = to;
        this.activeProvider = this.createProvider(to);
        try {
          await this.activeProvider.start(config, wrappedEvents);
        } catch (err) {
          console.error(`Failed to failover to ${to}:`, err);
        }
      }
    };

    this.activeProvider = this.createProvider(this.currentProviderType);

    try {
      await this.activeProvider.start(config, wrappedEvents);
      return this.activeProvider.name;
    } catch (err: any) {
      console.warn(`Failed to start ${this.currentProviderType}, falling back to WebSpeech:`, err);
      if (this.activeProvider) {
        try { await this.activeProvider.stop(); } catch {}
      }
      this.currentProviderType = 'web-speech';
      this.activeProvider = this.createProvider('web-speech');
      await this.activeProvider.start(config, wrappedEvents);
      return 'web-speech';
    }
  }

  private createProvider(type: VoiceProviderType): VoiceProvider {
    switch (type) {
      case 'deepgram-agent':
        return new DeepgramAgentProvider();
      case 'deepgram-cascaded':
        return new DeepgramCascadedProvider();
      case 'web-speech':
      default:
        return new WebSpeechProvider();
    }
  }

  async stop(): Promise<void> {
    if (this.sessionStartTime > 0) {
      const durationMin = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 60000));
      // Log usage to backend
      try {
        await fetch('/api/deepgram/log-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            minutes: durationMin,
            provider: this.activeProvider?.name || this.currentProviderType,
            interviewId: this.interviewId
          })
        });
      } catch (e) {
        console.warn('Failed to log voice usage:', e);
      }
    }

    if (this.activeProvider) {
      await this.activeProvider.stop();
      this.activeProvider = null;
    }
  }

  async sendText(text: string): Promise<void> {
    if (this.activeProvider) {
      await this.activeProvider.sendText(text);
    }
  }

  async updateSessionPrompt(update: {
    timeRemainingMinutes?: number;
    nextQuestionIndex?: number;
    customInstruction?: string;
  }): Promise<void> {
    if (this.activeProvider?.updateSessionPrompt) {
      await this.activeProvider.updateSessionPrompt(update);
    }
  }

  interrupt(): void {
    if (this.activeProvider) {
      this.activeProvider.interrupt();
    }
  }

  setMicMuted(muted: boolean): void {
    if (this.activeProvider?.setMicMuted) {
      this.activeProvider.setMicMuted(muted);
    }
  }

  // Voice & Language compatibility checker
  static checkLanguageCompatibility(
    language: string,
    voice: string
  ): { isCompatible: boolean; warning?: string } {
    const isHindiOrHinglish = language.toLowerCase().includes('hindi');
    const isAuraEnglishOnly = voice.includes('aura-') && voice.endsWith('-en');

    if (isHindiOrHinglish && isAuraEnglishOnly) {
      return {
        isCompatible: false,
        warning: `The selected voice "${voice}" is trained strictly for English. For ${language} interviews, English phonemes will be synthesized. You may switch to Web Speech or English for optimal pronunciation.`
      };
    }

    return { isCompatible: true };
  }
}
