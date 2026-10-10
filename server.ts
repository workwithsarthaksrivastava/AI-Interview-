import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  handleParseResume,
  handleInterviewPlan,
  handleDeepgramToken,
  handleDeepgramCredit,
  handleDeepgramLogUsage,
  handleDeepgramTts,
  handleMicTest,
  handleAudioTranscribe,
  handleSpeechTurn,
  handleCascadedTurn,
  handleEvaluate,
  handleGetCompanies,
  handleCreateCompany,
  handleUpdateCompany,
  handleGetRoles,
  handleCreateRole,
  handleGetQuestions,
  handleCreateQuestion,
  handleBulkQuestions,
  handleAiGenerateQuestions,
  handleGetInterviews,
  handleCreateInterview,
  handleGetInterviewById,
  handleUpdateInterview,
  handleGetReports,
  handleGetReportById,
  handleGetAvailability,
  handleUpdateAvailability,
  handleGetSettings,
  handleUpdateSettings,
  handleGetAuditLogs,
  handleGetUsers,
  handleExportCsv,
  dispatchApiRequest
} from './src/server-utils';

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Register all API routes
app.post('/api/resume/parse', handleParseResume);
app.post('/api/interview/plan', handleInterviewPlan);
app.get('/api/deepgram/token', handleDeepgramToken);
app.post('/api/deepgram/token', handleDeepgramToken);
app.get('/api/deepgram/credit', handleDeepgramCredit);
app.post('/api/deepgram/log-usage', handleDeepgramLogUsage);
app.post('/api/deepgram/tts', handleDeepgramTts);
app.post('/api/interview/mic-test', handleMicTest);
app.post('/api/audio/transcribe', handleAudioTranscribe);
app.post('/api/interview/speech-turn', handleSpeechTurn);
app.post('/api/interview/cascaded-turn', handleCascadedTurn);
app.post('/api/interview/evaluate', handleEvaluate);
app.get('/api/companies', handleGetCompanies);
app.post('/api/companies', handleCreateCompany);
app.put('/api/companies/:id', (req, res) => handleUpdateCompany(req, res, req.params.id));
app.get('/api/roles', handleGetRoles);
app.post('/api/roles', handleCreateRole);
app.get('/api/questions', handleGetQuestions);
app.post('/api/questions', handleCreateQuestion);
app.post('/api/questions/bulk', handleBulkQuestions);
app.post('/api/questions/ai-generate', handleAiGenerateQuestions);
app.get('/api/interviews', handleGetInterviews);
app.post('/api/interviews', handleCreateInterview);
app.get('/api/interviews/:id', (req, res) => handleGetInterviewById(req, res, req.params.id));
app.patch('/api/interviews/:id', (req, res) => handleUpdateInterview(req, res, req.params.id));
app.get('/api/reports', handleGetReports);
app.get('/api/reports/:id', (req, res) => handleGetReportById(req, res, req.params.id));
app.get('/api/availability', handleGetAvailability);
app.put('/api/availability', handleUpdateAvailability);
app.get('/api/settings', handleGetSettings);
app.put('/api/settings', handleUpdateSettings);
app.get('/api/audit-logs', handleGetAuditLogs);
app.get('/api/users', handleGetUsers);
app.get('/api/export/csv/:table', (req, res) => handleExportCsv(req, res, req.params.table));

// Safety net: universal API router for any additional /api/* paths
app.all('/api/*', (req, res) => dispatchApiRequest(req, res));

async function startServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const distPath = path.resolve(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const httpServer = http.createServer(app);

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[Shakchhatkar] Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
