import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { voiceService } from '../../services/voice/VoiceService';
import { VoiceOrb, OrbState } from '../common/VoiceOrb';
import { CodeEditorPanel } from './CodeEditorPanel';
import { WhiteboardPanel } from './WhiteboardPanel';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  Mic,
  MicOff,
  PhoneOff,
  HelpCircle,
  RotateCcw,
  MessageSquare,
  Code,
  Layers,
  Send,
  Clock,
  Sparkles,
  AlertCircle,
  Video,
  VideoOff,
  Volume2
} from 'lucide-react';

export const LiveInterviewRoom: React.FC = () => {
  const {
    currentUser,
    selectedCompany,
    selectedRole,
    interviewType,
    difficulty,
    durationMinutes,
    language,
    voiceProvider,
    deepgramVoice,
    sttLanguage,
    parsedResume,
    interviewPlan,
    transcript,
    addTranscriptTurn,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    codeSnippet,
    whiteboardNotes,
    isMuted,
    setIsMuted,
    isAiSpeaking,
    setIsAiSpeaking,
    isCandidateSpeaking,
    setIsCandidateSpeaking,
    isAiThinking,
    setIsAiThinking,
    elapsedSeconds,
    setElapsedSeconds,
    fillerWordsTotal,
    incrementFillerWords,
    currentPaceWpm,
    setCurrentPaceWpm,
    activeRoomTool,
    setActiveRoomTool,
    cameraPreviewEnabled,
    setCurrentView,
    setCurrentReport,
    addToast
  } = useAppStore();

  // Active Voice Engine Name
  const [activeVoiceProviderName, setActiveVoiceProviderName] = useState<string>(voiceProvider);

  // Orb State
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioInputLevel, setAudioInputLevel] = useState<number>(0);

  // Audio Playback ref
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Text mode state
  const [isTextMode, setIsTextMode] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [showCaptions, setShowCaptions] = useState<boolean>(true);

  // Silence timer (for 20s auto-hint)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [silenceSeconds, setSilenceSeconds] = useState<number>(0);

  // Interim candidate text
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  // Video element ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // End Interview confirmation modal
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  // Initialize Speech Turn from AI
  const executeAiTurn = async (
    candidateMessage: string,
    options: { requestedHint?: boolean; requestedRepeat?: boolean } = {}
  ) => {
    try {
      setIsAiThinking(true);
      setOrbState('thinking');

      // Stop any existing AI speech audio playback
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const res = await api.sendSpeechTurn({
        candidateName: currentUser.name,
        companyName: selectedCompany?.name || 'Google',
        roleTitle: selectedRole?.title || 'SDE II',
        difficulty,
        interviewType,
        language,
        plan: interviewPlan,
        transcriptHistory: transcript,
        candidateMessage,
        candidateCode: codeSnippet,
        currentQuestionIndex,
        userRequestedHint: options.requestedHint || false,
        userRequestedRepeat: options.requestedRepeat || false,
        silentSeconds: silenceSeconds
      });

      setIsAiThinking(false);

      // Record AI turn in transcript
      const timestamp = formatTimer(elapsedSeconds);
      addTranscriptTurn({
        id: `turn-ai-${Date.now()}`,
        speaker: 'ai',
        text: res.aiResponseText,
        timestamp,
        secondsFromStart: elapsedSeconds,
        questionIndex: currentQuestionIndex
      });

      // Update filler words and pacing
      if (res.fillerWordsFound && res.fillerWordsFound.length > 0) {
        incrementFillerWords(res.fillerWordsFound.length);
      }
      if (res.wordCount > 5) {
        const estWpm = Math.min(210, Math.max(90, Math.round((res.wordCount / 12) * 60)));
        setCurrentPaceWpm(estWpm);
      }

      // Check if we should advance to the next plan question
      if (res.advanceQuestion && currentQuestionIndex < (interviewPlan?.questions?.length || 3)) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }

      // Play AI Audio Output (supports barge-in interruption)
      if (res.audioBase64) {
        playAiVoiceAudio(res.audioBase64);
      } else {
        // Fallback Web Speech Synthesis
        playSpeechSynthesis(res.aiResponseText);
      }
    } catch (err: any) {
      setIsAiThinking(false);
      setOrbState('idle');
      addToast('error', 'Error in AI turn.');
    }
  };

  // Play AI TTS Audio with barge-in support
  const playAiVoiceAudio = (audioBase64: string) => {
    try {
      setIsAiSpeaking(true);
      setOrbState('speaking');

      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsAiSpeaking(false);
        setOrbState('listening');
        resetSilenceTimer();
      };

      audio.onerror = () => {
        setIsAiSpeaking(false);
        setOrbState('listening');
        resetSilenceTimer();
      };

      audio.play().catch(() => {
        setIsAiSpeaking(false);
        setOrbState('listening');
      });
    } catch (e) {
      setIsAiSpeaking(false);
      setOrbState('listening');
    }
  };

  // Fallback speech synthesis
  const playSpeechSynthesis = (text: string) => {
    setIsAiSpeaking(true);
    setOrbState('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      setIsAiSpeaking(false);
      setOrbState('listening');
      resetSilenceTimer();
    };
    window.speechSynthesis.speak(utterance);
  };

  // Barge-In Interruption Handler
  const handleBargeInInterruption = () => {
    if (isAiSpeaking && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsAiSpeaking(false);
      window.speechSynthesis.cancel();
      addToast('info', 'AI paused — listening to you.');
    }
  };

  // Silence Timer logic (offers hint after 20 seconds of silence)
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    setSilenceSeconds(0);
    silenceTimerRef.current = setInterval(() => {
      setSilenceSeconds((prev) => {
        if (prev >= 20 && !isAiSpeaking && !isAiThinking) {
          // Trigger automatic polite nudge / hint
          executeAiTurn('', { requestedHint: true });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Initialize Voice Engine (Deepgram Agent / Cascaded / WebSpeech)
  useEffect(() => {
    let isMounted = true;

    voiceService
      .start(
        {
          candidateName: currentUser.name,
          companyName: selectedCompany?.name || 'Google',
          roleTitle: selectedRole?.title || 'SDE II',
          difficulty,
          interviewType,
          language,
          sttLanguage,
          plan: interviewPlan,
          resumeSummary: parsedResume?.summary,
          voice: deepgramVoice,
          provider: voiceProvider,
          durationMinutes
        },
        {
          onTranscript: (event) => {
            if (!isMounted) return;
            const timestamp = formatTimer(elapsedSeconds);
            if (event.isFinal) {
              addTranscriptTurn({
                id: `turn-${event.speaker}-${Date.now()}`,
                speaker: event.speaker,
                text: event.text,
                timestamp,
                secondsFromStart: elapsedSeconds,
                questionIndex: currentQuestionIndex
              });
              setInterimTranscript('');
              if (event.speaker === 'candidate') {
                setIsCandidateSpeaking(false);
                // Detect filler words
                const fillers = (event.text.match(/\b(um|uh|like|basically|actually|you know|sort of|matlab|so yeah)\b/gi) || []);
                if (fillers.length > 0) incrementFillerWords(fillers.length);
                // Trigger AI turn if cascaded or fallback
                if (activeVoiceProviderName !== 'deepgram-agent') {
                  executeAiTurn(event.text);
                }
              }
            } else {
              setInterimTranscript(event.text);
              if (event.speaker === 'candidate') {
                setIsCandidateSpeaking(true);
              }
            }
          },
          onError: (err) => {
            console.warn('[LiveRoom] Voice Provider notice:', err);
          },
          onStateChange: (state) => {
            if (!isMounted) return;
            setOrbState(state);
            setIsAiSpeaking(state === 'speaking');
            setIsCandidateSpeaking(state === 'listening' && interimTranscript.length > 0);
            setIsAiThinking(state === 'thinking');
          },
          onAudioLevel: (lvl) => {
            if (!isMounted) return;
            setAudioInputLevel(lvl);
          },
          onBargeIn: () => {
            if (!isMounted) return;
            setIsAiSpeaking(false);
            if (currentAudioRef.current) {
              currentAudioRef.current.pause();
              currentAudioRef.current = null;
            }
            window.speechSynthesis.cancel();
          },
          onProviderFallback: (from, to, reason) => {
            if (!isMounted) return;
            setActiveVoiceProviderName(to);
            addToast('warning', `Voice engine switched to ${to}: ${reason}`);
          }
        }
      )
      .then((started) => {
        if (isMounted) {
          setActiveVoiceProviderName(started);
        }
      })
      .catch((err) => {
        console.warn('Voice start fallback error:', err);
      });

    // Initial greeting turn from AI
    const greetingText =
      interviewPlan?.warmupIntro ||
      `Hello ${currentUser.name}, welcome to your ${selectedCompany?.name || 'tech'} mock interview for the ${selectedRole?.title || 'Engineer'} position. It is great to have you here today. Could you briefly introduce yourself and share what you've been working on recently?`;

    const timer = setTimeout(() => {
      addTranscriptTurn({
        id: `turn-ai-intro`,
        speaker: 'ai',
        text: greetingText,
        timestamp: '00:00',
        secondsFromStart: 0,
        questionIndex: 0
      });

      // Play through Deepgram Aura TTS or WebSpeech
      api.synthesizeDeepgramTts(greetingText, deepgramVoice).then((ttsRes) => {
        if (ttsRes.audioBase64) {
          playAiVoiceAudio(ttsRes.audioBase64);
        } else {
          playSpeechSynthesis(greetingText);
        }
      });
    }, 900);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      voiceService.stop();
    };
  }, []);

  // Live timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit Text Input response
  const handleSendText = () => {
    if (!textInput.trim()) return;
    handleBargeInInterruption();
    const text = textInput.trim();
    setTextInput('');

    const timestamp = formatTimer(elapsedSeconds);
    addTranscriptTurn({
      id: `turn-cand-${Date.now()}`,
      speaker: 'candidate',
      text,
      timestamp,
      secondsFromStart: elapsedSeconds,
      questionIndex: currentQuestionIndex
    });

    executeAiTurn(text);
  };

  // Request Hint from AI
  const handleRequestHint = () => {
    handleBargeInInterruption();
    addToast('info', 'Requesting guidance hint from AI interviewer...');
    executeAiTurn('Could you give me a slight hint or point me in the right direction?', {
      requestedHint: true
    });
  };

  // Request Repeat Question
  const handleRepeatQuestion = () => {
    handleBargeInInterruption();
    addToast('info', 'Asking AI to repeat the question...');
    executeAiTurn('Could you repeat the question please?', { requestedRepeat: true });
  };

  // End Interview and Evaluate
  const handleEndInterview = async () => {
    setShowEndModal(false);
    if (currentAudioRef.current) currentAudioRef.current.pause();
    window.speechSynthesis.cancel();

    // Transition to evaluation loading view
    setCurrentView('evaluating');

    try {
      const report = await api.evaluateInterview({
        interviewId: `intv-${Date.now()}`,
        candidateName: currentUser.name,
        companyName: selectedCompany?.name || 'Google',
        roleTitle: selectedRole?.title || 'SDE II',
        interviewType,
        difficulty,
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
        transcript,
        codeSnippets: codeSnippet ? { language: 'typescript', code: codeSnippet } : null,
        whiteboardNotes,
        behaviorStats: { webcamConsented: cameraPreviewEnabled },
        resumeSkills: []
      });

      setCurrentReport(report);
      setCurrentView('report');
      addToast('success', 'Comprehensive evaluation complete!');
    } catch (e: any) {
      console.error('Evaluation error:', e);
      addToast('error', 'Evaluation failed, showing generated performance overview.');
      setCurrentView('report');
    }
  };

  const totalQuestions = interviewPlan?.questions?.length || 4;
  const currentQ = interviewPlan?.questions?.[currentQuestionIndex];

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden text-left">
      {/* Top Status Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl glass-2 border border-sage-300/20 shadow-lg">
        {/* Left: Role, Company & Difficulty */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-500/20 border border-sage-300/30 flex items-center justify-center font-bold text-mint text-sm">
            {selectedCompany?.name?.[0] || 'G'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              {selectedCompany?.name} · {selectedRole?.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <span>{interviewType} Round</span>
              <span>·</span>
              <span className="text-mint font-medium">{difficulty} Bar</span>
              <span>·</span>
              <span className="text-mint/90 font-medium font-mono text-[10px]">
                {activeVoiceProviderName === 'deepgram-agent' ? 'Deepgram Agent API' : activeVoiceProviderName === 'deepgram-cascaded' ? 'Deepgram Cascaded' : 'Web Speech'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Question Progress */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">
            Question {Math.min(currentQuestionIndex + 1, totalQuestions)} of {totalQuestions}:
          </span>
          <span className="text-xs font-medium text-text-primary max-w-xs truncate">
            {currentQ?.category || 'General Assessment'}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentQuestionIndex
                    ? 'w-5 bg-mint shadow-sm'
                    : i < currentQuestionIndex
                    ? 'bg-sage-400'
                    : 'bg-sage-950/60 border border-sage-300/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Timer & Speech Pace/Filler metrics */}
        <div className="flex items-center gap-3">
          {/* Subtle Live Pace Meter */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-sage-950/50 border border-sage-300/15 text-[11px]">
            <span className="text-text-muted">Pace:</span>
            <span className="font-semibold text-mint">{currentPaceWpm} WPM</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">{fillerWordsTotal} fillers</span>
          </div>

          {/* Timer Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-500/15 border border-sage-400/30 text-xs font-mono font-bold text-text-primary">
            <Clock className="w-3.5 h-3.5 text-mint" />
            <span>{formatTimer(elapsedSeconds)}</span>
            <span className="text-text-muted font-normal text-[10px]">/ {durationMinutes}m</span>
          </div>
        </div>
      </header>

      {/* Main Center Stage: Voice Orb & Floating Interviewer */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-6">
        <VoiceOrb
          state={orbState}
          audioLevel={audioInputLevel}
          size={230}
          subtext={
            isAiSpeaking
              ? 'Interviewer speaking (you can interrupt anytime)'
              : isCandidateSpeaking
              ? 'Listening to you speak...'
              : isAiThinking
              ? 'Evaluating answer & preparing follow-up...'
              : 'Interviewer waiting for your response'
          }
        />

        {/* Live Interim Subtitle Pill under Orb */}
        {(interimTranscript || (isAiSpeaking && transcript.length > 0)) && (
          <div className="mt-6 max-w-xl text-center px-4 py-2 rounded-2xl glass-2 border border-sage-300/20 shadow-md animate-in fade-in duration-150">
            <p className="text-xs text-text-primary italic">
              "{interimTranscript || transcript[transcript.length - 1]?.text}"
            </p>
          </div>
        )}
      </main>

      {/* Bottom Floating Control Dock */}
      <footer className="relative z-20 max-w-3xl mx-auto w-full">
        {/* Text Input Row (when text mode active) */}
        {isTextMode && (
          <div className="mb-3 flex items-center gap-2 p-2 rounded-2xl glass-2 border border-sage-300/20 shadow-lg">
            <input
              type="text"
              placeholder="Type your response to the AI interviewer..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-text-primary focus:outline-none placeholder:text-text-muted/60"
            />
            <button
              onClick={handleSendText}
              className="p-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-3 rounded-2xl glass-3 border border-sage-300/25 shadow-2xl flex items-center justify-between gap-2">
          {/* Left Actions: Mute & Hint & Repeat */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mute toggle */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                addToast('info', !isMuted ? 'Microphone muted.' : 'Microphone unmuted.');
              }}
              className={`p-2.5 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-status-error/20 border-status-error text-status-error'
                  : 'bg-sage-500/15 border-sage-300/20 text-mint hover:bg-sage-500/25'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Request Hint */}
            <button
              onClick={handleRequestHint}
              className="px-3 py-2 rounded-xl bg-sage-950/40 hover:bg-sage-500/15 border border-sage-300/20 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Request a subtle hint from AI"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gold" />
              <span className="hidden sm:inline">Hint</span>
            </button>

            {/* Repeat Question */}
            <button
              onClick={handleRepeatQuestion}
              className="px-3 py-2 rounded-xl bg-sage-950/40 hover:bg-sage-500/15 border border-sage-300/20 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Ask AI to repeat the question"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sage-300" />
              <span className="hidden sm:inline">Repeat</span>
            </button>
          </div>

          {/* Center Tools: Code, Whiteboard, Captions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Code Editor */}
            <button
              onClick={() => setActiveRoomTool(activeRoomTool === 'code' ? 'none' : 'code')}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeRoomTool === 'code'
                  ? 'bg-mint/20 border-mint/40 text-mint shadow-sm'
                  : 'bg-sage-950/40 border-sage-300/20 text-text-secondary hover:text-text-primary hover:bg-sage-500/15'
              }`}
              title="Open Live Code Editor"
            >
              <Code className="w-4 h-4" />
              <span className="hidden md:inline">Code</span>
            </button>

            {/* Whiteboard */}
            <button
              onClick={() => setActiveRoomTool(activeRoomTool === 'whiteboard' ? 'none' : 'whiteboard')}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeRoomTool === 'whiteboard'
                  ? 'bg-mint/20 border-mint/40 text-mint shadow-sm'
                  : 'bg-sage-950/40 border-sage-300/20 text-text-secondary hover:text-text-primary hover:bg-sage-500/15'
              }`}
              title="Open System Design Whiteboard"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Board</span>
            </button>

            {/* Captions Toggle */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                showCaptions
                  ? 'bg-sage-500/25 border-sage-400 text-text-primary'
                  : 'bg-sage-950/40 border-sage-300/20 text-text-muted hover:text-text-primary'
              }`}
              title="Toggle Transcript Panel"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Transcript</span>
            </button>

            {/* Text Mode */}
            <button
              onClick={() => setIsTextMode(!isTextMode)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
                isTextMode
                  ? 'bg-gold/20 border-gold/40 text-gold-light'
                  : 'text-text-muted hover:text-text-primary border-transparent'
              }`}
              title="Toggle Text Input Fallback"
            >
              ⌨
            </button>
          </div>

          {/* Right Action: End Call Button */}
          <div>
            <button
              onClick={() => setShowEndModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-status-error/80 to-status-error text-white font-semibold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-out Captions / Transcript Drawer */}
      {showCaptions && (
        <aside className="fixed top-20 right-4 bottom-24 z-30 w-80 sm:w-96 rounded-3xl glass-2 border border-sage-300/20 shadow-2xl p-4 flex flex-col justify-between hidden md:flex animate-in slide-in-from-right-3 duration-200">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-sage-300/15">
            <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-mint" />
              Live Conversation Transcript
            </span>
            <button
              onClick={() => setShowCaptions(false)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              ✕
            </button>
          </div>

          {/* Transcript messages list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {transcript.map((turn) => {
              const isAi = turn.speaker === 'ai';

              return (
                <div
                  key={turn.id}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[10px] text-text-muted mb-0.5 px-1">
                    {isAi ? `${selectedCompany?.name || 'AI'} Interviewer` : currentUser.name} · {turn.timestamp}
                  </span>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      isAi
                        ? 'bg-sage-500/20 text-text-primary border border-sage-300/20 rounded-tl-sm'
                        : 'bg-white/10 text-white border border-white/20 rounded-tr-sm'
                    }`}
                  >
                    {turn.text}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[10px] text-text-muted text-center border-t border-sage-300/15">
            Real-time transcript auto-saved to session.
          </div>
        </aside>
      )}

      {/* Code Editor Panel */}
      {activeRoomTool === 'code' && (
        <CodeEditorPanel
          onClose={() => setActiveRoomTool('none')}
          onSyncWithAi={(code) => {
            // Sync code with AI turn
            addToast('info', 'Code synced with interviewer.');
          }}
        />
      )}

      {/* Whiteboard Panel */}
      {activeRoomTool === 'whiteboard' && (
        <WhiteboardPanel onClose={() => setActiveRoomTool('none')} />
      )}

      {/* End Call Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowEndModal(false)}
          />
          <div className="relative z-10 max-w-md w-full rounded-3xl glass-3 p-6 sm:p-7 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-text-primary">
              Ready to Conclude Your Mock Interview?
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              We will immediately process the full audio transcript, code solutions, speech metrics, and generate your comprehensive 12-section performance report with hiring bar verdict.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setShowEndModal(false)}
              >
                Continue Call
              </GlassButton>
              <GlassButton
                variant="danger"
                size="sm"
                onClick={handleEndInterview}
              >
                Conclude & Analyze Performance
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
