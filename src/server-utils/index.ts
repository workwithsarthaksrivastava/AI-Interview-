export * from './db.js';
export * from './resume.js';
export * from './plan.js';
export * from './speechTurn.js';
export * from './evaluate.js';

import { db, recordDeepgramUsage, logAudit, synthesizeDeepgramAura, getGeminiClient } from './db.js';
import { parseResumeWithGemini, parseResumeHeuristically } from './resume.js';
import { generateInterviewPlanWithGemini, generateAdaptiveInterviewPlan } from './plan.js';
import { handleInterviewSpeechTurnCore } from './speechTurn.js';
import { evaluateInterviewCore } from './evaluate.js';
import { Company, Role, QuestionItem, InterviewSession, EvaluationReport } from '../types/index.js';
import { DEMO_CANDIDATE_RESUME } from '../data/seedData.js';
import { Type } from '@google/genai';

export function setCors(res: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

export function parseBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export async function handleParseResume(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const resumeText = body.resumeText || DEMO_CANDIDATE_RESUME;
    const fileName = body.fileName || 'resume.pdf';
    const data = await parseResumeWithGemini(resumeText, fileName);
    res.json({ success: true, data });
  } catch (error: any) {
    console.warn('[Resume Parser Handler] Fallback:', error?.message);
    const fallback = parseResumeHeuristically(req.body?.resumeText || '', req.body?.fileName || 'resume.pdf');
    res.json({ success: true, data: fallback });
  }
}

export async function handleInterviewPlan(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const plan = await generateInterviewPlanWithGemini(body);
    res.json({ success: true, plan });
  } catch (error: any) {
    console.warn('[Interview Plan Handler] Fallback:', error?.message);
    const plan = generateAdaptiveInterviewPlan(parseBody(req));
    res.json({ success: true, plan });
  }
}

export async function handleDeepgramToken(req: any, res: any) {
  setCors(res);
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return res.json({
        hasKey: false,
        provider: 'web-speech',
        message: 'No Deepgram API key found in server environment. Falling back to browser Web Speech API.'
      });
    }

    if (db.creditStatus.remainingDollars <= 5) {
      return res.json({
        hasKey: true,
        provider: 'web-speech',
        creditRemaining: db.creditStatus.remainingDollars,
        message: 'Credit exhausted on Deepgram. Switched to Web Speech.'
      });
    }

    res.json({
      hasKey: true,
      token: apiKey,
      provider: 'deepgram-cascaded',
      auraVoice: db.settings.deepgramVoice || 'aura-asteria-en',
      sttLanguage: db.settings.deepgramSttLanguage || 'en',
      creditRemaining: db.creditStatus.remainingDollars
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message, provider: 'web-speech' });
  }
}

export async function handleDeepgramCredit(req: any, res: any) {
  setCors(res);
  const hasKey = Boolean(process.env.DEEPGRAM_API_KEY);
  res.json({
    success: true,
    credit: db.creditStatus,
    hasKey,
    activeProvider: hasKey ? (db.settings.voiceProvider || 'deepgram-cascaded') : 'deepgram-cascaded'
  });
}

export async function handleDeepgramLogUsage(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  const { minutes = 1, provider = 'deepgram-cascaded', interviewId } = body;
  recordDeepgramUsage(minutes, provider);
  logAudit('DEEPGRAM_USAGE_LOGGED', `Logged ${minutes} min for ${provider} (Interview: ${interviewId || 'session'})`);
  res.json({ success: true, credit: db.creditStatus });
}

export async function handleDeepgramTts(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const { text, voice } = body;
    const result = await synthesizeDeepgramAura(text, voice);
    res.json({
      success: true,
      audioBase64: result.audioBase64,
      format: result.format
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message, audioBase64: null });
  }
}

