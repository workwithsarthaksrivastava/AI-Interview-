import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket as WsClient } from 'ws';
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
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/deepgram/ws') {
        wss.handleUpgrade(request, socket, head, (clientWs) => {
          wss.emit('connection', clientWs, request);
        });
      }
    } catch (e) {
      console.warn('Upgrade error:', e);
    }
  });

  wss.on('connection', (clientWs, req) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({ type: 'Error', message: 'DEEPGRAM_API_KEY is not configured on server' }));
      clientWs.close(1008, 'Missing Deepgram API key');
      return;
    }

    try {
      const reqUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const language = reqUrl.searchParams.get('language') || 'en';
      const langParam = language === 'hi' || language === 'Hinglish' ? 'hi' : 'en';

      const dgUrl = `wss://api.deepgram.com/v1/listen?model=nova-3&encoding=linear16&sample_rate=16000&channels=1&interim_results=true&smart_format=true&endpointing=800&utterance_end_ms=1500&vad_events=true&language=${langParam}`;

      const dgWs = new WsClient(dgUrl, {
        headers: {
          Authorization: `Token ${apiKey}`
        }
      });

      const messageQueue: Array<{ data: any; isBinary: boolean }> = [];

      dgWs.on('open', () => {
        if (clientWs.readyState === WsClient.OPEN) {
          clientWs.send(JSON.stringify({ type: 'Connected', message: 'Deepgram proxy connected' }));
        }
        while (messageQueue.length > 0) {
          const item = messageQueue.shift();
          if (item && dgWs.readyState === WsClient.OPEN) {
            dgWs.send(item.data, { binary: item.isBinary });
          }
        }
      });

      dgWs.on('message', (data, isBinary) => {
        if (clientWs.readyState === WsClient.OPEN) {
          clientWs.send(data, { binary: isBinary });
        }
      });

      dgWs.on('error', (err) => {
        console.warn('[Deepgram WS Proxy] Deepgram socket error:', err.message);
        if (clientWs.readyState === WsClient.OPEN) {
          clientWs.send(JSON.stringify({ type: 'Error', message: err.message }));
        }
      });

      dgWs.on('close', (code, reason) => {
        if (clientWs.readyState === WsClient.OPEN) {
          const validCode = typeof code === 'number' && code >= 1000 && code <= 4999 ? code : 1000;
          try {
            clientWs.close(validCode, reason);
          } catch {
            clientWs.close(1000);
          }
        }
      });

      clientWs.on('message', (data, isBinary) => {
        if (dgWs.readyState === WsClient.OPEN) {
          dgWs.send(data, { binary: isBinary });
        } else if (dgWs.readyState === WsClient.CONNECTING) {
          messageQueue.push({ data, isBinary });
        }
      });

      clientWs.on('close', () => {
        if (dgWs.readyState === WsClient.OPEN) {
          dgWs.close();
        }
      });

      clientWs.on('error', (err) => {
        console.warn('[Deepgram WS Proxy] Client socket error:', err.message);
        if (dgWs.readyState === WsClient.OPEN) {
          dgWs.close();
        }
      });
    } catch (err: any) {
      console.warn('[Deepgram WS Proxy] Connection initialization error:', err);
      clientWs.close();
    }
  });

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[InterviewIQ] Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
