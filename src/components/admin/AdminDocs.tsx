import React from 'react';
import { GlassCard } from '../common/GlassCard';
import { Layers, Shield, Cpu, Database, Server, Smartphone, CheckCircle } from 'lucide-react';

export const AdminDocs: React.FC = () => {
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">System Architecture & Technical Docs</h2>
        <p className="text-xs text-text-secondary mt-1">
          Detailed technical layout, Mermaid flow diagrams, service contracts, and security rules.
        </p>
      </div>

      {/* Visual Architectural Data Flow */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Layers className="w-5 h-5 text-mint" />
          End-to-End System Architecture Diagram
        </h3>

        {/* Clean Interactive Architecture Diagram */}
        <div className="p-6 rounded-2xl bg-sage-950/70 border border-sage-300/20 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {/* 1. Client Layer */}
            <div className="p-4 rounded-xl bg-sage-900/50 border border-sage-400/30 space-y-2">
              <Smartphone className="w-6 h-6 text-mint mx-auto" />
              <h4 className="font-bold text-xs text-text-primary">1. React SPA Client</h4>
              <p className="text-[10px] text-text-muted">
                Zustand Store · Web Audio API · MediaRecorder · Monaco Editor · Sage Glass Design
              </p>
            </div>

            {/* 2. Audio & Calibration */}
            <div className="p-4 rounded-xl bg-sage-900/50 border border-sage-400/30 space-y-2">
              <Cpu className="w-6 h-6 text-gold mx-auto" />
              <h4 className="font-bold text-xs text-text-primary">2. Voice Pipeline & Calibration</h4>
              <p className="text-[10px] text-text-muted">
                16kHz PCM Capture · 24kHz Native Playback · Barge-in Interruption · Live Waveform
              </p>
            </div>

            {/* 3. Service Layer / Server.ts */}
            <div className="p-4 rounded-xl bg-sage-900/50 border border-sage-400/30 space-y-2">
              <Server className="w-6 h-6 text-mint mx-auto" />
              <h4 className="font-bold text-xs text-text-primary">3. Express Service Layer</h4>
              <p className="text-[10px] text-text-muted">
                Resume Sanitizer · Plan Generator · Turn Negotiator · Ephemeral Token Broker
              </p>
            </div>

            {/* 4. Gemini AI SDK */}
            <div className="p-4 rounded-xl bg-sage-900/50 border border-sage-400/30 space-y-2">
              <Database className="w-6 h-6 text-gold mx-auto" />
              <h4 className="font-bold text-xs text-text-primary">4. Google GenAI Models</h4>
              <p className="text-[10px] text-text-muted">
                gemini-3.8-flash (Reasoning) · gemini-3.8-flash-lite-tts (Native Voice Audio)
              </p>
            </div>
          </div>

          {/* Mermaid Source Code Block */}
          <div>
            <span className="text-[11px] font-mono text-text-muted uppercase block mb-1">
              Mermaid Diagram Definition
            </span>
            <pre className="p-4 rounded-xl bg-sage-950 font-mono text-xs text-mint-light overflow-x-auto leading-relaxed border border-sage-300/15">
{`graph TD
  A[Candidate Browser] -->|Audio 16kHz + State| B[Lobby Calibration]
  B -->|Device Verification OK| C[Live AI Interview Room]
  C -->|POST /api/interview/speech-turn| D[Node/Express Server Layer]
  D -->|Prompt + Context| E[Gemini 3.8 Flash]
  E -->|Response Text| D
  D -->|Speech Synthesis| F[Gemini 3.8 Flash-Lite-TTS]
  F -->|WAV Audio 24kHz| C
  C -->|End Call Event| G[POST /api/interview/evaluate]
  G -->|Exhaustive Audit Prompt| E
  E -->|12-Section JSON| H[Evaluation Report]`}
            </pre>
          </div>
        </div>
      </GlassCard>

      {/* Security & Data Privacy Guidelines */}
      <GlassCard className="p-6 space-y-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-4 h-4 text-mint" />
          Security, Privacy & Prompt Injection Safeguards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary">
          <div className="p-3.5 rounded-xl bg-sage-950/30 border border-sage-300/15 space-y-1">
            <span className="font-bold text-text-primary block">Prompt-Injection Defense</span>
            <p>
              Candidate resume text is strictly quarantined as data literals within triple quotes. Models are explicitly instructed never to follow directives contained inside resumes.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-sage-950/30 border border-sage-300/15 space-y-1">
            <span className="font-bold text-text-primary block">Zero Video Storage</span>
            <p>
              Webcam video is processed strictly on-device in browser memory for presence heuristics. No raw video streams are transmitted to or stored on servers.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
