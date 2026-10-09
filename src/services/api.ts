import {
  ParsedResume,
  InterviewPlan,
  InterviewSession,
  EvaluationReport,
  Company,
  Role,
  QuestionItem,
  AdminSettings,
  AvailabilitySlot,
  User
} from '../types';

export const api = {
  // Resume Parsing
  async parseResume(resumeText: string, fileName?: string): Promise<ParsedResume> {
    const res = await fetch('/api/resume/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, fileName })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to parse resume');
    return json.data;
  },

  // Plan Generation
  async generateInterviewPlan(params: {
    candidateName: string;
    companyId: string;
    roleId: string;
    difficulty: string;
    interviewType: string;
    language: string;
    durationMinutes: number;
    skills: string[];
  }): Promise<InterviewPlan> {
    const res = await fetch('/api/interview/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to generate plan');
    return json.plan;
  },

  // Mic Calibration Question & Voice Check
  async checkMicQuestion(candidateName: string): Promise<{ questionText: string; audioBase64: string | null; audioFormat?: string }> {
    const res = await fetch('/api/interview/mic-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateName })
    });
    const json = await res.json();
    return json;
  },

  // Transcribe recorded audio with Deepgram / Gemini Flash
  async transcribeAudio(params: {
    audioBase64: string;
    mimeType?: string;
    language?: string;
    candidateName?: string;
  }): Promise<{ success: boolean; transcript: string; clarity?: number; source?: string }> {
    const res = await fetch('/api/audio/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  // Live Interview Speech Turn
  async sendSpeechTurn(payload: {
    candidateName: string;
    companyName: string;
    roleTitle: string;
    difficulty: string;
    interviewType: string;
    language: string;
    plan: InterviewPlan | null;
    transcriptHistory: any[];
    candidateMessage: string;
    candidateCode?: string;
    currentQuestionIndex: number;
    userRequestedHint?: boolean;
    userRequestedRepeat?: boolean;
    silentSeconds?: number;
  }): Promise<{
    aiResponseText: string;
    audioBase64: string | null;
    fillerWordsFound: string[];
    wordCount: number;
    advanceQuestion: boolean;
  }> {
    const res = await fetch('/api/interview/speech-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Speech turn failed');
    return json;
  },

  // Comprehensive Evaluation Report
  async evaluateInterview(payload: {
    interviewId: string;
    candidateName: string;
    companyName: string;
    roleTitle: string;
    interviewType: string;
    difficulty: string;
    durationMinutes: number;
    transcript: any[];
    codeSnippets?: any;
    whiteboardNotes?: string;
    behaviorStats?: any;
    resumeSkills: string[];
  }): Promise<EvaluationReport> {
    const res = await fetch('/api/interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Evaluation failed');
    return json.report;
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    const res = await fetch('/api/companies');
    const json = await res.json();
    return json.companies || [];
  },

  async createCompany(company: Partial<Company>): Promise<Company> {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    const json = await res.json();
    return json.company;
  },

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const res = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.company;
  },

  // Roles
  async getRoles(companyId?: string): Promise<Role[]> {
    const url = companyId ? `/api/roles?companyId=${companyId}` : '/api/roles';
    const res = await fetch(url);
    const json = await res.json();
    return json.roles || [];
  },

  async createRole(role: Partial<Role>): Promise<Role> {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role)
    });
    const json = await res.json();
    return json.role;
  },

  // Question Bank
  async getQuestions(filters?: { roleId?: string; companyId?: string; type?: string; difficulty?: string }): Promise<QuestionItem[]> {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`/api/questions?${params.toString()}`);
    const json = await res.json();
    return json.questions || [];
  },

  async createQuestion(question: Partial<QuestionItem>): Promise<QuestionItem> {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    });
    const json = await res.json();
    return json.question;
  },

  async bulkImportQuestions(items: Partial<QuestionItem>[]): Promise<number> {
    const res = await fetch('/api/questions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const json = await res.json();
    return json.count;
  },

  async aiGenerateQuestions(params: { roleTitle: string; companyName: string; count: number; difficulty: string }): Promise<QuestionItem[]> {
    const res = await fetch('/api/questions/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    return json.questions || [];
  },

  // Interviews
  async getInterviews(userId?: string): Promise<InterviewSession[]> {
    const url = userId ? `/api/interviews?userId=${userId}` : '/api/interviews';
    const res = await fetch(url);
    const json = await res.json();
    return json.interviews || [];
  },

  async createInterview(session: Partial<InterviewSession>): Promise<InterviewSession> {
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    const json = await res.json();
    return json.interview;
  },

  async updateInterview(id: string, updates: Partial<InterviewSession>): Promise<InterviewSession> {
    const res = await fetch(`/api/interviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.interview;
  },

  // Reports
  async getReports(): Promise<EvaluationReport[]> {
    const res = await fetch('/api/reports');
    const json = await res.json();
    return json.reports || [];
  },

  async getReport(id: string): Promise<EvaluationReport> {
    const res = await fetch(`/api/reports/${id}`);
    const json = await res.json();
    return json.report;
  },

  // Settings & Prompts
  async getSettings(): Promise<AdminSettings> {
    const res = await fetch('/api/settings');
    const json = await res.json();
    return json.settings;
  },

  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    return json.settings;
  },

  // Availability
  async getAvailability(): Promise<AvailabilitySlot[]> {
    const res = await fetch('/api/availability');
    const json = await res.json();
    return json.slots || [];
  },

  // Audit Logs
  async getAuditLogs(): Promise<{ id: string; timestamp: string; action: string; details: string }[]> {
    const res = await fetch('/api/audit-logs');
    const json = await res.json();
    return json.logs || [];
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    const json = await res.json();
    return json.users || [];
  },

  // Deepgram Scoped Token & Credit Protection
  async getDeepgramToken(): Promise<{
    hasKey: boolean;
    token?: string;
    provider: string;
    auraVoice?: string;
    sttLanguage?: string;
    creditRemaining?: number;
    message?: string;
  }> {
    const res = await fetch('/api/deepgram/token', { method: 'POST' });
    return res.json();
  },

  async getDeepgramCredit(): Promise<{
    credit: any;
    activeProvider: string;
  }> {
    const res = await fetch('/api/deepgram/credit');
    const json = await res.json();
    return json;
  },

  async logDeepgramUsage(
    paramsOrMinutes: { minutes: number; provider: string; interviewId?: string } | number,
    provider?: string,
    interviewId?: string
  ): Promise<any> {
    const payload =
      typeof paramsOrMinutes === 'number'
        ? { minutes: paramsOrMinutes, provider: provider || 'deepgram-cascaded', interviewId }
        : paramsOrMinutes;
    const res = await fetch('/api/deepgram/log-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async synthesizeDeepgramTts(text: string, voice?: string): Promise<{
    audioBase64: string | null;
    format?: string;
  }> {
    try {
      const res = await fetch('/api/deepgram/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
      return await res.json();
    } catch {
      return { audioBase64: null };
    }
  }
};
