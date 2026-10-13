import {
  VoiceProvider,
  VoiceSessionConfig,
  VoiceProviderEvents
} from '../../types';

export class WebSpeechProvider implements VoiceProvider {
  readonly name = 'web-speech' as const;
  private recognition: any = null;
  private events: VoiceProviderEvents | null = null;
  private config: VoiceSessionConfig | null = null;
  private isRunning = false;
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animId: number = 0;

  private isMicMuted: boolean = false;

  setMicMuted(muted: boolean): void {
    this.isMicMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (muted) {
      this.events?.onAudioLevel(0);
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {}
      }
    } else if (!muted && this.isRunning && this.recognition) {
      try {
        this.recognition.start();
      } catch {}
    }
  }

  async start(config: VoiceSessionConfig, events: VoiceProviderEvents): Promise<void> {
    this.config = config;
    this.events = events;
    this.isRunning = true;
    this.isMicMuted = false;

    // Start Audio Level monitoring
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.isRunning) return;
        this.analyser!.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = Math.min(100, Math.round((sum / bufferLength) * 1.5));
        if (!this.isMicMuted) {
          this.events?.onAudioLevel(avg);
        } else {
          this.events?.onAudioLevel(0);
        }
        this.animId = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e: any) {
      console.warn('Microphone stream error in WebSpeechProvider:', e);
    }

    // Initialize Browser Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.events?.onError('Browser does not support SpeechRecognition. Please use text mode.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config.sttLanguage === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onresult = (event: any) => {
      if (this.isMicMuted) return;

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const trimmed = text.trim();
          if (trimmed) {
            this.interrupt();
            this.events?.onTranscript({
              speaker: 'candidate',
              text: trimmed,
              isFinal: true,
              isSpeechFinal: true
            });
          }
        } else {
          interim += text;
          this.interrupt();
          this.events?.onStateChange('listening');
          this.events?.onTranscript({
            speaker: 'candidate',
            text: interim,
            isFinal: false,
            isSpeechFinal: false
          });
        }
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        this.events?.onError(`Speech recognition notice: ${e.error}`);
      }
    };

    recognition.onend = () => {
      if (this.isRunning) {
        setTimeout(() => {
          if (this.isRunning && this.recognition) {
            try {
              this.recognition.start();
            } catch {}
          }
        }, 120);
      }
    };

    try {
      recognition.start();
      this.recognition = recognition;
      this.events?.onStateChange('listening');
    } catch (err: any) {
      this.events?.onError(err);
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.interrupt();
    this.events?.onStateChange('idle');
  }

  async sendText(text: string): Promise<void> {
    this.events?.onTranscript({
      speaker: 'candidate',
      text,
      isFinal: true,
      isSpeechFinal: true
    });
  }

  interrupt(): void {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.events?.onBargeIn?.();
    }
  }

  speakResponse(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.interrupt();
      this.events?.onStateChange('speaking');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        this.events?.onStateChange('listening');
        resolve();
      };

      utterance.onerror = () => {
        this.events?.onStateChange('listening');
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}
