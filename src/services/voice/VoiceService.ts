import { VoiceManager } from './VoiceManager';
import {
  VoiceProviderType,
  VoiceSessionConfig,
  VoiceProviderEvents
} from '../../types';

class VoiceServiceWrapper {
  private manager: VoiceManager | null = null;
  private currentType: VoiceProviderType = 'deepgram-agent';

  getProviderName(): VoiceProviderType {
    return this.manager?.currentProviderName || this.currentType;
  }

  async startSession(
    config: VoiceSessionConfig,
    events: VoiceProviderEvents,
    interviewId?: string
  ): Promise<VoiceProviderType> {
    this.currentType = config.provider || 'deepgram-agent';
    this.manager = new VoiceManager(this.currentType);
    return await this.manager.start(config, events, interviewId);
  }

  async start(
    config: VoiceSessionConfig,
    events: VoiceProviderEvents,
    interviewId?: string
  ): Promise<VoiceProviderType> {
    return this.startSession(config, events, interviewId);
  }

  async stopSession(): Promise<void> {
    if (this.manager) {
      await this.manager.stop();
      this.manager = null;
    }
  }

  async stop(): Promise<void> {
    return this.stopSession();
  }

  async sendText(text: string): Promise<void> {
    if (this.manager) {
      await this.manager.sendText(text);
    }
  }

  async updatePrompt(update: {
    timeRemainingMinutes?: number;
    nextQuestionIndex?: number;
    customInstruction?: string;
  }): Promise<void> {
    if (this.manager) {
      await this.manager.updateSessionPrompt(update);
    }
  }

  interrupt(): void {
    if (this.manager) {
      this.manager.interrupt();
    }
  }
}

export const voiceService = new VoiceServiceWrapper();
