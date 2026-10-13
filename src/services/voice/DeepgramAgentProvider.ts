import {
  VoiceProvider,
  VoiceSessionConfig,
  VoiceProviderEvents
} from '../../types';

export class DeepgramAgentProvider implements VoiceProvider {
  readonly name = 'deepgram-agent' as const;
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private events: VoiceProviderEvents | null = null;
  private config: VoiceSessionConfig | null = null;
  private isRunning = false;
  private token: string | null = null;
  private audioQueue: AudioBufferSourceNode[] = [];

  async start(config: VoiceSessionConfig, events: VoiceProviderEvents): Promise<void> {
    this.config = config;
    this.events = events;
    this.isRunning = true;

    // 1. Fetch token and credentials
    try {
      const tokenRes = await fetch('/api/deepgram/token');
      const tokenData = await tokenRes.json();

      if (!tokenData.token) {
        events.onProviderFallback?.('deepgram-agent', 'deepgram-cascaded', tokenData.error || 'Deepgram credentials missing or credit low.');
        throw new Error('DEEPGRAM_FALLBACK_TRIGGERED');
      }

      this.token = tokenData.token;
    } catch (e: any) {
      if (e.message !== 'DEEPGRAM_FALLBACK_TRIGGERED') {
        events.onError('Deepgram Agent session initialization failed.');
      }
      throw e;
    }

    // 2. Setup Mic audio capture at 16kHz
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.isRunning) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = Math.min(100, Math.round((sum / bufferLength) * 1.5));
        this.events?.onAudioLevel(avg);
        requestAnimationFrame(checkVolume);
      };
      checkVolume();

      // 3. Connect to Deepgram Voice Agent WebSocket
      const wsUrl = `wss://agent.deepgram.com/agent`;
      this.ws = new WebSocket(wsUrl, ['token', this.token || '']);

      this.ws.onopen = () => {
        // Send initial SettingsConfiguration with interview plan, resume, company & role
        const systemInstruction = `You are a real-time technical and behavioral interviewer at ${config.companyName} conducting an interview with ${config.candidateName} for the ${config.roleTitle} role (${config.difficulty} difficulty, ${config.interviewType} round). Language: ${config.language}.

Interview Plan:
${config.plan?.questions?.map((q, i) => `${i + 1}. [${q.category}] ${q.question}`).join('\n') || 'Comprehensive technical & behavioral assessment.'}

Candidate Resume Summary:
${config.resumeSummary || 'Experienced software engineer.'}

Rules:
1. Warm greeting and ask one question at a time.
2. Probe vague answers and offer constructive hints if candidate is stuck.
3. Be conversational, concise (2-3 sentences max per turn).
4. Support natural barge-in interruptions and adapt immediately.`;

        const settingsConfig = {
          type: 'SettingsConfiguration',
          audio: {
            input: { encoding: 'linear16', sample_rate: 16000 },
            output: { encoding: 'linear16', sample_rate: 24000, container: 'none' }
          },
          agent: {
            listen: {
              model: 'nova-3',
              language: config.sttLanguage === 'hi' ? 'hi' : 'en'
            },
            speak: {
              model: config.voice || 'aura-asteria-en'
            },
            think: {
              provider: { type: 'open_ai', model: 'gpt-4o-mini' },
              instructions: systemInstruction
            }
          }
        };

        this.ws?.send(JSON.stringify(settingsConfig));
        this.events?.onStateChange('listening');
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'UserStartedSpeaking') {
              // Barge-in detected by Deepgram Agent!
              this.interrupt();
            } else if (msg.type === 'AgentStartedSpeaking') {
              this.events?.onStateChange('speaking');
            } else if (msg.type === 'AgentAudioDone') {
              this.events?.onStateChange('listening');
            } else if (msg.type === 'ConversationText') {
              const isAi = msg.role === 'assistant';
              this.events?.onTranscript({
                speaker: isAi ? 'ai' : 'candidate',
                text: msg.content,
                isFinal: true
              });
            }
          } catch (e) {
            console.warn('Deepgram Agent JSON parse error:', e);
          }
        } else if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
          // Received Agent Audio binary chunk -> play progressively at 24kHz
          this.playBinaryAudioChunk(event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Deepgram Agent WS error:', err);
        this.events?.onProviderFallback?.('deepgram-agent', 'deepgram-cascaded', 'Deepgram Agent API connection error (402/429 or network).');
      };

      this.ws.onclose = (event) => {
        if (event.code === 402 || event.code === 429) {
          this.events?.onProviderFallback?.('deepgram-agent', 'deepgram-cascaded', 'Deepgram credit limit reached (402/429).');
        }
      };

      // Stream mic audio to Deepgram Agent
      this.processor.onaudioprocess = (e) => {
        if (!this.isRunning || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.ws.send(pcm16.buffer);
      };
    } catch (err: any) {
      this.events?.onError(err);
      throw err;
    }
  }

  private async playBinaryAudioChunk(data: ArrayBuffer | Blob) {
    if (!this.audioCtx || this.audioCtx.state === 'closed') return;
    try {
      let arrayBuffer: ArrayBuffer;
      if (data instanceof Blob) {
        arrayBuffer = await data.arrayBuffer();
      } else {
        arrayBuffer = data;
      }

      // Convert 24kHz Linear16 PCM to Float32 AudioBuffer
      const int16 = new Int16Array(arrayBuffer);
      const audioBuffer = this.audioCtx.createBuffer(1, int16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16.length; i++) {
        channelData[i] = int16[i] / 32768;
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);
      source.start();

      this.audioQueue.push(source);
      source.onended = () => {
        this.audioQueue = this.audioQueue.filter((s) => s !== source);
      };
    } catch (err) {
      console.warn('Audio chunk playback error:', err);
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.interrupt();

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
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.events?.onStateChange('idle');
  }

  async sendText(text: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'InjectAgentMessage', message: text }));
    }
    this.events?.onTranscript({
      speaker: 'candidate',
      text,
      isFinal: true
    });
  }

  async updateSessionPrompt(update: {
    timeRemainingMinutes?: number;
    nextQuestionIndex?: number;
    customInstruction?: string;
  }): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const updateMsg = {
        type: 'UpdateInstructions',
        instructions: `Note for interviewer: ${update.timeRemainingMinutes !== undefined ? `Time remaining: ${update.timeRemainingMinutes} minutes.` : ''} ${update.nextQuestionIndex !== undefined ? `Advance to Question #${update.nextQuestionIndex + 1}.` : ''} ${update.customInstruction || ''}`
      };
      this.ws.send(JSON.stringify(updateMsg));
    }
  }

  interrupt(): void {
    // Clear playing audio queue immediately (Barge-in)
    this.audioQueue.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    });
    this.audioQueue = [];
    this.events?.onBargeIn?.();
    this.events?.onStateChange('listening');
  }

  setMicMuted(muted: boolean): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (muted) {
      this.events?.onAudioLevel(0);
    }
  }
}
