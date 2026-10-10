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
  private isMicMuted = false;
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private silenceCheckTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastAudioDetectedTime = Date.now();
  private hasReportedSilence = false;

  async start(config: VoiceSessionConfig, events: VoiceProviderEvents): Promise<void> {
    this.config = config;
    this.events = events;
    this.isRunning = true;
    this.isMicMuted = false;
    this.reconnectAttempts = 0;
    this.lastAudioDetectedTime = Date.now();
    this.hasReportedSilence = false;

    try {
      // 1. Microphone capture with strict audio processing constraints:
      // echoCancellation, noiseSuppression, autoGainControl, mono
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      // 2. AudioContext created/resumed on user click
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // 3. Setup WebSocket connection to server Deepgram proxy
      await this.connectWebSocket();

      // 4. Setup AudioWorklet for PCM capture (fallback to ScriptProcessor)
      await this.setupAudioCapture();

      // 5. Start KeepAlive and 5-second silence monitoring
      this.startKeepAlive();
      this.startSilenceMonitor();
    } catch (err: any) {
      console.warn('[Deepgram Voice Provider] Initialization error:', err);
      events.onError(err.message || 'Microphone or WebSocket initialization error');
      throw err;
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.isRunning || !this.config) return;

    try {
      if (this.ws) {
        try {
          this.ws.close();
        } catch {}
        this.ws = null;
      }

      // Fetch short-lived token before every connection attempt (including auto-reconnects)
      const tokenRes = await fetch('/api/deepgram/token');
      if (!tokenRes.ok) {
        throw new Error(`Failed to obtain Deepgram temporary token: ${tokenRes.status}`);
      }
      const tokenData = await tokenRes.json();
      const token = tokenData.token;
      if (!token) {
        throw new Error(tokenData.error || 'No token returned from Deepgram auth grant');
      }

      const lang = this.config.sttLanguage === 'hi' ? 'hi' : 'en';

      // Open socket directly to wss://api.deepgram.com/v1/listen using subprotocol array ["bearer", token]
      const wsUrl = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&interim_results=true&smart_format=true&endpointing=800&utterance_end_ms=1500&vad_events=true&language=${lang}`;

      this.ws = new WebSocket(wsUrl, ['bearer', token]);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.events?.onStateChange('listening');
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'SpeechStarted') {
              this.events?.onSpeechStarted?.();
              return;
            }

            if (data.type === 'UtteranceEnd') {
              this.events?.onUtteranceEnd?.();
              return;
            }

            const alternative = data.channel?.alternatives?.[0];
            if (!alternative) return;

            const transcriptText = alternative.transcript?.trim();
            if (!transcriptText) return;

            this.lastAudioDetectedTime = Date.now();
            this.hasReportedSilence = false;

            this.events?.onTranscript({
              speaker: 'candidate',
              text: transcriptText,
              isFinal: Boolean(data.is_final),
              isSpeechFinal: Boolean(data.speech_final),
              confidence: alternative.confidence,
              words: alternative.words
            });
          } catch (e) {
            console.warn('[Deepgram WS] JSON parse error:', e);
          }
        }
      };

      this.ws.onerror = (e) => {
        console.warn('[Deepgram WS] WebSocket error:', e);
      };

      this.ws.onclose = (event) => {
        if (!this.isRunning) return;
        console.warn(`[Deepgram WS] Connection closed (code: ${event.code}). Auto-reconnecting...`);
        this.scheduleReconnect();
      };
    } catch (e: any) {
      console.warn('[Deepgram WS] Connection error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.isRunning) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.events?.onError('Lost connection to live voice server. Please check your network and retry.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(6000, 1000 * Math.pow(1.5, this.reconnectAttempts));
    console.log(`[Deepgram WS] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  private startKeepAlive() {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    // Send KeepAlive every 5s as required
    this.keepAliveTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 5000);
  }

  private startSilenceMonitor() {
    if (this.silenceCheckTimer) clearInterval(this.silenceCheckTimer);
    this.silenceCheckTimer = setInterval(() => {
      if (!this.isRunning || this.isMicMuted) return;

      const elapsedWithoutSpeech = Date.now() - this.lastAudioDetectedTime;
      // If no audio level detected for 5s while listening:
      if (elapsedWithoutSpeech >= 5000 && !this.hasReportedSilence) {
        this.hasReportedSilence = true;
        this.events?.onSilenceWarning?.("I can't hear you, check your mic");
      }
    }, 1000);
  }

  private async setupAudioCapture(): Promise<void> {
    if (!this.audioCtx || !this.mediaStream) return;

    const source = this.audioCtx.createMediaStreamSource(this.mediaStream);

    // Try AudioWorklet first
    let audioWorkletSuccess = false;
    if (typeof AudioWorkletNode !== 'undefined' && this.audioCtx.audioWorklet) {
      try {
        const workletCode = `
          class DeepgramPCMProcessor extends AudioWorkletProcessor {
            process(inputs) {
              const input = inputs[0];
              if (input && input[0]) {
                this.port.postMessage(input[0]);
              }
              return true;
            }
          }
          registerProcessor('deepgram-pcm-processor', DeepgramPCMProcessor);
        `;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await this.audioCtx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);

        this.workletNode = new AudioWorkletNode(this.audioCtx, 'deepgram-pcm-processor');
        this.workletNode.port.onmessage = (e) => {
          this.processAudioBuffer(e.data);
        };
        
        // CRITICAL: Web Audio API is a pull-based graph.
        // Connecting through a zero-gain node to audioCtx.destination guarantees
        // the browser audio render loop calls process() on every quantum without mic audio echoing back.
        const silentGain = this.audioCtx.createGain();
        silentGain.gain.value = 0;
        source.connect(this.workletNode);
        this.workletNode.connect(silentGain);
        silentGain.connect(this.audioCtx.destination);
        audioWorkletSuccess = true;
      } catch (e) {
        console.warn('[AudioWorklet] Registration failed, falling back to ScriptProcessor:', e);
      }
    }

    if (!audioWorkletSuccess) {
      // Robust ScriptProcessor fallback with zero-gain sink
      this.scriptProcessorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.scriptProcessorNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.processAudioBuffer(inputData);
      };
      const silentGain = this.audioCtx.createGain();
      silentGain.gain.value = 0;
      source.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(silentGain);
      silentGain.connect(this.audioCtx.destination);
    }
  }

  private processAudioBuffer(float32Data: Float32Array): void {
    if (!this.isRunning) return;

    // 1. Calculate audio level (RMS)
    let sum = 0;
    for (let i = 0; i < float32Data.length; i++) {
      sum += float32Data[i] * float32Data[i];
    }
    const rms = Math.sqrt(sum / float32Data.length);
    const level = Math.min(100, Math.round(rms * 400));
    this.events?.onAudioLevel(level);

    if (level > 2) {
      this.lastAudioDetectedTime = Date.now();
      this.hasReportedSilence = false;
    }

    // 2. Strict Echo-Prevention Guard:
    // Do not stream mic to STT during AI_SPEAKING (or when mic is muted)
    if (this.isMicMuted) return;

    // 3. Convert Float32Array to 16-bit linear PCM at 16000 Hz
    if (!this.audioCtx) return;
    const pcm16 = this.resampleToInt16(float32Data, this.audioCtx.sampleRate, 16000);

    // 4. Send binary buffer to WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(pcm16.buffer as unknown as ArrayBuffer);
    }
  }

  private resampleToInt16(audioBuffer: Float32Array, inputRate: number, outputRate = 16000): Int16Array {
    if (inputRate === outputRate) {
      const pcm16 = new Int16Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.length; i++) {
        const s = Math.max(-1, Math.min(1, audioBuffer[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm16;
    }

    // High quality linear resampler to exactly 16000 Hz
    const ratio = inputRate / outputRate;
    const outputLength = Math.round(audioBuffer.length / ratio);
    const pcm16 = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const pos = i * ratio;
      const index = Math.floor(pos);
      const fraction = pos - index;
      const s0 = audioBuffer[index] || 0;
      const s1 = audioBuffer[index + 1] !== undefined ? audioBuffer[index + 1] : s0;
      const sample = s0 + fraction * (s1 - s0);
      const clamped = Math.max(-1, Math.min(1, sample));
      pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }

    return pcm16;
  }

  setMicMuted(muted: boolean): void {
    this.isMicMuted = muted;
    if (!muted) {
      this.lastAudioDetectedTime = Date.now();
      this.hasReportedSilence = false;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.isMicMuted = true;

    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    if (this.silenceCheckTimer) {
      clearInterval(this.silenceCheckTimer);
      this.silenceCheckTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.scriptProcessorNode) {
      this.scriptProcessorNode.disconnect();
      this.scriptProcessorNode = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        await this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }

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
    this.events?.onBargeIn?.();
  }
}
