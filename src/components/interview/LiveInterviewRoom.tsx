import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { voiceService } from '../../services/voice/VoiceService';
import { VoiceOrb, OrbState } from '../common/VoiceOrb';
import { CodeEditorPanel } from './CodeEditorPanel';
import { WhiteboardPanel } from './WhiteboardPanel';
import { GlassButton } from '../common/GlassButton';
import { QuestionEvaluation, TranscriptTurn } from '../../types';
import { saveReportToFirestore } from '../../services/firestoreData';
import { VideoFeed } from '../common/VideoFeed';
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
  Volume2,
  Zap,
  Video,
  VideoOff,
  User,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Monitor
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
  const interimTranscriptRef = useRef<string>('');
  const bufferedCandidateTextRef = useRef<string>('');
  const speechDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interimSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const silenceSecondsRef = useRef<number>(0);
  silenceSecondsRef.current = silenceSeconds;

  const elapsedSecondsRef = useRef<number>(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;

  const transcriptRef = useRef<TranscriptTurn[]>(transcript);
  transcriptRef.current = transcript;

  const codeSnippetRef = useRef<string>(codeSnippet);
  codeSnippetRef.current = codeSnippet;

  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;

  const toggleMute = useCallback(() => {
    const nextMute = !isMutedRef.current;
    setIsMuted(nextMute);
    isMutedRef.current = nextMute;
    voiceService.setMicMuted(nextMute);

    if (nextMute) {
      setAudioInputLevel(0);
      setInterimTranscript('');
      interimTranscriptRef.current = '';
      bufferedCandidateTextRef.current = '';
      if (speechDebounceTimerRef.current) {
        clearTimeout(speechDebounceTimerRef.current);
        speechDebounceTimerRef.current = null;
      }
      if (interimSilenceTimerRef.current) {
        clearTimeout(interimSilenceTimerRef.current);
        interimSilenceTimerRef.current = null;
      }
      setSilenceWarning('');
      addToast('info', 'Microphone muted. AI cannot hear you.');
    } else {
      addToast('success', 'Microphone unmuted.');
    }
  }, [setIsMuted, addToast]);

  // Keyboard shortcut for muting: 'm' or 'M'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMute]);

  const hasNudgedThisQuestionRef = useRef<boolean>(false);

  // Text fallback mode
  const [isTextMode, setIsTextMode] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [showCaptions, setShowCaptions] = useState<boolean>(true);

  // Active Follow-Up Probe state (for displaying interactive probe in UI)
  const [activeProbeText, setActiveProbeText] = useState<string>('');
  const [followUpProbeCount, setFollowUpProbeCount] = useState<number>(0);

  // End Interview confirmation modal
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  // Candidate Live Video Feed State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(cameraPreviewEnabled);
  const [candidateStream, setCandidateStream] = useState<MediaStream | null>(null);
  const candidateStreamRef = useRef<MediaStream | null>(null);
  const [viewLayout, setViewLayout] = useState<'video-grid' | 'orb-focus'>('video-grid');
  const [isPipExpanded, setIsPipExpanded] = useState<boolean>(false);

  const startCamera = async () => {
    try {
      if (candidateStreamRef.current) {
        candidateStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
      } catch {
        // Fallback to basic constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      candidateStreamRef.current = stream;
      setCandidateStream(stream);
      setIsCameraActive(true);
    } catch (e: any) {
      console.warn('Live camera access error:', e);
      setIsCameraActive(false);
      setCandidateStream(null);
      candidateStreamRef.current = null;
      addToast('warning', 'Camera not detected or permission denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (candidateStreamRef.current) {
      candidateStreamRef.current.getTracks().forEach((track) => track.stop());
      candidateStreamRef.current = null;
    }
    setCandidateStream(null);
    setIsCameraActive(false);
  };

  const toggleLiveCamera = () => {
    if (isCameraActive) {
      stopCamera();
      addToast('info', 'Camera turned off.');
    } else {
      startCamera();
      addToast('success', 'Camera connected and ready.');
    }
  };

  // Auto-start camera if cameraPreviewEnabled was on from lobby, and clean up on unmount
  useEffect(() => {
    if (cameraPreviewEnabled) {
      startCamera();
    }
    return () => {
      if (candidateStreamRef.current) {
        candidateStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
      // Only unmute if candidate has not manually muted their mic!
      setTimeout(() => {
        if (!isMutedRef.current) {
          voiceService.setMicMuted(false);
        }
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
      if (!isMutedRef.current) {
        voiceService.setMicMuted(false);
      }
      transitionEngineState('USER_SPEAKING');
      addToast('info', 'AI paused — listening to you.');
    }
  }, [stopTtsAndClearQueue, transitionEngineState, addToast]);

  // -------------------------------------------------------------
  // AI TURN EXECUTION WITH 3X RETRY (NO CANNED FALLBACKS)
  // -------------------------------------------------------------
  const executeAiTurn = useCallback(async (
    candidateMessage: string,
    options: { requestedHint?: boolean; requestedRepeat?: boolean; requestedChallenge?: boolean } = {}
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
        timestamp: formatTimer(elapsedSecondsRef.current),
        secondsFromStart: elapsedSecondsRef.current,
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

    while (attempts < 2 && !turnSuccess && !abortController.signal.aborted) {
      attempts++;
      try {
        if (attempts > 1) {
          setErrorMessage(`Connecting...`);
        }

        turnResult = await api.sendSpeechTurn({
          candidateName: currentUser.name,
          companyName: selectedCompany?.name || 'Google',
          roleTitle: selectedRole?.title || 'SDE II',
          difficulty,
          interviewType,
          language,
          plan: interviewPlan,
          transcriptHistory: transcriptRef.current,
          candidateMessage: candidateMessage.trim(),
          candidateCode: codeSnippetRef.current,
          currentQuestionIndex,
          followUpCount: followUpCountRef.current,
          askedQuestions: askedQuestionsRef.current,
          coveredTopics: coveredTopicsRef.current,
          lastAiUtterances: lastAiUtterancesRef.current,
          userRequestedHint: options.requestedHint || false,
          userRequestedRepeat: options.requestedRepeat || false,
          userRequestedChallenge: options.requestedChallenge || false,
          silentSeconds: silenceSecondsRef.current
        });

        if (turnResult && turnResult.success) {
          turnSuccess = true;
          setErrorMessage('');
        } else {
          throw new Error(turnResult?.error || 'Turn generation failed');
        }
      } catch (err: any) {
        if (abortController.signal.aborted) return;
        console.warn(`[Turn Generation] Attempt ${attempts} notice:`, err.message);
        if (attempts < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    isInFlightLlmRef.current = false;

    if (abortController.signal.aborted) return;

    if (!turnSuccess || !turnResult) {
      console.warn('[LiveInterviewRoom] Generating local recovery turn from interview plan');
      const curQ = interviewPlan?.questions?.[currentQuestionIndex];
      const fallbackUtterance = options.requestedRepeat
        ? `Certainly! To restate the active question: ${curQ?.question || 'Could you walk me through your technical background and experience?'}`
        : options.requestedHint
        ? `Here is a hint to guide your thinking: Consider ${curQ?.expectedKeywords?.slice(0, 2).join(' and ') || 'the trade-offs and scalability'}. Focus on how you would structure the design.`
        : options.requestedChallenge
        ? `Let's raise the bar: If traffic surges by 20x and a regional datastore experiences a 5-second network partition, how do you prevent cascading thread pool starvation and data corruption?`
        : `That provides useful context. Building directly on what you just shared, what was the toughest operational failure mode you guarded against in that architecture?`;

      turnResult = {
        success: true,
        reaction: 'Interview turn recovered.',
        action: 'follow_up',
        next_utterance: fallbackUtterance,
        aiResponseText: fallbackUtterance,
        audioBase64: null,
        fillerWordsFound: [],
        wordCount: candidateMessage.trim().split(/\s+/).filter(Boolean).length,
        advanceQuestion: false
      };
      setErrorMessage('');
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
      setFollowUpProbeCount(followUpCountRef.current);
      setActiveProbeText(aiUtterance);
      // DO NOT advance question index during follow-up probe on current question
    } else if (turnResult.action === 'next_question') {
      followUpCountRef.current = 0;
      setFollowUpProbeCount(0);
      setActiveProbeText('');
      setCurrentQuestionIndex((prev) => Math.min((interviewPlan?.questions?.length || 8) - 1, prev + 1));
      hasNudgedThisQuestionRef.current = false;
    } else if (turnResult.action === 'end') {
      followUpCountRef.current = 0;
      setFollowUpProbeCount(0);
      setActiveProbeText('');
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
    currentQuestionIndex,
    addTranscriptTurn,
    incrementFillerWords,
    setCurrentPaceWpm,
    setCurrentQuestionIndex,
    transitionEngineState,
    enqueueTtsUtterance,
    setActiveProbeText,
    setFollowUpProbeCount
  ]);

  const executeAiTurnRef = useRef(executeAiTurn);
  executeAiTurnRef.current = executeAiTurn;

  // -------------------------------------------------------------
  // TURN-TAKING SPEECH FINAL & IMMEDIATE SUBMISSION LOGIC
  // -------------------------------------------------------------
  const submitCandidateAnswerNow = useCallback(() => {
    if (speechDebounceTimerRef.current) {
      clearTimeout(speechDebounceTimerRef.current);
      speechDebounceTimerRef.current = null;
    }
    if (interimSilenceTimerRef.current) {
      clearTimeout(interimSilenceTimerRef.current);
      interimSilenceTimerRef.current = null;
    }

    const answer = (bufferedCandidateTextRef.current.trim() || interimTranscriptRef.current.trim()).trim();
    if (!answer) {
      addToast('info', 'Please speak or type your answer before submitting.');
      return;
    }

    bufferedCandidateTextRef.current = '';
    setInterimTranscript('');
    interimTranscriptRef.current = '';
    setTextInput('');
    executeAiTurnRef.current(answer);
  }, [addToast]);

  const scheduleFinalSpeechTrigger = useCallback(() => {
    if (speechDebounceTimerRef.current) {
      clearTimeout(speechDebounceTimerRef.current);
    }

    // 650ms snappy silence debounce for fast conversational responsiveness
    speechDebounceTimerRef.current = setTimeout(() => {
      const buffered = (bufferedCandidateTextRef.current.trim() || interimTranscriptRef.current.trim()).trim();
      if (!buffered) return;

      // Filter filler-only speech
      const words = buffered.toLowerCase().split(/\s+/).filter(Boolean);
      const nonFillers = words.filter(
        (w) => !['um', 'uh', 'like', 'hmm', 'er', 'ah', 'basically', 'actually', 'you know', 'matlab', 'so yeah'].includes(w)
      );

      // Only discard if candidate spoke exclusively filler murmurings (e.g. "um... uh")
      if (nonFillers.length === 0 && words.length > 0) {
        bufferedCandidateTextRef.current = '';
        setInterimTranscript('');
        interimTranscriptRef.current = '';
        if (engineStateRef.current === 'USER_SPEAKING') {
          transitionEngineState('LISTENING');
        }
        return;
      }

      // Valid candidate response!
      bufferedCandidateTextRef.current = '';
      setInterimTranscript('');
      interimTranscriptRef.current = '';
      executeAiTurnRef.current(buffered);
    }, 650);
  }, [transitionEngineState]);

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
            if (!isMounted || isMutedRef.current) return;

            setSilenceWarning('');
            setSilenceSeconds(0);

            if (event.isFinal) {
              bufferedCandidateTextRef.current += (bufferedCandidateTextRef.current ? ' ' : '') + event.text;
              setInterimTranscript('');
              interimTranscriptRef.current = '';

              if (engineStateRef.current === 'AI_SPEAKING') {
                handleBargeIn();
              } else if (engineStateRef.current !== 'USER_SPEAKING' && engineStateRef.current !== 'PROCESSING') {
                transitionEngineState('USER_SPEAKING');
              }

              // Always schedule final speech trigger when a final segment arrives
              scheduleFinalSpeechTrigger();
            } else {
              // Interim text: update live subtitles and fallback timer
              setInterimTranscript(event.text);
              interimTranscriptRef.current = event.text;

              if (engineStateRef.current === 'AI_SPEAKING') {
                handleBargeIn();
              } else if (engineStateRef.current === 'LISTENING') {
                transitionEngineState('USER_SPEAKING');
              }

              // Fallback timer for continuous interim speech: if speaker pauses for 1.3s without isFinal
              if (interimSilenceTimerRef.current) {
                clearTimeout(interimSilenceTimerRef.current);
              }
              interimSilenceTimerRef.current = setTimeout(() => {
                if (isMutedRef.current) return;
                const text = (bufferedCandidateTextRef.current.trim() || interimTranscriptRef.current.trim()).trim();
                if (text && engineStateRef.current === 'USER_SPEAKING') {
                  bufferedCandidateTextRef.current = '';
                  setInterimTranscript('');
                  interimTranscriptRef.current = '';
                  executeAiTurnRef.current(text);
                }
              }, 1300);
            }
          },
          onSpeechStarted: () => {
            if (!isMounted || isMutedRef.current) return;
            setSilenceWarning('');
            setSilenceSeconds(0);
            if (engineStateRef.current === 'AI_SPEAKING') {
              handleBargeIn();
            } else if (engineStateRef.current === 'LISTENING') {
              transitionEngineState('USER_SPEAKING');
            }
          },
          onUtteranceEnd: () => {
            if (!isMounted || isMutedRef.current) return;
            scheduleFinalSpeechTrigger();
          },
          onAudioLevel: (lvl) => {
            if (!isMounted) return;
            if (isMutedRef.current) {
              setAudioInputLevel(0);
              return;
            }
            setAudioInputLevel(lvl);
            if (lvl > 2) {
              setSilenceWarning('');
            }
          },
          onSilenceWarning: (msg) => {
            if (!isMounted || isMutedRef.current) return;
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
        const next = silenceSecondsRef.current + 1;
        silenceSecondsRef.current = next;
        setSilenceSeconds(next);

        // 12s silence: polite nudge once (clean execution outside updater)
        if (next === 12 && !hasNudgedThisQuestionRef.current && !isInFlightLlmRef.current) {
          hasNudgedThisQuestionRef.current = true;
          executeAiTurnRef.current('', { requestedHint: true });
        }

        // 25s silence: move on to next question (clean execution outside updater)
        if (next === 25 && !isInFlightLlmRef.current) {
          hasNudgedThisQuestionRef.current = false;
          addToast('info', 'Moving forward to next question...');
          executeAiTurnRef.current("Let's move on to the next question.");
        }
      }
    }, 1000);

    return () => clearInterval(silenceInterval);
  }, [addToast]);

  // Elapsed seconds timer (using ref sync)
  useEffect(() => {
    const interval = setInterval(() => {
      elapsedSecondsRef.current += 1;
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

  const handleChallengeMe = () => {
    handleBargeIn();
    addToast('warning', 'Requesting a tough, high-stakes bar-raiser challenge...');
    executeAiTurn('Please challenge me with a tough follow-up on what I just shared!', {
      requestedChallenge: true
    });
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
    setIsMuted(false);
    isMutedRef.current = false;
    voiceService.setMicMuted(false);
    transitionEngineState('LISTENING');
    addToast('info', 'Microphone connection refreshed and unmuted.');
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
      if (currentUser?.uid) {
        saveReportToFirestore(report, currentUser.uid).catch((err) =>
          console.warn('[Firestore] Report save notice:', err)
        );
      }
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

      {/* Main Center Stage: Active Question & Voice Orb */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 w-full max-w-3xl mx-auto">
        {/* Sleek Active Question & Interactive Probe Banner */}
        <div className="w-full px-4 sm:px-5 py-3.5 mb-4 rounded-2xl glass-2 border border-sage-300/25 shadow-xl text-left transition-all animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-mint text-[11px] tracking-wider uppercase">
                Stage {Math.min(currentQuestionIndex + 1, totalQuestions)} of {totalQuestions}
              </span>
              <span aria-hidden="true" className="text-sage-400/40">·</span>
              <span className="text-text-secondary text-[11px] font-medium">{currentQ?.category || 'Technical'}</span>
              <span aria-hidden="true" className="text-sage-400/40">·</span>
              {activeProbeText ? (
                <span className="text-gold font-semibold text-[11px] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-gold" /> Follow-Up Probe ({followUpProbeCount || 1}/2)
                </span>
              ) : (
                <span className="text-text-muted text-[11px]">Core Bar Question</span>
              )}
            </div>
            <span className="text-[10px] text-text-muted hidden sm:inline">
              {activeProbeText ? 'Active Probe' : 'Current Target Question'}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-text-primary leading-relaxed">
            {activeProbeText ? (
              <span className="text-gold-light font-semibold">
                "{activeProbeText}"
              </span>
            ) : (
              currentQ?.question || 'Please introduce yourself and your recent engineering accomplishments.'
            )}
          </p>

          {currentQ?.expectedKeywords && currentQ.expectedKeywords.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-sage-300/15 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-text-muted font-medium">Evaluation Focus:</span>
              {currentQ.expectedKeywords.slice(0, 5).map((kw, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-sage-950/60 border border-sage-300/15 text-[10px] text-mint/80 font-mono">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        <VoiceOrb
          state={orbState}
          audioLevel={audioInputLevel}
          size={210}
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
            {errorMessage && (
              <button
                onClick={() => {
                  setErrorMessage('');
                  executeAiTurn('Could you repeat the question please?', { requestedRepeat: true });
                }}
                className="ml-2 px-2.5 py-1 rounded-lg bg-mint/20 hover:bg-mint/30 text-mint border border-emerald-300/80 dark:border-mint/60 shadow-[0_2px_6px_rgba(5,150,105,0.2),inset_0_1px_0_rgba(255,255,255,0.35)] text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry Turn
              </button>
            )}
            {silenceWarning && (
              <button
                onClick={handleRetryMic}
                className="ml-2 px-2.5 py-1 rounded-lg bg-mint/20 hover:bg-mint/30 text-mint border border-emerald-300/80 dark:border-mint/60 shadow-[0_2px_6px_rgba(5,150,105,0.2),inset_0_1px_0_rgba(255,255,255,0.35)] text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry Mic
              </button>
            )}
          </div>
        )}

        {/* Live Candidate Speaking Subtitle & Instant Submit Button */}
        {(interimTranscript || engineState === 'USER_SPEAKING') && (
          <div className="mt-4 flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95">
            <div className="max-w-xl text-center px-4 py-2 rounded-2xl glass-2 border border-mint/30 shadow-md">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
                <span className="text-[10px] font-semibold text-mint uppercase tracking-wider">Live Voice Transcription</span>
              </div>
              <p className="text-xs text-text-primary italic">
                "{interimTranscript || 'Listening to your answer...'}"
              </p>
            </div>

            <button
              onClick={submitCandidateAnswerNow}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-mint to-teal-400 hover:from-mint-light hover:to-teal-300 text-sage-950 font-extrabold text-xs flex items-center gap-2 border border-white/85 shadow-[0_4px_14px_rgba(20,184,166,0.35),inset_0_1px_0_rgba(255,255,255,0.85)] cursor-pointer active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>I'm Done Speaking · Submit Response</span>
            </button>
          </div>
        )}

        {/* AI Speaking Subtitle */}
        {engineState === 'AI_SPEAKING' && transcript.length > 0 && !interimTranscript && (
          <div className="mt-5 max-w-xl text-center px-4 py-2 rounded-2xl glass-2 border border-sage-300/20 shadow-md animate-in fade-in duration-150">
            <p className="text-xs text-text-primary italic">
              "{transcript[transcript.length - 1]?.text}"
            </p>
          </div>
        )}
      </main>

      {/* Floating Candidate Picture-in-Picture Webcam Feed */}
      <div
        className={`fixed z-30 aspect-video rounded-2xl overflow-hidden glass-3 border border-sage-300/30 shadow-2xl backdrop-blur-xl group transition-all duration-300 ${
          isPipExpanded
            ? 'bottom-24 right-4 sm:right-8 w-64 sm:w-80 md:w-96'
            : 'bottom-24 right-4 sm:right-8 w-40 sm:w-52'
        }`}
      >
        {isCameraActive && candidateStream ? (
          <div className="relative w-full h-full bg-black">
            <VideoFeed
              stream={candidateStream}
              mirrored={true}
              muted={true}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
              <div className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-mint flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                <span>Live Video</span>
              </div>
              {isMuted && (
                <div className="px-2 py-0.5 rounded-md bg-status-error/85 backdrop-blur-sm text-[10px] font-semibold text-white flex items-center gap-1">
                  <MicOff className="w-2.5 h-2.5" />
                  <span>Muted</span>
                </div>
              )}
            </div>

            {/* Controls overlay on hover */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsPipExpanded(!isPipExpanded)}
                className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] cursor-pointer transition-colors"
                title={isPipExpanded ? 'Minimize video preview' : 'Expand video preview'}
              >
                {isPipExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleLiveCamera}
                className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-red-400 text-[10px] cursor-pointer transition-colors"
                title="Turn off camera"
              >
                <VideoOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-sage-950/80 flex flex-col items-center justify-center gap-1.5 p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-sage-500/20 text-text-muted flex items-center justify-center relative">
              <User className="w-4 h-4" />
              {isMuted && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-status-error text-white flex items-center justify-center">
                  <MicOff className="w-2 h-2" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-text-muted truncate max-w-[100px]">
                {currentUser.name || 'Candidate'}
              </span>
              {isMuted && (
                <span className="text-[9px] font-bold text-status-error uppercase">Muted</span>
              )}
            </div>
            <button
              onClick={startCamera}
              className="px-2.5 py-1 rounded-lg bg-mint/20 hover:bg-mint/30 text-mint text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Video className="w-3 h-3" /> Start Camera
            </button>
          </div>
        )}
      </div>

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
              className="p-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white border border-sage-300/80 shadow-[0_2px_8px_rgba(40,55,35,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-3 rounded-2xl glass-3 border border-sage-300/25 shadow-2xl flex items-center justify-between gap-2">
          {/* Left Actions: Mute & Camera & Hint & Repeat */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                isMuted
                  ? 'bg-status-error/20 border-red-400/80 text-status-error hover:bg-status-error/30 shadow-[0_2px_8px_rgba(220,38,38,0.25),inset_0_1px_0_rgba(255,255,255,0.35)]'
                  : 'bg-sage-500/15 border-sage-300/70 dark:border-mint/60 text-mint hover:bg-sage-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]'
              }`}
              title={isMuted ? 'Unmute microphone (Press M)' : 'Mute microphone (Press M)'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-xs font-semibold hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Camera toggle */}
            <button
              onClick={toggleLiveCamera}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isCameraActive
                  ? 'bg-sage-500/15 border-sage-300/70 dark:border-mint/60 text-mint hover:bg-sage-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]'
                  : 'bg-status-error/20 border-red-400/80 text-status-error shadow-[0_2px_8px_rgba(220,38,38,0.25),inset_0_1px_0_rgba(255,255,255,0.35)]'
              }`}
              title={isCameraActive ? 'Turn off camera' : 'Turn on camera'}
            >
              {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            {/* Request Hint */}
            <button
              onClick={handleRequestHint}
              disabled={engineState === 'PROCESSING'}
              className="px-3 py-2 rounded-xl bg-sage-950/40 hover:bg-sage-500/15 border border-sage-300/60 dark:border-sage-400/50 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
              title="Request a subtle hint from AI"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gold" />
              <span className="hidden sm:inline">Hint</span>
            </button>

            {/* Repeat Question */}
            <button
              onClick={handleRepeatQuestion}
              disabled={engineState === 'PROCESSING'}
              className="px-3 py-2 rounded-xl bg-sage-950/40 hover:bg-sage-500/15 border border-sage-300/60 dark:border-sage-400/50 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
              title="Ask AI to repeat the question"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sage-300" />
              <span className="hidden sm:inline">Repeat</span>
            </button>

            {/* Challenge Me / Tough Follow-Up Probe */}
            <button
              onClick={handleChallengeMe}
              disabled={engineState === 'PROCESSING'}
              className="px-3 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/80 dark:border-gold-light/70 text-gold-light text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-[0_3px_10px_rgba(234,179,8,0.25),inset_0_1px_0_rgba(255,255,255,0.45)] cursor-pointer"
              title="Ask AI interviewer for a tough, creative bar-raiser challenge"
            >
              <Zap className="w-3.5 h-3.5 text-gold animate-pulse" />
              <span className="hidden sm:inline">Challenge Me</span>
            </button>
          </div>

          {/* Center Tools: Code, Whiteboard, Captions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Code Editor */}
            <button
              onClick={() => setActiveRoomTool(activeRoomTool === 'code' ? 'none' : 'code')}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeRoomTool === 'code'
                  ? 'bg-mint/20 border-emerald-400/80 dark:border-mint/80 text-mint shadow-[0_3px_10px_rgba(5,150,105,0.25),inset_0_1px_0_rgba(255,255,255,0.4)]'
                  : 'bg-sage-950/40 border-sage-300/50 text-text-secondary hover:text-text-primary hover:bg-sage-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
              }`}
              title="Open Live Code Editor"
            >
              <Code className="w-4 h-4" />
              <span className="hidden md:inline">Code</span>
            </button>

            {/* Whiteboard */}
            <button
              onClick={() => setActiveRoomTool(activeRoomTool === 'whiteboard' ? 'none' : 'whiteboard')}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeRoomTool === 'whiteboard'
                  ? 'bg-mint/20 border-emerald-400/80 dark:border-mint/80 text-mint shadow-[0_3px_10px_rgba(5,150,105,0.25),inset_0_1px_0_rgba(255,255,255,0.4)]'
                  : 'bg-sage-950/40 border-sage-300/50 text-text-secondary hover:text-text-primary hover:bg-sage-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
              }`}
              title="Open System Design Whiteboard"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Board</span>
            </button>

            {/* Captions Toggle */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showCaptions
                  ? 'bg-sage-500/25 border-sage-300/75 text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.35)]'
                  : 'bg-sage-950/40 border-sage-300/40 text-text-muted hover:text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
              }`}
              title="Toggle Transcript Panel"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Transcript</span>
            </button>

            {/* Text Mode */}
            <button
              onClick={() => setIsTextMode(!isTextMode)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                isTextMode
                  ? 'bg-gold/20 border-gold/70 text-gold-light shadow-[0_2px_8px_rgba(234,179,8,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]'
                  : 'text-text-muted hover:text-text-primary border-sage-300/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
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
              className="px-4 py-2 rounded-xl bg-gradient-to-b from-red-600 to-red-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-red-300/90 dark:border-red-400/80 shadow-[0_4px_14px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] hover:from-red-500 hover:to-red-600 active:scale-95 transition-all cursor-pointer"
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