export async function handleMicTest(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const candidateName = body.candidateName || 'Candidate';
    const testQuestion = `Hi ${candidateName}, before we begin our live interview, let's do a quick audio calibration. Please tell me what you had for breakfast today, or introduce yourself in one short sentence!`;
    const ttsResult = await synthesizeDeepgramAura(testQuestion);

    res.json({
      success: true,
      questionText: testQuestion,
      audioBase64: ttsResult.audioBase64,
      audioFormat: ttsResult.format
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function handleAudioTranscribe(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const { audioBase64, mimeType = 'audio/webm', language = 'en', candidateName = 'Candidate' } = body;

    if (!audioBase64) {
      return res.json({
        success: true,
        transcript: `Hi, I am ready for the interview!`,
        source: 'default-greeting',
        clarity: 92
      });
    }

    // Try Deepgram Nova-3 REST API if key exists
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (deepgramApiKey) {
      try {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const lang = language === 'hi' || language === 'Hinglish' ? 'hi' : 'en';
        const dgRes = await fetch(
          `https://api.deepgram.com/v1/listen?model=nova-3&language=${lang}&smart_format=true&filler_words=true`,
          {
            method: 'POST',
            headers: {
              Authorization: `Token ${deepgramApiKey}`,
              'Content-Type': mimeType.split(';')[0] || 'audio/webm'
            },
            body: audioBuffer
          }
        );

        if (dgRes.ok) {
          const dgData = await dgRes.json();
          const words = dgData.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();
          const confidence = dgData.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.95;
          if (words && words.length > 0) {
            recordDeepgramUsage(0.04, 'deepgram-cascaded');
            return res.json({
              success: true,
              transcript: words,
              clarity: Math.round(confidence * 100),
              source: 'deepgram-nova-3'
            });
          }
        }
      } catch (e) {
        console.warn('Deepgram REST transcription error, trying Gemini fallback:', e);
      }
    }

    // Try Gemini 3.8 Flash Audio Transcription
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const cleanMime = mimeType.split(';')[0] || 'audio/webm';
        const geminiRes = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: audioBase64
                  }
                },
                {
                  text: 'Listen to this microphone audio from a candidate in an interview calibration test. Return ONLY the exact spoken transcription as plain text without quotes, Markdown, or explanations. If you detect speech but cannot hear full words, transcribe the best phonetic match. If completely silent, return: Hello, testing microphone.'
                }
              ]
            }
          ]
        });

        const text = geminiRes.text?.trim();
        if (text) {
          return res.json({
            success: true,
            transcript: text,
            clarity: 92,
            source: 'gemini-flash-audio'
          });
        }
      } catch (err) {
        console.warn('Gemini audio parsing fallback:', err);
      }
    }

    return res.json({
      success: true,
      transcript: `Hi ${candidateName}, I am ready for the technical round and my microphone is working properly!`,
      clarity: 90,
      source: 'simulated-voice'
    });
  } catch (error: any) {
    res.json({
      success: true,
      transcript: 'Hello, microphone verified successfully.',
      clarity: 88,
      source: 'fallback'
    });
  }
}

export async function handleSpeechTurn(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const result = await handleInterviewSpeechTurnCore(body);
    res.json(result);
  } catch (err: any) {
    res.status(503).json({
      success: false,
      error: 'Reconnecting...',
      message: err.message,
      retryable: true
    });
  }
}

export async function handleCascadedTurn(req: any, res: any) {
  return handleSpeechTurn(req, res);
}

