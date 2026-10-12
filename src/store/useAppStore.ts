import { create } from 'zustand';
import {
  User,
  Company,
  Role,
  ParsedResume,
  InterviewType,
  InterviewDifficulty,
  InterviewLanguage,
  InterviewPlan,
  TranscriptTurn,
  InterviewSession,
  EvaluationReport,
  VoiceProviderType,
  DeepgramAuraVoice,
  DeepgramCreditStatus
} from '../types';
import { SEED_COMPANIES, SEED_ROLES } from '../data/seedData';
import { auth, loginWithGoogle, logoutUser } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { syncUserProfileToFirestore } from '../services/firestoreData';
import { isUserAdmin, ADMIN_EMAIL } from '../utils/authGuards';

export type AppView =
  | 'login'
  | 'landing'
  | 'wizard'
  | 'lobby'
  | 'interview'
  | 'evaluating'
  | 'report'
  | 'admin'
  | 'candidate-dashboard';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface AppState {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  adminTab: 'dashboard' | 'companies' | 'roles' | 'questions' | 'interviews' | 'scheduling' | 'ai-settings' | 'moderation' | 'docs';
  setAdminTab: (tab: AppState['adminTab']) => void;

  // Authentication & Role
  currentUser: User;
  firebaseUser: FirebaseUser | null;
  isFirebaseAuthLoading: boolean;
  switchUserRole: (role: 'candidate' | 'admin') => void;
  loginWithGoogleAction: () => Promise<void>;
  logoutAction: () => Promise<void>;

  // Accessibility & Theme
  isDark: boolean;
  toggleTheme: () => void;
  reduceTransparency: boolean;
  toggleReduceTransparency: () => void;

  // Candidate Wizard State (Steps 1 to 5)
  wizardStep: number;
  setWizardStep: (step: number) => void;

  // Step 1: Resume
  parsedResume: ParsedResume | null;
  setParsedResume: (resume: ParsedResume | null) => void;
  isParsingResume: boolean;
  setIsParsingResume: (val: boolean) => void;

  // Step 2 & 3: Company, Role & Settings
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  selectedRole: Role | null;
  setSelectedRole: (role: Role | null) => void;
  interviewType: InterviewType;
  setInterviewType: (t: InterviewType) => void;
  difficulty: InterviewDifficulty;
  setDifficulty: (d: InterviewDifficulty) => void;
  durationMinutes: number;
  setDurationMinutes: (m: number) => void;
  language: InterviewLanguage;
  setLanguage: (l: InterviewLanguage) => void;

  // Voice Provider & Deepgram Config
  voiceProvider: VoiceProviderType;
  setVoiceProvider: (p: VoiceProviderType) => void;
  deepgramVoice: DeepgramAuraVoice;
  setDeepgramVoice: (v: DeepgramAuraVoice) => void;
  sttLanguage: 'en' | 'hi' | 'multi';
  setSttLanguage: (l: 'en' | 'hi' | 'multi') => void;
  deepgramCredit: DeepgramCreditStatus | null;
  setDeepgramCredit: (c: DeepgramCreditStatus | null) => void;
  creditStatus: DeepgramCreditStatus | null;
  setCreditStatus: (c: DeepgramCreditStatus | null) => void;

  // Step 4: Scheduling
  scheduleMode: 'now' | 'later';
  setScheduleMode: (m: 'now' | 'later') => void;
  scheduledDate: string;
  setScheduledDate: (d: string) => void;
  scheduledSlot: string;
  setScheduledSlot: (s: string) => void;
  timezone: string;
  setTimezone: (tz: string) => void;

  // Step 5: Lobby & Calibration
  micPermissionGranted: boolean;
  setMicPermissionGranted: (val: boolean) => void;
  speakerTestPassed: boolean;
  setSpeakerTestPassed: (val: boolean) => void;
  cameraPreviewEnabled: boolean;
  setCameraPreviewEnabled: (val: boolean) => void;
  sampleTestPassed: boolean;
  setSampleTestPassed: (val: boolean) => void;
  sampleTestClarity: number;
  setSampleTestClarity: (c: number) => void;
  sampleTestNoise: string;
  setSampleTestNoise: (n: string) => void;
  sampleTestLatency: number;
  setSampleTestLatency: (l: number) => void;
  consentGranted: boolean;
  setConsentGranted: (val: boolean) => void;
  resetCalibration: () => void;

  // Live Interview Room State
  activeSession: InterviewSession | null;
  setActiveSession: (s: InterviewSession | null) => void;
  interviewPlan: InterviewPlan | null;
  setInterviewPlan: (p: InterviewPlan | null) => void;
  transcript: TranscriptTurn[];
  addTranscriptTurn: (turn: TranscriptTurn) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (i: number | ((prev: number) => number)) => void;
  
  // Interactive tools in room
  activeRoomTool: 'none' | 'code' | 'whiteboard' | 'transcript';
  setActiveRoomTool: (tool: 'none' | 'code' | 'whiteboard' | 'transcript') => void;
  codeSnippet: string;
  setCodeSnippet: (c: string) => void;
  codeLanguage: string;
  setCodeLanguage: (l: string) => void;
  whiteboardNotes: string;
  setWhiteboardNotes: (n: string) => void;

  // Metrics during call
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  isAiSpeaking: boolean;
  setIsAiSpeaking: (s: boolean) => void;
  isCandidateSpeaking: boolean;
  setIsCandidateSpeaking: (s: boolean) => void;
  isAiThinking: boolean;
  setIsAiThinking: (t: boolean) => void;
  elapsedSeconds: number;
  setElapsedSeconds: (s: number | ((prev: number) => number)) => void;
  fillerWordsTotal: number;
  incrementFillerWords: (count: number) => void;
  currentPaceWpm: number;
  setCurrentPaceWpm: (wpm: number) => void;

  // Evaluation & Report
  currentReport: EvaluationReport | null;
  setCurrentReport: (r: EvaluationReport | null) => void;

  // Notifications
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'login',
  setCurrentView: (view) => {
    const email = get().currentUser.email;
    const admin = isUserAdmin(email);

    if (view === 'admin' && !admin) {
      get().addToast('error', `Access Denied: Only ${ADMIN_EMAIL} can access the Admin Console.`);
      return;
    }
    
    if (view === 'candidate-dashboard' && admin) {
      get().addToast('error', 'Access Denied: Admin cannot view the Candidate Dashboard.');
      return;
    }
    set({ currentView: view });
  },
  adminTab: 'dashboard',
  setAdminTab: (tab) => set({ adminTab: tab }),

  currentUser: {
    uid: 'candidate-demo-1',
    name: 'Candidate User',
    email: 'candidate@shakchhatkar.ai',
    role: 'candidate',
    createdAt: '2026-10-09T10:00:00.000Z',
    targetCompany: 'google',
    targetRole: 'sde-2'
  },
  firebaseUser: null,
  isFirebaseAuthLoading: false,
  switchUserRole: (role) => {
    const activeEmail = get().currentUser.email;
    if (role === 'admin' && !isUserAdmin(activeEmail)) {
      get().addToast('error', `Unauthorized: Only ${ADMIN_EMAIL} can switch to the Admin role.`);
      return;
    }
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        role
      }
    }));
  },
  loginWithGoogleAction: async () => {
    set({ isFirebaseAuthLoading: true });
    try {
      const user = await loginWithGoogle();
      if (user) {
        get().addToast('success', `Signed in as ${user.displayName || user.email}`);
        if (get().currentView === 'login') {
          set({ currentView: 'landing' });
        }
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        get().addToast('error', error.message || 'Google sign-in error');
      }
    } finally {
      set({ isFirebaseAuthLoading: false });
    }
  },
  logoutAction: async () => {
    await logoutUser();
    set({
      firebaseUser: null,
      currentView: 'login',
      currentUser: {
        uid: 'candidate-demo-1',
        name: 'Guest Candidate',
        email: 'guest@shakchhatkar.ai',
        role: 'candidate',
        createdAt: new Date().toISOString()
      }
    });
    get().addToast('info', 'Signed out successfully');
  },

  isDark: true,
  toggleTheme: () => {
    const next = !get().isDark;
    set({ isDark: next });
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-theme');
    }
  },

  reduceTransparency: false,
  toggleReduceTransparency: () => {
    const next = !get().reduceTransparency;
    set({ reduceTransparency: next });
    if (next) {
      document.documentElement.classList.add('reduce-transparency');
    } else {
      document.documentElement.classList.remove('reduce-transparency');
    }
  },

  wizardStep: 1,
  setWizardStep: (step) => set({ wizardStep: step }),

  parsedResume: null,
  setParsedResume: (resume) => set({ parsedResume: resume }),
  isParsingResume: false,
  setIsParsingResume: (val) => set({ isParsingResume: val }),

  selectedCompany: SEED_COMPANIES[0],
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  selectedRole: SEED_ROLES[0],
  setSelectedRole: (role) => set({ selectedRole: role }),

  interviewType: 'Technical',
  setInterviewType: (t) => set({ interviewType: t }),
  difficulty: 'Senior',
  setDifficulty: (d) => set({ difficulty: d }),
  durationMinutes: 30,
  setDurationMinutes: (m) => set({ durationMinutes: m }),
  language: 'English',
  setLanguage: (l) => set({ language: l }),

  voiceProvider: 'deepgram-cascaded',
  setVoiceProvider: (p) => set({ voiceProvider: p }),
  deepgramVoice: 'aura-asteria-en',
  setDeepgramVoice: (v) => set({ deepgramVoice: v }),
  sttLanguage: 'en',
  setSttLanguage: (l) => set({ sttLanguage: l }),
  deepgramCredit: null,
  setDeepgramCredit: (c) => set({ deepgramCredit: c, creditStatus: c }),
  creditStatus: null,
  setCreditStatus: (c) => set({ creditStatus: c, deepgramCredit: c }),

  scheduleMode: 'now',
  setScheduleMode: (m) => set({ scheduleMode: m }),
  scheduledDate: new Date().toISOString().split('T')[0],
  setScheduledDate: (d) => set({ scheduledDate: d }),
  scheduledSlot: '14:00 - 14:30',
  setScheduledSlot: (s) => set({ scheduledSlot: s }),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  setTimezone: (tz) => set({ timezone: tz }),

  micPermissionGranted: false,
  setMicPermissionGranted: (val) => set({ micPermissionGranted: val }),
  speakerTestPassed: false,
  setSpeakerTestPassed: (val) => set({ speakerTestPassed: val }),
  cameraPreviewEnabled: false,
  setCameraPreviewEnabled: (val) => set({ cameraPreviewEnabled: val }),
  sampleTestPassed: false,
  setSampleTestPassed: (val) => set({ sampleTestPassed: val }),
  sampleTestClarity: 0,
  setSampleTestClarity: (c) => set({ sampleTestClarity: c }),
  sampleTestNoise: 'Normal',
  setSampleTestNoise: (n) => set({ sampleTestNoise: n }),
  sampleTestLatency: 0,
  setSampleTestLatency: (l) => set({ sampleTestLatency: l }),
  consentGranted: false,
  setConsentGranted: (val) => set({ consentGranted: val }),
  resetCalibration: () =>
    set({
      micPermissionGranted: false,
      speakerTestPassed: false,
      sampleTestPassed: false,
      sampleTestClarity: 0,
      sampleTestLatency: 0,
      consentGranted: false
    }),

  activeSession: null,
  setActiveSession: (s) => set({ activeSession: s }),
  interviewPlan: null,
  setInterviewPlan: (p) => set({ interviewPlan: p }),
  transcript: [],
  addTranscriptTurn: (turn) => set((state) => ({ transcript: [...state.transcript, turn] })),
  currentQuestionIndex: 0,
  setCurrentQuestionIndex: (i) =>
    set((state) => ({
      currentQuestionIndex: typeof i === 'function' ? i(state.currentQuestionIndex) : i
    })),

  activeRoomTool: 'none',
  setActiveRoomTool: (tool) => set({ activeRoomTool: tool }),
  codeSnippet: `// Type or paste your solution here
function solveProblem(input: number[]): number {
  // Your code here
  return 0;
}`,
  setCodeSnippet: (c) => set({ codeSnippet: c }),
  codeLanguage: 'typescript',
  setCodeLanguage: (l) => set({ codeLanguage: l }),
  whiteboardNotes: '',
  setWhiteboardNotes: (n) => set({ whiteboardNotes: n }),

  isMuted: false,
  setIsMuted: (m) => set({ isMuted: m }),
  isAiSpeaking: false,
  setIsAiSpeaking: (s) => set({ isAiSpeaking: s }),
  isCandidateSpeaking: false,
  setIsCandidateSpeaking: (s) => set({ isCandidateSpeaking: s }),
  isAiThinking: false,
  setIsAiThinking: (t) => set({ isAiThinking: t }),
  elapsedSeconds: 0,
  setElapsedSeconds: (s) =>
    set((state) => ({
      elapsedSeconds: typeof s === 'function' ? s(state.elapsedSeconds) : s
    })),
  fillerWordsTotal: 0,
  incrementFillerWords: (count) =>
    set((state) => ({ fillerWordsTotal: state.fillerWordsTotal + count })),
  currentPaceWpm: 140,
  setCurrentPaceWpm: (wpm) => set({ currentPaceWpm: wpm }),

  currentReport: null,
  setCurrentReport: (r) => set({ currentReport: r }),

  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));

// Initialize auth state listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = isUserAdmin(user.email);
      const updatedUser: User = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Candidate',
        email: user.email || '',
        role: isAdmin ? 'admin' : 'candidate',
        createdAt: user.metadata.creationTime || new Date().toISOString(),
        photoURL: user.photoURL || undefined,
        avatarUrl: user.photoURL || undefined,
      };

      const currentView = useAppStore.getState().currentView;
      const nextView = currentView === 'login'
        ? 'landing'
        : (!isAdmin && currentView === 'admin' ? 'landing' : currentView);

      useAppStore.setState({
        firebaseUser: user,
        currentUser: updatedUser,
        currentView: nextView,
        isFirebaseAuthLoading: false
      });
      syncUserProfileToFirestore(updatedUser).catch(console.warn);
    } else {
      const currentView = useAppStore.getState().currentView;
      const nextView = (currentView === 'admin') ? 'landing' : currentView;

      useAppStore.setState({
        firebaseUser: null,
        currentView: nextView,
        isFirebaseAuthLoading: false
      });
    }
  });
}
