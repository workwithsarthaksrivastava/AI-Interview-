export type UserRole = 'candidate' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
  resumeId?: string;
  targetCompany?: string;
  targetRole?: string;
}

export interface ParsedResume {
  name: string;
  email?: string;
  phone?: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
  certifications: string[];
  yearsOfExperience: number;
  seniorityEstimate: 'Fresher' | 'Junior' | 'Mid-Level' | 'Senior' | 'Lead';
  strengthScore: number; // 0-100
  improvementTips: string[];
  recommendedRoles: {
    roleId: string;
    roleTitle: string;
    matchPercentage: number;
    reason: string;
  }[];
}

export interface ResumeDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  parsedData: ParsedResume;
}

export interface CompanyPersona {
  focusAreas: string[];
  difficulty: 'Fresher' | 'Mid' | 'Senior';
  tone: 'Friendly & Conversational' | 'Rigorous & Technical' | 'Fast-Paced & Metric-Driven' | 'Analytical & Academic';
  typicalQuestionStyles: string[];
  coreValues: string[];
  hiringBarCriteria: string[];
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  hiringStyle: string;
  typicalRounds: string[];
  personaProfile: CompanyPersona;
  active: boolean;
}

export interface Role {
  id: string;
  companyIds: string[]; // which companies have this role or 'all'
  title: string;
  department: string;
  skills: string[];
  difficultyLevels: ('Fresher' | 'Mid' | 'Senior')[];
  description: string;
  active: boolean;
}

export type InterviewType = 'Technical' | 'HR' | 'Behavioral' | 'System Design' | 'Mixed';
export type InterviewDifficulty = 'Fresher' | 'Mid' | 'Senior';
export type InterviewLanguage = 'English' | 'Hindi' | 'Hinglish';
export type InterviewStatus = 'scheduled' | 'lobby' | 'live' | 'evaluating' | 'completed' | 'cancelled' | 'no_show';

export interface QuestionItem {
  id: string;
  roleId: string;
  companyId: string;
  type: InterviewType;
  difficulty: InterviewDifficulty;
  text: string;
  idealAnswer: string;
  tags: string[];
  active: boolean;
}

export interface InterviewPlanQuestion {
  id: string;
  category: string;
  question: string;
  contextOrRationale: string;
  suggestedDurationSeconds: number;
  rubricCriteria: string[];
  expectedKeywords: string[];
}

export interface InterviewPlan {
  interviewId: string;
  overview: string;
  candidateName: string;
  companyName: string;
  roleTitle: string;
  warmupIntro: string;
  questions: InterviewPlanQuestion[];
  closingQuestion: string;
}

export interface TranscriptTurn {
  id: string;
  speaker: 'ai' | 'candidate';
  text: string;
  timestamp: string;
  secondsFromStart?: number;
  questionIndex?: number;
  fillerWords?: string[];
  paceWpm?: number;
}

export interface InterviewSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyId: string;
  companyName: string;
  roleId: string;
  roleTitle: string;
  type: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: number;
  language: InterviewLanguage;
  status: InterviewStatus;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  plan?: InterviewPlan;
  transcript: TranscriptTurn[];
  codeSnippets?: { language: string; code: string; lastUpdated: string };
  whiteboardNotes?: string;
  reportId?: string;
  deviceCheckCompleted?: boolean;
}

export interface QuestionEvaluation {
  questionNumber: number;
  category: string;
  questionText: string;
  candidateAnswerExcerpt: string;
  scoreOutOf10: number;
  whatWasGood: string;
  whatWasMissing: string;
  mistakesOrErrors: string;
  idealModelAnswer: string;
  followUpAsked?: string;
  followUpHandling?: string;
  timeTakenSeconds: number;
  transcriptTimestamp: string;
}

export interface SpeechAnalytics {
  overallWpm: number;
  paceConsistency: 'Too Slow' | 'Well-Paced & Clear' | 'Fast & Rushed' | 'Inconsistent';
  fillerWordsCount: number;
  fillerWordsBreakdown: { word: string; count: number }[];
  fillerWordTimeline: { minute: number; count: number }[];
  longPausesCount: number;
  averageResponseLatencySeconds: number;
  interruptionsCount: number;
  talkToListenRatioPercent: number; // Candidate talk % vs AI
  clarityScore: number; // 0-100
  toneAndEnergyTimeline: { minute: number; energy: number; confidence: number }[];
  languageQuality: {
    grammarIssues: string[];
    repeatedPhrases: string[];
    strongPhrases: string[];
    weakPhrasesToReplace: { weak: string; replacement: string }[];
  };
}

export interface BehaviorAnalytics {
  eyeContactPercentage?: number;
  postureStability?: 'Solid & Upright' | 'Moderate Movement' | 'Restless';
  facialEngagement?: 'High & Expressive' | 'Neutral & Composed' | 'Low';
  distractionEventsCount?: number;
  analyzed: boolean;
}

export interface EvaluationReport {
  id: string;
  interviewId: string;
  candidateName: string;
  companyName: string;
  roleTitle: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  date: string;
  durationMinutes: number;
  overallScore: number; // 0-100
  gradeBand: 'Needs Work' | 'Developing' | 'Good' | 'Strong' | 'Outstanding';
  hireReadinessVerdict: 'Strong Hire' | 'Lean Hire' | 'Borderline / Follow-up Needed' | 'Do Not Hire';
  executiveSummary: string;
  
