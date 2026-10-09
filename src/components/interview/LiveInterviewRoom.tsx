import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { voiceService } from '../../services/voice/VoiceService';
import { VoiceOrb, OrbState } from '../common/VoiceOrb';
import { CodeEditorPanel } from './CodeEditorPanel';
import { WhiteboardPanel } from './WhiteboardPanel';
import { GlassButton } from '../common/GlassButton';
import { QuestionEvaluation } from '../../types';
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
  RefreshCw,
  Volume2
} from 'lucide-react';

export type LiveEngineState =
  | 'IDLE'
  | 'AI_SPEAKING'
  | 'LISTENING'
  | 'USER_SPEAKING'
  | 'PROCESSING'
  | 'ENDED';

interface TtsQueueItem {
  id: string;
  audioBase64?: string | null;
  text: string;
}

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
    setIsAiSpeaking,
    setIsCandidateSpeaking,
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

  // -------------------------------------------------------------
  // STATE MACHINE & REFS
  // -------------------------------------------------------------
  const [engineState, setEngineState] = useState<LiveEngineState>('IDLE');
  const engineStateRef = useRef<LiveEngineState>('IDLE');
  engineStateRef.current = engineState;

  // Visual Orb State
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioInputLevel, setAudioInputLevel] = useState<number>(0);

  // Status & Error Messages
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [silenceWarning, setSilenceWarning] = useState<string>('');

  // Transcripts & Buffering
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const bufferedCandidateTextRef = useRef<string>('');
  const speechDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Single-flight guard & AbortController
  const isInFlightLlmRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // TTS Single Player & FIFO Queue
  const ttsQueueRef = useRef<TtsQueueItem[]>([]);
  const isPlayingTtsRef = useRef<boolean>(false);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Turn-taking context for Anti-Repetition
  const askedQuestionsRef = useRef<string[]>([]);
  const coveredTopicsRef = useRef<string[]>([]);
  const lastAiUtterancesRef = useRef<string[]>([]);
  const followUpCountRef = useRef<number>(0);
  const accumulatedEvaluationsRef = useRef<QuestionEvaluation[]>([]);

  // Silence timing
  const [silenceSeconds, setSilenceSeconds] = useState<number>(0);
  const hasNudgedThisQuestionRef = useRef<boolean>(false);

  // Text fallback mode
  const [isTextMode, setIsTextMode] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [showCaptions, setShowCaptions] = useState<boolean>(true);

  // End Interview confirmation modal
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  // Helper to transition state cleanly and sync orb + store
  const transitionEngineState = useCallback((newState: LiveEngineState) => {
    engineStateRef.current = newState;
    setEngineState(newState);

    switch (newState) {
      case 'AI_SPEAKING':
        setOrbState('speaking');
        setIsAiSpeaking(true);
        setIsCandidateSpeaking(false);
        setIsAiThinking(false);
        break;
      case 'USER_SPEAKING':
        setOrbState('listening');
        setIsAiSpeaking(false);
        setIsCandidateSpeaking(true);
        setIsAiThinking(false);
        break;
      case 'LISTENING':
        setOrbState('listening');
        setIsAiSpeaking(false);
        setIsCandidateSpeaking(false);
        setIsAiThinking(false);
        break;
      case 'PROCESSING':
        setOrbState('thinking');
        setIsAiSpeaking(false);
        setIsCandidateSpeaking(false);
        setIsAiThinking(true);
        break;
      case 'IDLE':
      case 'ENDED':
      default:
        setOrbState('idle');
        setIsAiSpeaking(false);
        setIsCandidateSpeaking(false);
        setIsAiThinking(false);
        break;
    }
  }, [setIsAiSpeaking, setIsCandidateSpeaking, setIsAiThinking]);

  // Format MM:SS helper
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // TTS FIFO QUEUE & BARGE-IN IMPLEMENTATION
  // -------------------------------------------------------------
  const stopTtsAndClearQueue = useCallback(() => {
    ttsQueueRef.current = [];
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current.currentTime = 0;
      activeAudioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isPlayingTtsRef.current = false;
  }, []);

  const playNextTtsInQueue = useCallback(() => {
    if (ttsQueueRef.current.length === 0) {
      isPlayingTtsRef.current = false;

      // Reopen mic to STT exactly 300ms after TTS fully ends so AI never hears itself!
      setTimeout(() => {
        voiceService.setMicMuted(false);
        if (engineStateRef.current === 'AI_SPEAKING') {
          transitionEngineState('LISTENING');
        }
      }, 300);
      return;
    }

    isPlayingTtsRef.current = true;
    transitionEngineState('AI_SPEAKING');
    voiceService.setMicMuted(true); // Guarantee mic is muted during speech playback

    const item = ttsQueueRef.current.shift()!;

    if (item.audioBase64) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${item.audioBase64}`);
        activeAudioElementRef.current = audio;

        audio.onended = () => {
          activeAudioElementRef.current = null;
          playNextTtsInQueue();
        };

        audio.onerror = (e) => {
          console.warn('[TTS Playback] Audio element error, playing next:', e);
          activeAudioElementRef.current = null;
          playNextTtsInQueue();
        };

        audio.play().catch((err) => {
          console.warn('[TTS Playback] audio.play() blocked, fallback to next:', err);
          activeAudioElementRef.current = null;
          playNextTtsInQueue();
        });
      } catch (err) {
        console.warn('[TTS Playback] Exception creating Audio:', err);
        playNextTtsInQueue();
      }
    } else {
      // Free Web Speech synthesis fallback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => playNextTtsInQueue();
        utterance.onerror = () => playNextTtsInQueue();
        window.speechSynthesis.speak(utterance);
      } else {
        playNextTtsInQueue();
      }
    }
  }, [transitionEngineState]);

  const enqueueTtsUtterance = useCallback((item: TtsQueueItem) => {
    ttsQueueRef.current.push(item);
    if (!isPlayingTtsRef.current) {
      playNextTtsInQueue();
    }
  }, [playNextTtsInQueue]);

  // Barge-In: Candidate speaks while AI is speaking
  const handleBargeIn = useCallback(() => {
    if (engineStateRef.current === 'AI_SPEAKING' || isPlayingTtsRef.current) {
      stopTtsAndClearQueue();
      voiceService.setMicMuted(false);
      transitionEngineState('USER_SPEAKING');
      addToast('info', 'AI paused — listening to you.');
    }
  }, [stopTtsAndClearQueue, transitionEngineState, addToast]);

  // -------------------------------------------------------------
  // AI TURN EXECUTION WITH 3X RETRY (NO CANNED FALLBACKS)
  // -------------------------------------------------------------
  const executeAiTurn = useCallback(async (
    candidateMessage: string,
    options: { requestedHint?: boolean; requestedRepeat?: boolean } = {}
  ) => {
    // Single-flight guard: never trigger if already processing or playing TTS
    if (isInFlightLlmRef.current || isPlayingTtsRef.current) {
      console.warn('[Turn-Taking] In-flight work active, ignoring trigger.');
      return;
    }

    // Cancel any previous in-flight call
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    isInFlightLlmRef.current = true;
    transitionEngineState('PROCESSING');
    setErrorMessage('');
    setSilenceWarning('');
    setSilenceSeconds(0);

    // Record candidate turn in transcript
    if (candidateMessage.trim()) {
      addTranscriptTurn({
        id: `turn-cand-${Date.now()}`,
        speaker: 'candidate',
        text: candidateMessage.trim(),
        timestamp: formatTimer(elapsedSeconds),
        secondsFromStart: elapsedSeconds,
        questionIndex: currentQuestionIndex
      });

      // Pacing & filler words
      const fillerMatches = (candidateMessage.match(/\b(um|uh|like|basically|actually|you know|sort of|matlab|so yeah)\b/gi) || []);
      if (fillerMatches.length > 0) incrementFillerWords(fillerMatches.length);
      const words = candidateMessage.trim().split(/\s+/).filter(Boolean);
      if (words.length > 4) {
        const estWpm = Math.min(210, Math.max(90, Math.round((words.length / 15) * 60)));
        setCurrentPaceWpm(estWpm);
      }
    }

    // Retry loop: up to 3 times on network or LLM errors
    let attempts = 0;
    let turnSuccess = false;
    let turnResult: any = null;

    while (attempts < 3 && !turnSuccess && !abortController.signal.aborted) {
      attempts++;
      try {
        if (attempts > 1) {
          setErrorMessage(`Reconnecting... (attempt ${attempts}/3)`);
        }

        turnResult = await api.sendSpeechTurn({
          candidateName: currentUser.name,
          companyName: selectedCompany?.name || 'Google',
          roleTitle: selectedRole?.title || 'SDE II',
          difficulty,
          interviewType,
          language,
          plan: interviewPlan,
          transcriptHistory: transcript,
          candidateMessage: candidateMessage.trim(),
          candidateCode: codeSnippet,
          currentQuestionIndex,
          followUpCount: followUpCountRef.current,
          askedQuestions: askedQuestionsRef.current,
          coveredTopics: coveredTopicsRef.current,
          lastAiUtterances: lastAiUtterancesRef.current,
          userRequestedHint: options.requestedHint || false,
          userRequestedRepeat: options.requestedRepeat || false,
          silentSeconds: silenceSeconds
        });

        if (turnResult && turnResult.success) {
          turnSuccess = true;
          setErrorMessage('');
        } else {
          throw new Error(turnResult?.error || 'Turn generation failed');
        }
      } catch (err: any) {
        if (abortController.signal.aborted) return;
        console.warn(`[Turn Generation] Attempt ${attempts} error:`, err.message);
        setErrorMessage('Reconnecting...');
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    isInFlightLlmRef.current = false;

    if (abortController.signal.aborted) return;

    if (!turnSuccess || !turnResult) {
      setErrorMessage('Reconnecting... Unable to reach interviewer. Click retry below.');
      transitionEngineState('LISTENING');
      return;
    }

    const aiUtterance = turnResult.next_utterance || turnResult.aiResponseText;

    // Track AI utterance for anti-repetition (last 10)
    lastAiUtterancesRef.current.push(aiUtterance);
    if (lastAiUtterancesRef.current.length > 10) {
      lastAiUtterancesRef.current.shift();
    }

    // Track asked question and covered topic
    const currentQ = interviewPlan?.questions?.[currentQuestionIndex];
    if (currentQ) {
      if (!askedQuestionsRef.current.includes(currentQ.question)) {
        askedQuestionsRef.current.push(currentQ.question);
      }
      if (!coveredTopicsRef.current.includes(currentQ.category)) {
        coveredTopicsRef.current.push(currentQ.category);
      }
    }

    // Record AI turn in transcript
    addTranscriptTurn({
      id: `turn-ai-${Date.now()}`,
      speaker: 'ai',
      text: aiUtterance,
      timestamp: formatTimer(elapsedSeconds),
      secondsFromStart: elapsedSeconds,
      questionIndex: currentQuestionIndex
    });

    // Store per-answer evaluation in QuestionEvaluation format for final report
    if (turnResult.evaluation && currentQ) {
      const qEval: QuestionEvaluation = {
        questionNumber: currentQuestionIndex + 1,
        category: currentQ.category,
        questionText: currentQ.question,
        candidateAnswerExcerpt: candidateMessage.slice(0, 160) || '(Spoken response)',
        scoreOutOf10: Math.round(((turnResult.evaluation.relevance || 8) + (turnResult.evaluation.depth || 8)) / 2),
        whatWasGood: turnResult.evaluation.whatWasGood || turnResult.evaluation.notes || 'Strong technical understanding.',
        whatWasMissing: turnResult.evaluation.whatWasMissing || 'Could elaborate more on edge case handling.',
        mistakesOrErrors: turnResult.evaluation.mistakesOrErrors || 'None noted.',
        idealModelAnswer: turnResult.evaluation.idealModelAnswer || 'Clear, metric-backed architecture explanation.',
        followUpAsked: turnResult.action === 'follow_up' ? aiUtterance : undefined,
        followUpHandling: turnResult.action === 'follow_up' ? 'Addressed follow-up probe' : 'Direct response',
        timeTakenSeconds: Math.max(15, silenceSeconds || 25),
        transcriptTimestamp: formatTimer(elapsedSeconds)
      };
      accumulatedEvaluationsRef.current.push(qEval);
    }

    // Advance question or follow-up count
    if (turnResult.action === 'follow_up') {
      followUpCountRef.current += 1;
      if (followUpCountRef.current >= 2) {
        followUpCountRef.current = 0;
        setCurrentQuestionIndex((prev) => Math.min((interviewPlan?.questions?.length || 4) - 1, prev + 1));
        hasNudgedThisQuestionRef.current = false;
      }
    } else if (turnResult.action === 'next_question') {
      followUpCountRef.current = 0;
      setCurrentQuestionIndex((prev) => Math.min((interviewPlan?.questions?.length || 4) - 1, prev + 1));
      hasNudgedThisQuestionRef.current = false;
    }

    // Enqueue speech into FIFO player
    enqueueTtsUtterance({
      id: `tts-${Date.now()}`,
      audioBase64: turnResult.audioBase64,
      text: aiUtterance
    });
  }, [
    currentUser.name,
    selectedCompany?.name,
    selectedRole?.title,
    difficulty,
    interviewType,
    language,
    interviewPlan,
    transcript,
    codeSnippet,
    currentQuestionIndex,
    silenceSeconds,
    elapsedSeconds,
    addTranscriptTurn,
    incrementFillerWords,
    setCurrentPaceWpm,
    setCurrentQuestionIndex,
    transitionEngineState,
    enqueueTtsUtterance
  ]);

  // -------------------------------------------------------------
  // TURN-TAKING SPEECH FINAL & DEBOUNCE LOGIC
  // -------------------------------------------------------------
  const scheduleFinalSpeechTrigger = useCallback(() => {
    if (speechDebounceTimerRef.current) {
      clearTimeout(speechDebounceTimerRef.current);
    }

    // 1.2s silence debounce
    speechDebounceTimerRef.current = setTimeout(() => {
      const buffered = bufferedCandidateTextRef.current.trim();
      if (!buffered) return;

      // Filter filler-only speech
      const words = buffered.toLowerCase().split(/\s+/).filter(Boolean);
      const nonFillers = words.filter(
        (w) => !['um', 'uh', 'like', 'hmm', 'er', 'ah', 'basically', 'actually', 'you know', 'matlab', 'so yeah'].includes(w)
      );

      if (nonFillers.length < 2) {
        // Less than 2 non-filler words: ignore and return to LISTENING
        bufferedCandidateTextRef.current = '';
        if (engineStateRef.current === 'USER_SPEAKING') {
          transitionEngineState('LISTENING');
        }
        return;
      }

      // Valid candidate response!
      bufferedCandidateTextRef.current = '';
      setInterimTranscript('');
      executeAiTurn(buffered);
    }, 1200);
  }, [executeAiTurn, transitionEngineState]);

  // -------------------------------------------------------------
  // INITIALIZE VOICE ENGINE ON MOUNT (DEEPGRAM PIPELINE)
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // Start voice service with Deepgram live proxy pipeline
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
          provider: 'deepgram-cascaded',
          durationMinutes
        },
        {
          onTranscript: (event) => {
            if (!isMounted) return;

            setSilenceWarning('');
            setSilenceSeconds(0);

            if (event.isFinal) {
              // Buffer is_final segment only; NEVER call LLM on interim results!
              bufferedCandidateTextRef.current += (bufferedCandidateTextRef.current ? ' ' : '') + event.text;
              setInterimTranscript('');

              if (engineStateRef.current === 'AI_SPEAKING') {
                handleBargeIn();
              } else if (engineStateRef.current !== 'USER_SPEAKING' && engineStateRef.current !== 'PROCESSING') {
                transitionEngineState('USER_SPEAKING');
              }

              if (event.isSpeechFinal) {
                scheduleFinalSpeechTrigger();
              }
            } else {
              // Interim text: show live subtitles only, never call LLM
              setInterimTranscript(event.text);
              if (engineStateRef.current === 'AI_SPEAKING') {
                handleBargeIn();
              } else if (engineStateRef.current === 'LISTENING') {
                transitionEngineState('USER_SPEAKING');
              }
            }
          },
          onSpeechStarted: () => {
            if (!isMounted) return;
            setSilenceWarning('');
            setSilenceSeconds(0);
            if (engineStateRef.current === 'AI_SPEAKING') {
              handleBargeIn();
            } else if (engineStateRef.current === 'LISTENING') {
              transitionEngineState('USER_SPEAKING');
            }
          },
          onUtteranceEnd: () => {
            if (!isMounted) return;
            scheduleFinalSpeechTrigger();
          },
          onAudioLevel: (lvl) => {
            if (!isMounted) return;
            setAudioInputLevel(lvl);
            if (lvl > 2) {
              setSilenceWarning('');
            }
          },
          onSilenceWarning: (msg) => {
            if (!isMounted) return;
            if (engineStateRef.current === 'LISTENING') {
              setSilenceWarning(msg);
            }
          },
          onError: (err) => {
            console.warn('[Voice Engine Notice]:', err);
            if (typeof err === 'string' && err.includes('Lost connection')) {
              setErrorMessage('Reconnecting...');
            }
          },
          onStateChange: () => {},
          onBargeIn: () => {
            if (!isMounted) return;
            handleBargeIn();
          }
        }
      )
      .catch((err) => {
        console.warn('Voice start exception:', err);
        if (isMounted) setErrorMessage('Microphone access or live voice connection error.');
      });

    // Start with warmup greeting from interview plan
    const greetingText =
      interviewPlan?.warmupIntro ||
      `Hello ${currentUser.name}, welcome to your ${selectedCompany?.name || 'Google'} mock interview for the ${selectedRole?.title || 'Software Engineer'} role! It is great to have you here today. Could you briefly introduce yourself and share a highlight from your recent engineering work?`;

    const timer = setTimeout(() => {
      if (!isMounted) return;

      // Track warmup greeting
      lastAiUtterancesRef.current.push(greetingText);
      addTranscriptTurn({
        id: `turn-ai-intro`,
        speaker: 'ai',
        text: greetingText,
        timestamp: '00:00',
        secondsFromStart: 0,
        questionIndex: 0
      });

      // Synthesize through Deepgram Aura TTS
      api.synthesizeDeepgramTts(greetingText, deepgramVoice).then((ttsRes) => {
        if (!isMounted) return;
        enqueueTtsUtterance({
          id: 'tts-intro',
          audioBase64: ttsRes.audioBase64,
          text: greetingText
        });
      });
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
      stopTtsAndClearQueue();
      voiceService.stop();
    };
  }, []);

  // -------------------------------------------------------------
  // SILENCE TIMERS (12s NUDGE, 25s MOVE-ON)
  // -------------------------------------------------------------
  useEffect(() => {
    const silenceInterval = setInterval(() => {
      if (engineStateRef.current === 'LISTENING') {
        setSilenceSeconds((prev) => {
          const next = prev + 1;

          // 12s silence: polite nudge once
          if (next === 12 && !hasNudgedThisQuestionRef.current && !isInFlightLlmRef.current) {
            hasNudgedThisQuestionRef.current = true;
            executeAiTurn('', { requestedHint: true });
          }

          // 25s silence: move on to next question
          if (next === 25 && !isInFlightLlmRef.current) {
            hasNudgedThisQuestionRef.current = false;
            addToast('info', 'Moving forward to next question...');
            executeAiTurn("Let's move on to the next question.");
          }

          return next;
        });
      }
    }, 1000);

    return () => clearInterval(silenceInterval);
  }, [executeAiTurn, addToast]);

  // Elapsed seconds timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [setElapsedSeconds]);

  // -------------------------------------------------------------
  // ACTION HANDLERS: HINT, REPEAT, TEXT MODE, RETRY MIC
  // -------------------------------------------------------------
  const handleRequestHint = () => {
    handleBargeIn();
    addToast('info', 'Requesting guidance hint from interviewer...');
    executeAiTurn('Could you give me a subtle hint or point me in the right direction?', {
      requestedHint: true
    });
  };

  const handleRepeatQuestion = () => {
    handleBargeIn();
    addToast('info', 'Asking interviewer to repeat the question...');
    executeAiTurn('Could you repeat the question please?', { requestedRepeat: true });
  };

  const handleSendText = () => {
    if (!textInput.trim()) return;
    handleBargeIn();
    const text = textInput.trim();
    setTextInput('');
    executeAiTurn(text);
  };

  const handleRetryMic = () => {
    setSilenceWarning('');
    voiceService.setMicMuted(false);
    transitionEngineState('LISTENING');
    addToast('info', 'Microphone connection refreshed.');
  };

  // -------------------------------------------------------------
  // END INTERVIEW & EVALUATE
  // -------------------------------------------------------------
  const handleEndInterview = async () => {
    setShowEndModal(false);
    stopTtsAndClearQueue();
    voiceService.stop();

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
        resumeSkills: parsedResume?.skills || []
      });

      setCurrentReport(report);
      setCurrentView('report');
      addToast('success', 'Comprehensive evaluation complete!');
    } catch (e: any) {
      console.error('Evaluation error:', e);
      addToast('error', 'Evaluation generated with transcript summary.');
      setCurrentView('report');
    }
  };

  const totalQuestions = interviewPlan?.questions?.length || 8;
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
                Deepgram Live Voice
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
            {currentQ?.category || 'Technical Assessment'}
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

        {/* Right: State Badge, Timer & Pace */}
        <div className="flex items-center gap-2.5">
          {/* Subtle Live Turn-Taking State Badge */}
          <div
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
              engineState === 'AI_SPEAKING'
                ? 'bg-sage-500/20 border-sage-400/40 text-mint'
                : engineState === 'USER_SPEAKING'
                ? 'bg-mint/20 border-mint/50 text-mint animate-pulse'
                : engineState === 'PROCESSING'
                ? 'bg-gold/20 border-gold/40 text-gold animate-pulse'
                : 'bg-sage-950/50 border-sage-300/20 text-text-secondary'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                engineState === 'AI_SPEAKING'
                  ? 'bg-mint'
                  : engineState === 'USER_SPEAKING'
                  ? 'bg-mint animate-ping'
                  : engineState === 'PROCESSING'
                  ? 'bg-gold animate-spin'
                  : 'bg-sage-400'
              }`}
            />
            <span>
              {engineState === 'AI_SPEAKING'
                ? 'Interviewer Speaking'
                : engineState === 'USER_SPEAKING'
                ? 'Listening to You'
                : engineState === 'PROCESSING'
                ? 'Thinking...'
                : 'Listening'}
            </span>
          </div>

          {/* Mini Audio Level Meter */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sage-950/40 border border-sage-300/15" title="Mic Level">
            <Mic className="w-3 h-3 text-mint" />
            <div className="w-10 h-1.5 rounded-full bg-sage-950/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mint to-gold transition-all duration-75"
                style={{ width: `${Math.min(100, audioInputLevel * 1.5)}%` }}
              />
            </div>
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
            engineState === 'AI_SPEAKING'
              ? 'Interviewer speaking (you can interrupt anytime)'
              : engineState === 'USER_SPEAKING'
              ? 'Listening to you speak...'
              : engineState === 'PROCESSING'
              ? 'Evaluating response & formulating next question...'
              : 'Waiting for your answer...'
          }
        />

        {/* Error / Silence Message Line */}
        {(errorMessage || silenceWarning) && (
          <div className="mt-4 px-4 py-2 rounded-2xl bg-sage-950/80 border border-status-warning/40 flex items-center gap-2 text-xs shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-gold shrink-0" />
            <span className="text-text-primary">{errorMessage || silenceWarning}</span>
            {silenceWarning && (
              <button
                onClick={handleRetryMic}
                className="ml-2 px-2 py-0.5 rounded-lg bg-mint/20 hover:bg-mint/30 text-mint text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Retry Mic
              </button>
            )}
          </div>
        )}

        {/* Live Interim Subtitle Pill under Orb */}
        {(interimTranscript || (engineState === 'AI_SPEAKING' && transcript.length > 0)) && (
          <div className="mt-5 max-w-xl text-center px-4 py-2 rounded-2xl glass-2 border border-sage-300/20 shadow-md animate-in fade-in duration-150">
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
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                voiceService.setMicMuted(nextMute);
                addToast('info', nextMute ? 'Microphone muted.' : 'Microphone unmuted.');
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
              disabled={engineState === 'PROCESSING'}
              className="px-3 py-2 rounded-xl bg-sage-950/40 hover:bg-sage-500/15 border border-sage-300/20 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Request a subtle hint from AI"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gold" />
              <span className="hidden sm:inline">Hint</span>
            </button>

            {/* Repeat Question */}
            <button
              onClick={handleRepeatQuestion}
              disabled={engineState === 'PROCESSING'}
              className="px-3 py-2 rounded-xl bg-sage-950/40 hover:bg-sage-500/15 border border-sage-300/20 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
          onSyncWithAi={() => {
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
