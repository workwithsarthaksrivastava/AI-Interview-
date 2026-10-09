import {
  VoiceProvider,
  VoiceSessionConfig,
  VoiceProviderEvents
} from '../../types';

export class DeepgramCascadedProvider implements VoiceProvider {
  readonly name = 'deepgram-cascaded' as const;
  private ws: WebSocket | null = null;
  private events: VoiceProviderEvents | null = null;
  private config: VoiceSessionConfig | null = null;
  private isRunning = false;
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  async start(config: VoiceSessionConfig, events: VoiceProviderEvents): Promise<void> {
    this.config = config;
    this.events = events;
    this.isRunning = true;

    // Fetch scoped token
    let tokenRes: any = null;
    try {
      const res = await fetch('/api/deepgram/token', { method: 'POST' });
      tokenRes = await res.json();
    } catch (e: any) {
      console.warn('Cascaded Deepgram token fetch error:', e);
      events.onProviderFallback?.('deepgram-cascaded', 'web-speech', 'Failed to get Deepgram token');
      return;
    }

    if (!tokenRes?.hasKey || !tokenRes?.token) {
      events.onProviderFallback?.(
        'deepgram-cascaded',
        'web-speech',
        tokenRes?.message || 'Deepgram API key not available'
      );
      return;
    }

    // Connect to Deepgram Nova-3 Live Transcription
    const lang = config.sttLanguage === 'hi' ? 'hi' : 'en';
    const novaUrl = `wss://api.deepgram.com/v1/listen?model=nova-3&language=${lang}&smart_format=true&filler_words=true&interim_results=true`;

    try {
      this.ws = new WebSocket(novaUrl, ['token', tokenRes.token]);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.events?.onStateChange('listening');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const alternative = data.channel?.alternatives?.[0];
          if (!alternative) return;

          const transcriptText = alternative.transcript;
          if (!transcriptText) return;

          if (data.is_final) {
            // Barge in on candidate speech
            this.interrupt();
            this.events?.onTranscript({
              speaker: 'candidate',
              text: transcriptText,
              isFinal: true,
              confidence: alternative.confidence,
              words: alternative.words
            });

            // Forward text to backend LLM proxy + Aura TTS
            this.handleCandidateUtterance(transcriptText);
          } else {
            this.interrupt();
            this.events?.onTranscript({
              speaker: 'candidate',
              text: transcriptText,
              isFinal: false
            });
          }
        } catch (e) {
          console.warn('Nova-3 message parse error:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.warn('Deepgram Nova-3 WebSocket error:', e);
        this.events?.onProviderFallback?.('deepgram-cascaded', 'web-speech', 'Nova-3 connection failed');
      };

      this.ws.onclose = (e) => {
        if (e.code === 4002 || e.code === 402 || e.code === 429) {
          this.events?.onProviderFallback?.('deepgram-cascaded', 'web-speech', 'Credit exhausted');
        }
      };

      // Microphone capture
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRunning || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
        const avg = Math.min(100, Math.round((sum / inputData.length) * 400));
        this.events?.onAudioLevel(avg);

        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        this.ws.send(pcm16.buffer);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);
    } catch (err: any) {
      events.onProviderFallback?.('deepgram-cascaded', 'web-speech', err.message);
    }
  }

  private async handleCandidateUtterance(text: string) {
    if (!this.config) return;

    this.events?.onStateChange('thinking');

    try {
      const res = await fetch('/api/interview/cascaded-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: this.config.candidateName,
          companyName: this.config.companyName,
          roleTitle: this.config.roleTitle,
          difficulty: this.config.difficulty,
          interviewType: this.config.interviewType,
          language: this.config.language,
          candidateMessage: text,
          plan: this.config.plan
        })
      });

      const json = await res.json();
      if (json.aiResponseText) {
        this.events?.onTranscript({
          speaker: 'ai',
          text: json.aiResponseText,
          isFinal: true
        });

        // Playback Deepgram Aura TTS audio
        if (json.audioBase64) {
          this.playAudioBase64(json.audioBase64);
        } else {
          // Fallback to browser synthesis
          this.playBrowserTts(json.aiResponseText);
        }
      }
    } catch (e: any) {
      console.warn('Cascaded turn request error:', e);
      this.events?.onStateChange('listening');
    }
  }

  private playAudioBase64(base64: string) {
    this.interrupt();
    this.events?.onStateChange('speaking');

    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    this.currentAudioElement = audio;

    audio.onended = () => {
      this.currentAudioElement = null;
      this.events?.onStateChange('listening');
    };

    audio.onerror = () => {
      this.currentAudioElement = null;
      this.events?.onStateChange('listening');
    };

    audio.play().catch(() => {
      this.events?.onStateChange('listening');
    });
  }

  private playBrowserTts(text: string) {
    this.interrupt();
    this.events?.onStateChange('speaking');
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => this.events?.onStateChange('listening');
    u.onerror = () => this.events?.onStateChange('listening');
    window.speechSynthesis.speak(u);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.interrupt();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }

    this.events?.onStateChange('idle');
  }

  async sendText(text: string): Promise<void> {
    this.events?.onTranscript({
      speaker: 'candidate',
      text,
      isFinal: true
    });
    this.handleCandidateUtterance(text);
  }

  interrupt(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
      this.events?.onBargeIn?.();
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.events?.onBargeIn?.();
    }
  }
}