  categoryScores: {
    category: string;
    score: number; // 0-100
    benchmark: number; // typical company average
    justification: string;
  }[];

  questionsBreakdown: QuestionEvaluation[];
  speechAnalytics: SpeechAnalytics;
  behaviorAnalytics: BehaviorAnalytics;

  psychologicalObservations: {
    handlingPressure: string;
    honestyVsBluffing: string;
    recoveryAfterMistakes: string;
    curiosityAndQuestionsAsked: string;
  };

  timelineEvents: {
    minute: number;
    questionNumber: number;
    score: number;
    confidence: number;
    paceWpm: number;
    eventNote?: string;
  }[];

  topStrengths: { title: string; evidenceQuote: string; impact: string }[];
  topWeaknesses: { title: string; evidenceQuote: string; remediation: string }[];
  redFlags: { flag: string; excerpt: string; severity: 'Low' | 'Medium' | 'High' }[];

  companySpecificInsights: {
    barComparison: string;
    likelyToPassRounds: string[];
    likelyToStruggleRounds: string[];
    interviewCultureMatchPercent: number;
  };

  personalizedImprovementPlan: {
    top5PrioritySkillsToFix: string[];
    sevenDaySchedule: { day: string; task: string; timeNeeded: string }[];
    thirtyDaySchedule: { week: string; focus: string; outcome: string }[];
    recommendedResources: { title: string; type: 'Doc' | 'Course' | 'Problem Set'; link: string }[];
    targetedPracticeQuestions: string[];
    quickWinsVsLongTerm: { quickWins: string[]; longTerm: string[] };
  };

  progressComparison?: {
    previousScore?: number;
    scoreChangeDelta?: number;
    improvedCategories?: string[];
    declinedCategories?: string[];
    repeatedMistakes?: string[];
  };

  appendix: {
    fullTranscript: TranscriptTurn[];
    codeSubmissions?: string;
    parsedResumeSkillsSnapshot: string[];
    scoringRubricNotes: string;
  };

  shareToken?: string;
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  capacityPerSlot: number;
}

export interface AdminSettings {
  aiModel: string;
  aiVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  voiceProvider: VoiceProviderType;
  deepgramVoice: DeepgramAuraVoice;
  deepgramSttLanguage: 'en' | 'hi' | 'multi';
  deepgramCreditLimit: number;
  autoSwitchOnLowCredit: boolean;
  temperature: number;
  strictnessLevel: 'Friendly & Lenient' | 'Standard Industry Bar' | 'FAANG Strict';
  maxInterviewDurationMinutes: number;
  enabledLanguages: InterviewLanguage[];
  featureFlags: {
    enableWebcam: boolean;
    enableCodeEditor: boolean;
    enableWhiteboard: boolean;
    enableScheduling: boolean;
  };
  systemPrompts: {
    interviewIntro: string;
    evaluatorSystemPrompt: string;
    sampleMicCheckPrompt: string;
  };
  promptVersion: number;
}

export type VoiceProviderType = 'deepgram-agent' | 'deepgram-cascaded' | 'web-speech';

export type DeepgramAuraVoice =
  | 'aura-asteria-en'
  | 'aura-luna-en'
  | 'aura-stella-en'
  | 'aura-athena-en'
  | 'aura-hera-en'
  | 'aura-orion-en'
  | 'aura-arcas-en'
  | 'aura-perseus-en'
  | 'aura-zeus-en';

export interface VoiceSessionConfig {
  candidateName: string;
  companyName: string;
  roleTitle: string;
  difficulty: InterviewDifficulty;
  interviewType: InterviewType;
  language: InterviewLanguage;
  sttLanguage: 'en' | 'hi' | 'multi';
  plan: InterviewPlan | null;
  resumeSummary?: string;
  voice: DeepgramAuraVoice;
  provider: VoiceProviderType;
  durationMinutes: number;
}

export interface DeepgramCreditStatus {
  totalGrantedDollars: number;
  totalConsumedDollars: number;
  remainingDollars: number;
  percentUsed: number;
  alertAt80: boolean;
  totalMinutesLogged: number;
  estimatedInterviewsLeft: number;
  autoSwitchedToCascaded: boolean;
  statusMessage: string;
}

export interface VoiceProviderEvents {
  onTranscript: (event: {
    speaker: 'ai' | 'candidate';
    text: string;
    isFinal: boolean;
    confidence?: number;
    words?: { word: string; start: number; end: number; confidence: number }[];
  }) => void;
  onError: (error: Error | string, code?: number) => void;
  onStateChange: (state: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  onAudioLevel: (level: number) => void;
  onBargeIn?: () => void;
  onProviderFallback?: (from: VoiceProviderType, to: VoiceProviderType, reason: string) => void;
}

export interface VoiceProvider {
  readonly name: VoiceProviderType;
  start(config: VoiceSessionConfig, events: VoiceProviderEvents): Promise<void>;
  stop(): Promise<void>;
  sendText(text: string): Promise<void>;
  updateSessionPrompt?(update: {
    timeRemainingMinutes?: number;
    nextQuestionIndex?: number;
    customInstruction?: string;
  }): Promise<void>;
  interrupt(): void;
}
