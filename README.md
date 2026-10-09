# InterviewIQ — AI-Powered Live Mock Interview Platform

InterviewIQ is an enterprise-grade AI mock interview platform featuring real-time conversational voice interaction, resume parsing & personalization, company persona matching, a pre-flight calibration lobby, and an exhaustive 12-section hiring committee performance report.

---

## Key Highlights & Features

### 1. Sage Green Glassmorphism Design System
- **Atmospheric Visuals**: Drifting gradient mesh blobs (Sage 400, Mint, Pale Gold) with realistic glass highlights and specular refraction borders.
- **Accessibility & Contrast**: Built to exceed WCAG AA standards (4.5:1 text contrast), with a one-click "Reduce Transparency" toggle for low-contrast needs.
- **Voice Avatar Orb**: Centralized animated voice orb reacting to four distinct states:
  - `idle`: Calm breathing pulse
  - `listening`: Soft mint ripples responding to candidate mic levels
  - `thinking`: Rotating sage and gold shimmer
  - `speaking`: Waveform-driven pulsing with ambient glow

### 2. Candidate 5-Step Wizard
1. **Resume Ingestion & Parsing**:
   - Drag & drop PDF/DOCX or text paste with prompt-injection defense.
   - Structured JSON extraction: Name, skills, experience highlights, education, years of experience, and seniority estimation.
   - Resume Strength Score (0–100) with 3 actionable improvement tips.
   - AI role matching percentage tags.
2. **Target Company Selection**:
   - Company profiles (Google, Amazon, Microsoft, TCS, Infosys, and Tech Startups).
   - Dynamic persona profiles: Tone, hiring bar criteria, typical round structures, and core leadership principles.
3. **Role & Round Customization**:
   - 10 diverse roles (SDE II, Senior Frontend, Full Stack, ML Engineer, Product Manager, Data Analyst, Cloud DevOps, Distributed Systems, Campus Fresher, HR Behavioral).
   - Customizable Round Type (Technical, HR, Behavioral, System Design, Mixed), Difficulty (Fresher, Mid, Senior), Duration (15, 30, 45 min), and Language (English, Hindi, Hinglish).
4. **Timezone-Aware Scheduling**:
   - "Start Now" for immediate mock or "Schedule Later" slot selector.
   - Generates `.ics` calendar invite downloads with automated reminder notifications.
5. **Mandatory Pre-Interview Lobby & Calibration**:
   - Live microphone frequency waveform & noise level meter (Quiet / Optimal / Noisy).
   - Speaker test tone chime verification ("Did you hear it?").
   - Optional camera preview toggle.
   - **Sample Question Mic Test (Mandatory dry run)**: AI greets the candidate by name and verifies volume threshold, speech-to-text transcription, AI voice feedback, and round-trip latency (<500ms).

### 3. Live AI Interview Room
- Full-screen immersion with animated Voice Orb avatar.
- Two-way voice pipeline with **Barge-in (Interruption) Support**: if the candidate speaks while the AI is talking, AI audio pauses immediately and adapts.
- Real-time collapsible transcript panel with speaker-differentiated glass bubbles.
- Dynamic hint trigger: if candidate stays silent for 20+ seconds, AI offers an encouraging, subtle hint.
- Integrated tools:
  - **Live Code Editor**: Multi-language code editor with test execution mock and real-time synchronization to the AI interviewer.
  - **System Design Whiteboard**: Freeform drawing canvas with architecture trade-offs note pad.
  - **Live Timer & Speech Metrics**: Words per minute (WPM) tracking, filler word counter, and question progress dots.

### 4. Comprehensive 12-Section Bar-Raiser Report
1. **Cover & Verdict**: Candidate name, company, role, difficulty, overall score (0–100), hire readiness verdict (Strong Hire / Lean Hire / Borderline / Do Not Hire), and executive summary.
2. **Score Dashboard**: 10 category scores benchmarked against company hiring standards with justification paragraphs.
3. **Question-by-Question Breakdown**: Question text, candidate answer quote, score out of 10, what was good, what was missing, and ideal model answers.
4. **Speech & Voice Analytics**: Words per minute, filler words breakdown (`um`, `like`, `basically`), talk-to-listen ratio, and vocabulary upgrades.
5. **Behavioral & Psychological Observations**: Handling pressure, honesty vs. bluffing, curiosity, and questions asked back.
6. **Key Strengths & Weaknesses**: Top 5 strengths and weaknesses backed by exact transcript evidence quotes.
7. **Company-Specific Insights**: Likelihood of clearing specific rounds at the selected organization.
8. **Personalized Improvement Roadmap**: Top 5 priority skills, 7-day fast sprint schedule, 30-day comprehensive practice schedule, and 10 targeted practice questions.
9. **Export & Sharing**: One-click printable PDF preview, raw JSON data export, and private shareable link.

### 5. Admin Console (`/admin`)
- **Overview Dashboard**: Active interviews count, candidate conversion funnel, average scores, and live system audit logs.
- **Question Bank Management**: 50+ seed questions across roles, bulk CSV upload, and real-time AI question generator powered by Gemini 3.8 Flash.
- **AI Settings & Sandbox**: Edit system instructions without redeploying, choose prebuilt Gemini voice personas (`Zephyr`, `Puck`, `Charon`, `Kore`, `Fenrir`), tune temperature, toggle feature flags, and test prompts in the live sandbox.
- **Architecture & Docs**: Interactive Mermaid architecture diagram and security guidelines.

---

## Seed Accounts & Instant Testing
- **Candidate Account**: Sarthak Srivastava (`sarthaksrivastava1084@gmail.com`) — switchable in the top navbar.
- **Admin Account**: Elena Rostova (`admin@interviewiq.ai`) — switchable in the top navbar.
- **1-Click Demo Resume**: Click "Load Demo Candidate Profile" on Step 1 to instantly populate Sarthak's 3.5-year Full Stack experience.

---

## Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Zustand.
- **Backend / Services**: Express 4 server (`server.ts`) hosting custom API endpoints and mounting Vite dev middleware.
- **AI Models**:
  - `gemini-3.8-flash`: Structured resume parsing, question plan generation, conversational interview turns, and 12-section bar-raiser report evaluation.
  - `gemini-3.8-flash-lite-tts`: Real-time high-fidelity native voice audio generation (24kHz WAV).
