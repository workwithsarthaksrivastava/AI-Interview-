import { GoogleGenAI } from '@google/genai';
import {
  SEED_COMPANIES,
  SEED_ROLES,
  SEED_QUESTIONS,
  DEFAULT_ADMIN_SETTINGS,
  SEED_AVAILABILITY,
  DEMO_CANDIDATE_RESUME,
  DEMO_EVALUATION_REPORT
} from '../data/seedData.js';
import {
  Company,
  Role,
  QuestionItem,
  InterviewSession,
  EvaluationReport,
  AdminSettings,
  AvailabilitySlot,
  User
} from '../types/index.js';

// Dynamic Gemini SDK client
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey.trim()) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// In-Memory Persistent Store
export const db = {
  users: [
    {
      uid: 'candidate-demo-1',
      name: 'Sarthak Srivastava',
      email: 'sarthaksrivastava1084@gmail.com',
      role: 'candidate',
      createdAt: new Date().toISOString(),
      targetCompany: 'google',
      targetRole: 'sde-2'
    },
    {
      uid: 'admin-demo-1',
      name: 'Elena Rostova (Admin)',
      email: 'admin@interviewiq.ai',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ] as User[],
  companies: [...SEED_COMPANIES] as Company[],
  roles: [...SEED_ROLES] as Role[],
  questions: [...SEED_QUESTIONS] as QuestionItem[],
  availability: [...SEED_AVAILABILITY] as AvailabilitySlot[],
  settings: { ...DEFAULT_ADMIN_SETTINGS } as AdminSettings,
  interviews: [] as InterviewSession[],
  reports: [DEMO_EVALUATION_REPORT] as EvaluationReport[],
  creditStatus: {
    totalGrantedDollars: 200.0,
    totalConsumedDollars: 18.60,
    remainingDollars: 181.40,
    percentUsed: 9.3,
    alertAt80: false,
    totalMinutesLogged: 412,
    estimatedInterviewsLeft: 120,
    autoSwitchedToCascaded: false,
    statusMessage: 'Deepgram credit healthy. Voice Agent API operational.'
  },
  auditLogs: [
    { id: 'log-1', timestamp: new Date().toISOString(), action: 'SYSTEM_BOOT', details: 'InterviewIQ initialized with Deepgram Voice architecture.' }
  ]
};

// Credit Tracking Helper
export function recordDeepgramUsage(minutes: number, provider: string) {
  let costPerMin = 0.045; // Voice Agent
  if (provider === 'deepgram-cascaded') costPerMin = 0.019; // Nova-3 STT + Aura TTS
  else if (provider === 'web-speech') costPerMin = 0;

  const cost = minutes * costPerMin;
  db.creditStatus.totalMinutesLogged += minutes;
  db.creditStatus.totalConsumedDollars = Number((db.creditStatus.totalConsumedDollars + cost).toFixed(2));
  db.creditStatus.remainingDollars = Number(Math.max(0, db.creditStatus.totalGrantedDollars - db.creditStatus.totalConsumedDollars).toFixed(2));
  db.creditStatus.percentUsed = Number(((db.creditStatus.totalConsumedDollars / db.creditStatus.totalGrantedDollars) * 100).toFixed(1));

  // Alert at 80% credit used
  if (db.creditStatus.percentUsed >= 80) {
    db.creditStatus.alertAt80 = true;
    db.creditStatus.statusMessage = 'Warning: Over 80% Deepgram credit utilized!';
    logAudit('DEEPGRAM_CREDIT_ALERT', `Deepgram credit used has reached ${db.creditStatus.percentUsed}%`);
  }

  // Auto-switch to cheaper Cascaded or WebSpeech if credit is low
  if (db.settings.autoSwitchOnLowCredit && db.creditStatus.remainingDollars <= 25) {
    if (db.settings.voiceProvider === 'deepgram-agent') {
      db.settings.voiceProvider = 'deepgram-cascaded';
      db.creditStatus.autoSwitchedToCascaded = true;
      db.creditStatus.statusMessage = 'Auto-switched from Voice Agent to Cascaded mode to preserve Deepgram credit.';
      logAudit('DEEPGRAM_AUTO_SWITCH', 'Switched default voice provider to Deepgram Cascaded due to low credit.');
    }
  }
  if (db.settings.autoSwitchOnLowCredit && db.creditStatus.remainingDollars <= 5) {
    db.settings.voiceProvider = 'web-speech';
    db.creditStatus.statusMessage = 'Deepgram credit nearly exhausted. Switched to free Web Speech fallback.';
    logAudit('DEEPGRAM_AUTO_SWITCH', 'Switched default voice provider to Web Speech due to low credit.');
  }

  const avgCostPerInterview = provider === 'deepgram-cascaded' ? 0.38 : 0.90;
  db.creditStatus.estimatedInterviewsLeft = Math.floor(db.creditStatus.remainingDollars / avgCostPerInterview);
}

// Deepgram Aura TTS Synthesis Helper
export async function synthesizeDeepgramAura(text: string, voice?: string): Promise<{ audioBase64: string | null; format: string }> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) return { audioBase64: null, format: 'none' };

  try {
    const selectedVoice = voice || db.settings.deepgramVoice || 'aura-asteria-en';
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${selectedVoice}&encoding=mp3`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(1800)
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 429) {
        db.creditStatus.alertAt80 = true;
        if (db.settings.autoSwitchOnLowCredit) {
          db.settings.voiceProvider = 'web-speech';
        }
      }
      return { audioBase64: null, format: 'none' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    recordDeepgramUsage(0.08, 'deepgram-cascaded');
    return { audioBase64: base64, format: 'audio/mp3' };
  } catch (err) {
    console.warn('Deepgram Aura TTS error:', err);
    return { audioBase64: null, format: 'none' };
  }
}

// Helper logger
export function logAudit(action: string, details: string) {
  db.auditLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    details
  });
  if (db.auditLogs.length > 200) db.auditLogs.pop();
}
