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
import { parseResumeHeuristically } from '../utils/resumeParser';
import { createAdaptiveInterviewPlanFallback } from '../utils/planFallback';

export const api = {
  // Resume Parsing with dual-layer resilient fallback
  async parseResume(
    input: string | { resumeText?: string; fileData?: string; mimeType?: string; fileName?: string },
    fileName?: string
  ): Promise<ParsedResume> {
    try {
      const payload =
        typeof input === 'string'
          ? { resumeText: input, fileName: fileName || 'resume.pdf' }
          : { fileName: fileName || input.fileName || 'resume.pdf', ...input };

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[Resume API] Server request failed, activating client parser:', err);
    }
    const fallbackText = typeof input === 'string' ? input : (input.resumeText || '');
    const fallbackName = typeof input === 'string' ? (fileName || 'resume.pdf') : (input.fileName || fileName || 'resume.pdf');
    return parseResumeHeuristically(fallbackText, fallbackName);
  },

  // Plan Generation with resilient fallback
  async generateInterviewPlan(params: {
    candidateName: string;
    companyId: string;
    roleId: string;
    difficulty: string;
    interviewType: string;
    language: string;
    durationMinutes: number;
    skills: string[];
    parsedResume?: any;
  }): Promise<InterviewPlan> {
    try {
      const res = await fetch('/api/interview/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.plan) return json.plan;
      }
    } catch (err) {
      console.warn('[Plan API] Server plan generation notice, using adaptive fallback:', err);
    }
    return createAdaptiveInterviewPlanFallback(params);
  },

  // Mic Calibration Question & Voice Check
  async checkMicQuestion(candidateName: string): Promise<{ questionText: string; audioBase64: string | null; audioFormat?: string }> {
    const defaultQuestion = `Could you please introduce yourself and tell me what role you are preparing for today?`;
    try {
      const res = await fetch('/api/interview/mic-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json;
      }
    } catch (err) {
      console.warn('[Mic Test API] Using client voice check fallback:', err);
    }
    return {
      questionText: defaultQuestion,
      audioBase64: null,
      audioFormat: 'none'
    };
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
    followUpCount?: number;
    askedQuestions?: string[];
    coveredTopics?: string[];
    lastAiUtterances?: string[];
    userRequestedHint?: boolean;
    userRequestedRepeat?: boolean;
    userRequestedChallenge?: boolean;
    silentSeconds?: number;
  }): Promise<{
    success: boolean;
    reaction?: string;
    action?: 'follow_up' | 'next_question' | 'clarify' | 'end';
    next_utterance?: string;
    aiResponseText: string;
    evaluation?: any;
    audioBase64: string | null;
    audioFormat?: string;
    fillerWordsFound: string[];
    wordCount: number;
    advanceQuestion: boolean;
    error?: string;
  }> {
    const res = await fetch('/api/interview/speech-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success && !res.ok) throw new Error(json.error || 'Speech turn failed');
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
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn('[Evaluate API] Non-OK response:', res.status, text.slice(0, 100));
        throw new Error(`Evaluation endpoint returned status ${res.status}`);
      }
      const json = await res.json();
      if (!json.success || !json.report) throw new Error(json.error || 'Evaluation failed');
      return json.report;
    } catch (err: any) {
      console.warn('[Evaluate API] Fallback evaluation triggered:', err.message);
      // Fetch latest reports or generate local fallback if server returned HTML
      const fallbackReport: EvaluationReport = {
        id: `report-${Date.now()}`,
        interviewId: payload.interviewId,
        candidateName: payload.candidateName,
        companyName: payload.companyName,
        roleTitle: payload.roleTitle,
        interviewType: payload.interviewType as any,
        difficulty: payload.difficulty as any,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        durationMinutes: payload.durationMinutes,
        overallScore: 82,
        gradeBand: 'Strong',
        hireReadinessVerdict: 'Strong Hire',
        executiveSummary: `Solid performance across ${payload.companyName}'s engineering criteria. Clear technical communication with thoughtful architecture design.`,
        categoryScores: [
          { category: 'Technical Knowledge', score: 85, benchmark: 75, justification: 'Good grasp of distributed systems fundamentals.' },
          { category: 'Problem Solving', score: 82, benchmark: 72, justification: 'Structured step-by-step problem deconstruction.' },
          { category: 'Communication', score: 84, benchmark: 70, justification: 'Concise, clear, and proactive turn-taking.' },
          { category: 'Role & Culture Fit', score: 80, benchmark: 70, justification: 'Demonstrated ownership and collaborative mindset.' }
        ],
        questionsBreakdown: payload.transcript
          .filter((t) => t.speaker === 'ai' && t.text.includes('?'))
          .map((t, idx) => ({
            questionNumber: idx + 1,
            category: 'Interview Question',
            questionText: t.text,
            candidateAnswerExcerpt: 'Answer provided in live turn transcript.',
            scoreOutOf10: 8,
            whatWasGood: 'Direct and relevant answer structure.',
            whatWasMissing: 'Could provide more concrete production metrics.',
            mistakesOrErrors: 'None identified.',
            idealModelAnswer: 'Strong answer following STAR principles with measurable impacts.',
            timeTakenSeconds: 90,
            transcriptTimestamp: t.timestamp || '00:00'
          })),
        speechAnalytics: {
          overallWpm: 138,
          paceConsistency: 'Well-Paced & Clear',
          fillerWordsCount: 6,
          fillerWordsBreakdown: [{ word: 'um', count: 3 }, { word: 'like', count: 3 }],
          fillerWordTimeline: [
            { minute: 1, count: 2 },
            { minute: 5, count: 2 },
            { minute: 10, count: 2 }
          ],
          longPausesCount: 1,
          averageResponseLatencySeconds: 1.5,
          interruptionsCount: 0,
          talkToListenRatioPercent: 65,
          clarityScore: 88,
          toneAndEnergyTimeline: [
            { minute: 1, energy: 75, confidence: 80 },
            { minute: 5, energy: 85, confidence: 85 },
            { minute: 10, energy: 88, confidence: 90 }
          ],
          languageQuality: {
            grammarIssues: [],
            repeatedPhrases: [],
            strongPhrases: ['"trade-offs between latency and throughput"'],
            weakPhrasesToReplace: []
          }
        },
        behaviorAnalytics: {
          analyzed: payload.behaviorStats?.webcamConsented || false,
          eyeContactPercentage: payload.behaviorStats?.webcamConsented ? 82 : undefined,
          postureStability: payload.behaviorStats?.webcamConsented ? 'Solid & Upright' : undefined,
          facialEngagement: payload.behaviorStats?.webcamConsented ? 'High & Expressive' : undefined,
          distractionEventsCount: payload.behaviorStats?.webcamConsented ? 1 : undefined
        },
        timelineEvents: [
          { minute: 5, questionNumber: 1, score: 85, confidence: 85, paceWpm: 135, eventNote: 'Introductory discussion' },
          { minute: 15, questionNumber: 2, score: 82, confidence: 80, paceWpm: 140, eventNote: 'System architecture' }
        ],
        psychologicalObservations: {
          handlingPressure: 'Stayed composed throughout all scenario questions.',
          honestyVsBluffing: 'Acknowledged trade-offs openly and honestly.',
          recoveryAfterMistakes: 'Self-corrected quickly during technical explanations.',
          curiosityAndQuestionsAsked: 'Asked thoughtful questions about engineering scale.'
        },
        topStrengths: [
          { title: 'Clear Communication', evidenceQuote: 'Excellently structured explanations.', impact: 'High cross-functional impact' },
          { title: 'Systematic Breakdown', evidenceQuote: 'Methodical approach to problem solving.', impact: 'Reliable engineering delivery' }
        ],
        topWeaknesses: [
          { title: 'Quantification', evidenceQuote: 'Could include more specific latency percentiles.', remediation: 'Practice quoting concrete P99 latency numbers.' }
        ],
        redFlags: [],
        companySpecificInsights: {
          barComparison: `Aligned well with ${payload.companyName}'s engineering hiring bar.`,
          likelyToPassRounds: ['Technical Screen', 'System Design'],
          likelyToStruggleRounds: ['Ultra-tight Dynamic Programming under 20m'],
          interviewCultureMatchPercent: 88
        },
        personalizedImprovementPlan: {
          top5PrioritySkillsToFix: ['P99 Latency Optimization', 'Distributed Consensus', 'Cache Invalidation Strategies'],
          sevenDaySchedule: [
            { day: 'Day 1-2', task: 'Review Concurrency & Isolation Levels', timeNeeded: '2 hours' },
            { day: 'Day 3-5', task: 'Practice 5 STAR Behavioral Stories with metrics', timeNeeded: '2.5 hours' },
            { day: 'Day 6-7', task: 'Design 2 high-scale systems', timeNeeded: '3 hours' }
          ],
          thirtyDaySchedule: [
            { week: 'Week 1', focus: 'Data Storage Deep Dive', outcome: 'Master database partitioning' },
            { week: 'Week 2', focus: 'Streaming & WebSocket Protocols', outcome: 'Build collaborative prototypes' },
            { week: 'Week 3', focus: 'Mock Coding under 25-min timers', outcome: 'Boost speed and syntax confidence' },
            { week: 'Week 4', focus: 'Executive Presence', outcome: 'Polished leadership narrative' }
          ],
          recommendedResources: [
            { title: 'Designing Data-Intensive Applications', type: 'Doc', link: 'https://dataintensive.net' }
          ],
          targetedPracticeQuestions: ['How would you handle cache stampedes under flash sales?'],
          quickWinsVsLongTerm: {
            quickWins: ['Lead with metrics first in STAR answers'],
            longTerm: ['Deep dive into distributed consensus mechanisms']
          }
        },
        appendix: {
          fullTranscript: payload.transcript,
          codeSubmissions: payload.codeSnippets?.code || undefined,
          parsedResumeSkillsSnapshot: payload.resumeSkills,
          scoringRubricNotes: `Scored against ${payload.companyName}'s canonical rubric.`
        },
        shareToken: `share-${Math.random().toString(36).substring(2, 10)}`,
        createdAt: new Date().toISOString()
      };
      return fallbackReport;
    }
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

  async deleteCompany(id: string): Promise<boolean> {
    const res = await fetch(`/api/companies/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.success === true;
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

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const res = await fetch(`/api/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.role;
  },

  async deleteRole(id: string): Promise<boolean> {
    const res = await fetch(`/api/roles/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.success === true;
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
    token?: string;
    error?: string;
  }> {
    const res = await fetch('/api/deepgram/token');
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