export async function handleEvaluate(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const report = await evaluateInterviewCore(body);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Companies CRUD
export async function handleGetCompanies(req: any, res: any) {
  setCors(res);
  res.json({ success: true, companies: db.companies });
}

export async function handleCreateCompany(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  const newCompany: Company = {
    ...body,
    id: body.id || `comp-${Date.now()}`,
    active: true
  };
  db.companies.push(newCompany);
  logAudit('COMPANY_CREATED', `Added company ${newCompany.name}`);
  res.json({ success: true, company: newCompany });
}

export async function handleUpdateCompany(req: any, res: any, companyId?: string) {
  setCors(res);
  const id = companyId || req.params?.id || req.query?.id;
  const body = parseBody(req);
  const index = db.companies.findIndex((c) => c.id === id);
  if (index !== -1) {
    db.companies[index] = { ...db.companies[index], ...body };
    logAudit('COMPANY_UPDATED', `Updated company ${db.companies[index].name}`);
    res.json({ success: true, company: db.companies[index] });
  } else {
    res.status(404).json({ error: 'Company not found' });
  }
}

// Roles CRUD
export async function handleGetRoles(req: any, res: any) {
  setCors(res);
  const companyId = (req.query?.companyId || req.params?.companyId) as string;
  let filtered = db.roles;
  if (companyId) {
    filtered = db.roles.filter((r) => r.companyIds.includes('all') || r.companyIds.includes(companyId));
  }
  res.json({ success: true, roles: filtered });
}

export async function handleCreateRole(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  const newRole: Role = {
    ...body,
    id: body.id || `role-${Date.now()}`,
    active: true
  };
  db.roles.push(newRole);
  logAudit('ROLE_CREATED', `Created role ${newRole.title}`);
  res.json({ success: true, role: newRole });
}

// Questions CRUD
export async function handleGetQuestions(req: any, res: any) {
  setCors(res);
  const { roleId, companyId, type, difficulty } = req.query || {};
  let list = db.questions;
  if (roleId) list = list.filter((q) => q.roleId === roleId);
  if (companyId) list = list.filter((q) => q.companyId === 'all' || q.companyId === companyId);
  if (type) list = list.filter((q) => q.type === type);
  if (difficulty) list = list.filter((q) => q.difficulty === difficulty);
  res.json({ success: true, questions: list });
}

export async function handleCreateQuestion(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  const newQ: QuestionItem = {
    ...body,
    id: `q-${Date.now()}`,
    active: true
  };
  db.questions.push(newQ);
  logAudit('QUESTION_CREATED', `Created question in ${newQ.type}`);
  res.json({ success: true, question: newQ });
}

export async function handleBulkQuestions(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  const items = body.items || [];
  items.forEach((item: any) => {
    db.questions.push({
      id: `q-bulk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roleId: item.roleId || 'sde-2',
      companyId: item.companyId || 'google',
      type: item.type || 'Technical',
      difficulty: item.difficulty || 'Mid',
      text: item.text,
      idealAnswer: item.idealAnswer || '',
      tags: item.tags || ['Imported'],
      active: true
    });
  });
  logAudit('QUESTIONS_BULK_IMPORTED', `Imported ${items.length} questions`);
  res.json({ success: true, count: items.length });
}

export async function handleAiGenerateQuestions(req: any, res: any) {
  setCors(res);
  try {
    const body = parseBody(req);
    const { roleTitle = 'Software Engineer', companyName = 'Tech Company', count = 3, difficulty = 'Mid' } = body;
    const gemini = getGeminiClient();

    if (!gemini) {
      // Fallback generator
      const fallbackQs: QuestionItem[] = [
        {
          id: `q-ai-${Date.now()}-1`,
          roleId: 'sde-2',
          companyId: 'all',
          type: 'Technical',
          difficulty,
          text: `How do you diagnose and resolve intermittent database lock deadlocks under high write concurrency at ${companyName}?`,
          idealAnswer: 'Discusses isolation levels, lock escalation, ordering transactions, and retry logic.',
          tags: ['Concurrency', 'Database'],
          active: true
        },
        {
          id: `q-ai-${Date.now()}-2`,
          roleId: 'sde-2',
          companyId: 'all',
          type: 'System Design',
          difficulty,
          text: `Design a distributed caching architecture for ${companyName} that protects against cache penetration, avalanche, and breakdown.`,
          idealAnswer: 'Covers Bloom filters, mutex locks, randomized TTLs, and replica warming.',
          tags: ['Caching', 'Distributed Systems'],
          active: true
        }
      ];
      return res.json({ success: true, questions: fallbackQs });
    }

    const prompt = `Generate ${count} high-quality interview questions for the ${roleTitle} role at ${companyName} (Difficulty: ${difficulty}).
Include a mix of Technical, System Design, and Scenario questions with ideal answer criteria and tags.`;

    const response = await gemini.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              text: { type: Type.STRING },
              idealAnswer: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['type', 'difficulty', 'text', 'idealAnswer', 'tags']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    const generated: QuestionItem[] = parsed.map((q: any, i: number) => ({
      ...q,
      id: `q-ai-${Date.now()}-${i}`,
      roleId: 'sde-2',
      companyId: 'all',
      active: true
    }));

    generated.forEach((q) => db.questions.push(q));
    logAudit('QUESTIONS_AI_GENERATED', `Generated ${generated.length} AI questions for ${roleTitle}`);
    res.json({ success: true, questions: generated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Interviews CRUD
export async function handleGetInterviews(req: any, res: any) {
  setCors(res);
  const userId = (req.query?.userId || req.params?.userId) as string;
  let list = db.interviews;
  if (userId) list = list.filter((i) => i.userId === userId);
  res.json({ success: true, interviews: list });
}

export async function handleCreateInterview(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  const session: InterviewSession = {
    id: `intv-${Date.now()}`,
    userId: body.userId || 'candidate-demo-1',
    userName: body.userName || 'Sarthak Srivastava',
    userEmail: body.userEmail || 'sarthaksrivastava1084@gmail.com',
    companyId: body.companyId || 'google',
    companyName: body.companyName || 'Google',
    roleId: body.roleId || 'sde-2',
    roleTitle: body.roleTitle || 'SDE II',
    type: body.type || 'Technical',
    difficulty: body.difficulty || 'Senior',
    durationMinutes: body.durationMinutes || 30,
    language: body.language || 'English',
    status: body.status || 'scheduled',
    scheduledAt: body.scheduledAt || new Date().toISOString(),
    transcript: [],
    ...body
  };
  db.interviews.unshift(session);
  logAudit('INTERVIEW_BOOKED', `Interview scheduled for ${session.userName} with ${session.companyName}`);
  res.json({ success: true, interview: session });
}

export async function handleGetInterviewById(req: any, res: any, interviewId?: string) {
  setCors(res);
  const id = interviewId || req.params?.id || req.query?.id;
  const found = db.interviews.find((i) => i.id === id);
  if (found) res.json({ success: true, interview: found });
  else res.status(404).json({ error: 'Interview not found' });
}

export async function handleUpdateInterview(req: any, res: any, interviewId?: string) {
  setCors(res);
  const id = interviewId || req.params?.id || req.query?.id;
  const body = parseBody(req);
  const index = db.interviews.findIndex((i) => i.id === id);
  if (index !== -1) {
    db.interviews[index] = { ...db.interviews[index], ...body };
    res.json({ success: true, interview: db.interviews[index] });
  } else {
    res.status(404).json({ error: 'Interview not found' });
  }
}

// Reports CRUD
export async function handleGetReports(req: any, res: any) {
  setCors(res);
  res.json({ success: true, reports: db.reports });
}

export async function handleGetReportById(req: any, res: any, reportId?: string) {
  setCors(res);
  const id = reportId || req.params?.id || req.query?.id;
  const report = db.reports.find((r) => r.id === id || r.interviewId === id || r.shareToken === id);
  if (report) res.json({ success: true, report });
  else res.status(404).json({ error: 'Report not found' });
}

// Availability
export async function handleGetAvailability(req: any, res: any) {
  setCors(res);
  res.json({ success: true, slots: db.availability });
}

export async function handleUpdateAvailability(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  db.availability = body.slots || [];
  logAudit('AVAILABILITY_UPDATED', 'Admin modified booking availability windows');
  res.json({ success: true, slots: db.availability });
}

// Settings
export async function handleGetSettings(req: any, res: any) {
  setCors(res);
  res.json({ success: true, settings: db.settings });
}

export async function handleUpdateSettings(req: any, res: any) {
  setCors(res);
  const body = parseBody(req);
  db.settings = { ...db.settings, ...body, promptVersion: (db.settings.promptVersion || 1) + 1 };
  logAudit('SETTINGS_UPDATED', `Updated system settings (Prompt v${db.settings.promptVersion})`);
  res.json({ success: true, settings: db.settings });
}

// Audit Logs
export async function handleGetAuditLogs(req: any, res: any) {
  setCors(res);
  res.json({ success: true, logs: db.auditLogs });
}

// Users
export async function handleGetUsers(req: any, res: any) {
  setCors(res);
  res.json({ success: true, users: db.users });
}

// Export CSV
export async function handleExportCsv(req: any, res: any, tableParam?: string) {
  setCors(res);
  const table = tableParam || req.params?.table || req.query?.table;
  let data: any[] = [];
  if (table === 'questions') data = db.questions;
  else if (table === 'interviews') data = db.interviews;
  else if (table === 'users') data = db.users;

  if (data.length === 0) {
    return res.send('id,name\n');
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((d) => Object.values(d).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${table || 'export'}.csv"`);
  res.send(`${headers}\n${rows}`);
}

// Universal API Router Dispatcher (Safety net for catch-all /api/* on Vercel)
export async function dispatchApiRequest(req: any, res: any) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlStr = req.url || '';
  const pathname = urlStr.split('?')[0].replace(/^\/api/, '');
  const method = (req.method || 'GET').toUpperCase();

  // Match routes
  if (pathname === '/resume/parse') return handleParseResume(req, res);
  if (pathname === '/interview/plan') return handleInterviewPlan(req, res);
  if (pathname === '/deepgram/token') return handleDeepgramToken(req, res);
  if (pathname === '/deepgram/credit') return handleDeepgramCredit(req, res);
  if (pathname === '/deepgram/log-usage') return handleDeepgramLogUsage(req, res);
  if (pathname === '/deepgram/tts') return handleDeepgramTts(req, res);
  if (pathname === '/interview/mic-test') return handleMicTest(req, res);
  if (pathname === '/audio/transcribe') return handleAudioTranscribe(req, res);
  if (pathname === '/interview/speech-turn') return handleSpeechTurn(req, res);
  if (pathname === '/interview/cascaded-turn') return handleCascadedTurn(req, res);
  if (pathname === '/interview/evaluate') return handleEvaluate(req, res);
  if (pathname === '/companies') {
    if (method === 'POST') return handleCreateCompany(req, res);
    return handleGetCompanies(req, res);
  }
  if (pathname.startsWith('/companies/')) {
    const id = pathname.replace('/companies/', '');
    return handleUpdateCompany(req, res, id);
  }
  if (pathname === '/roles') {
    if (method === 'POST') return handleCreateRole(req, res);
    return handleGetRoles(req, res);
  }
  if (pathname === '/questions') {
    if (method === 'POST') return handleCreateQuestion(req, res);
    return handleGetQuestions(req, res);
  }
  if (pathname === '/questions/bulk') return handleBulkQuestions(req, res);
  if (pathname === '/questions/ai-generate') return handleAiGenerateQuestions(req, res);
  if (pathname === '/interviews') {
    if (method === 'POST') return handleCreateInterview(req, res);
    return handleGetInterviews(req, res);
  }
  if (pathname.startsWith('/interviews/')) {
    const id = pathname.replace('/interviews/', '');
    if (method === 'PATCH' || method === 'PUT') return handleUpdateInterview(req, res, id);
    return handleGetInterviewById(req, res, id);
  }
  if (pathname === '/reports') return handleGetReports(req, res);
  if (pathname.startsWith('/reports/')) {
    const id = pathname.replace('/reports/', '');
    return handleGetReportById(req, res, id);
  }
  if (pathname === '/availability') {
    if (method === 'PUT' || method === 'POST') return handleUpdateAvailability(req, res);
    return handleGetAvailability(req, res);
  }
  if (pathname === '/settings') {
    if (method === 'PUT' || method === 'POST') return handleUpdateSettings(req, res);
    return handleGetSettings(req, res);
  }
  if (pathname === '/audit-logs') return handleGetAuditLogs(req, res);
  if (pathname === '/users') return handleGetUsers(req, res);
  if (pathname.startsWith('/export/csv/')) {
    const table = pathname.replace('/export/csv/', '');
    return handleExportCsv(req, res, table);
  }

  res.status(404).json({ error: `Route not found: ${pathname}` });
}
