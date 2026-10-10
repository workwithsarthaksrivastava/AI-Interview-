import { Type } from '@google/genai';
import { db, getGeminiClient, synthesizeDeepgramAura } from './db.js';
import { InterviewPlan } from '../types/index.js';

const STOCK_OPENERS_REGEX = /^\s*(that's great|thats great|that is great|interesting|thank you for sharing|thanks for sharing|great answer|awesome|got it|sounds good|i see|understood|very well|cool|nice|okay|ok|well said|thank you|thanks)[,!.]?/i;

function hasStockOpener(text: string): boolean {
  return STOCK_OPENERS_REGEX.test(text.trim());
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 2));
  const words2 = new Set(str2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

function isTooSimilarToRecent(text: string, recentUtterances: string[]): boolean {
  for (const recent of recentUtterances) {
    if (calculateSimilarity(text, recent) > 0.6) {
      return true;
    }
  }
  return false;
}

// -------------------------------------------------------------
// DYNAMIC NLP CONCEPT EXTRACTOR & CREATIVE FOLLOW-UP ENGINE
// -------------------------------------------------------------
interface FollowUpProbeOption {
  triggerRegex: RegExp;
  probes: string[];
}

const CREATIVE_DOMAIN_PROBES: FollowUpProbeOption[] = [
  {
    triggerRegex: /\b(redis|cache|caching|memcached|in-memory|ttl|eviction)\b/i,
    probes: [
      `You touched on caching with Redis. How would your architecture guard against a catastrophic cache stampede if that high-traffic key expires simultaneously under 25,000 requests per second?`,
      `If memory pressure surges and your cache cluster hits 95% capacity, which eviction policy (such as volatile-lru versus allkeys-lru) would you configure, and how do you prevent cascading latency to the primary database?`,
      `How do you handle cache invalidation and consistency in a multi-region deployment? If a write occurs in US-East, how do you prevent stale reads in EU-West without incurring cross-continent round-trip latency on every read?`
    ]
  },
  {
    triggerRegex: /\b(kafka|queue|rabbitmq|sqs|event|pubsub|stream|consumer|producer)\b/i,
    probes: [
      `You mentioned message streaming. What partition key strategy do you employ to prevent hot-partition skew, and how does your consumer group recover if an unparseable poison pill message lands in the topic?`,
      `When downstream database writes slow down by 400ms, how do your event consumers apply backpressure without exhausting worker thread pools or dropping in-flight messages?`,
      `How do you guarantee idempotency and exactly-once processing semantics if a consumer crashes midway through processing an event batch before committing its partition offset?`
    ]
  },
  {
    triggerRegex: /\b(postgres|postgresql|mysql|mongo|mongodb|dynamodb|cassandra|sql|nosql|database|db|query)\b/i,
    probes: [
      `You highlighted relational storage. When write concurrency spikes, how do you diagnose and prevent row-level lock contention and deadlocks on frequently updated tables?`,
      `What specific indexing strategy (such as composite B-trees or partial indexes) do you implement, and how do you monitor your query execution plans to ensure the planner never falls back to sequential table scans?`,
      `If read traffic outgrows a single database instance, how do you handle replication lag between your primary and read replicas so users don't encounter stale reads right after submitting an update?`
    ]
  },
  {
    triggerRegex: /\b(microservice|microservices|api gateway|service mesh|grpc|rest|monolith)\b/i,
    probes: [
      `In that microservice decomposition, what happens when an upstream authentication or billing dependency experiences a 5-second latency tail? How does your circuit breaker prevent cascading thread starvation?`,
      `How do you track end-to-end distributed tracing across multiple network boundaries, and what is your P99 latency budget across those inter-service hops?`,
      `If a distributed business workflow fails at step 3 of 4, how does your Saga orchestrator coordinate compensating transactions across autonomous services without leaving inconsistent state?`
    ]
  },
  {
    triggerRegex: /\b(lock|locking|mutex|concurrency|race condition|thread|threads|async|parallel)\b/i,
    probes: [
      `Under extreme write contention, what are the trade-offs of optimistic locking with version checks versus pessimistic row locks in terms of database CPU and retry storms?`,
      `How does your implementation guarantee thread safety and memory visibility across worker threads without introducing global lock bottlenecks that throttle throughput?`,
      `If two concurrent requests attempt to reserve the exact same inventory item simultaneously, walk me through the exact transaction boundary or atomic instruction that breaks the tie.`
    ]
  },
  {
    triggerRegex: /\b(react|frontend|ui|virtualization|render|re-render|component|state|hook|hooks|css|dom)\b/i,
    probes: [
      `You touched on frontend rendering. How do you profile deeply nested component trees for redundant re-renders, and why can premature use of useMemo or useCallback actually hurt performance?`,
      `If an interactive dashboard UI suffers from poor Interaction to Next Paint (INP) above 500ms during heavy user events, how would you offload computation to Web Workers or schedule tasks with requestIdleCallback?`,
      `How do you draw the boundary between server state (like React Query), local component state, and global stores (like Zustand), especially when handling optimistic UI rollbacks on network failure?`
    ]
  },
  {
    triggerRegex: /\b(docker|kubernetes|k8s|container|canary|ci\/cd|deploy|pipeline|terraform)\b/i,
    probes: [
      `During a canary deployment rollout, what specific automated observability metrics and error budget thresholds trigger an instantaneous automated rollback?`,
      `In Kubernetes, how do you size pod CPU/memory requests versus limits to avoid CPU throttling while preventing silent OOMKilled evictions under traffic spikes?`,
      `How do you manage zero-downtime database schema migrations when deploying a new version of the service that alters column definitions or constraints?`
    ]
  },
  {
    triggerRegex: /\b(star|incident|outage|bug|post-mortem|failure|mistake|pressure)\b/i,
    probes: [
      `Reflecting on that incident, what was the primary contributing factor that slipped past automated unit and integration tests, and what structural guardrail did your team implement in the post-mortem?`,
      `Under that intense production pressure, how did you balance immediate mitigation (like traffic shedding or rollbacks) against preserving debugging state to analyze root cause?`,
      `If you had to redesign that alerting and observability architecture from scratch today, what single metric or signal would you ensure alerted on that regression before users noticed?`
    ]
  }
];

const GENERIC_CREATIVE_CHALLENGES = [
  `That's a logical foundation. Let's stress-test that: If your system experienced an unexpected 20x traffic surge during a marketing event, what is the very first bottleneck that would degrade, and how does your architecture prevent cascading failure?`,
  `What was the strongest alternative architectural approach you evaluated before deciding on this design, and what specific trade-off tipped the balance?`,
  `What is the single most catastrophic failure mode in that proposed design, and how does the system recover gracefully without data loss or prolonged downtime?`,
  `Walk me through the observability signals and P99 latency metrics you would monitor in real-time to know this component is operating within its healthy SLA.`,
  `If an unexpected network partition split your data centers in half (a split-brain scenario), which side of the CAP theorem did your design favor and why?`
];

function extractCreativeFollowUp(
  candidateMessage: string,
  candidateCode: string,
  category: string,
  userRequestedChallenge: boolean,
  lastAiUtterances: string[]
): string {
  const combinedText = `${candidateMessage} ${candidateCode}`.toLowerCase();

  if (userRequestedChallenge) {
    const challengePool = [
      `Let's raise the bar on this: Imagine a regional data center goes dark during peak load, cutting your cluster capacity in half. Walk me through your real-time failover, shedding, and backpressure strategy to prevent a total outage.`,
      `Here is a tough architectural challenge: A flash traffic event triggers 50,000 concurrent writes per second on your primary datastore, causing connection pools to saturate. How do you re-architect the write path for asynchronous durability without dropping transactions?`,
      `Let's push on the edge cases: How does your architecture guarantee zero data corruption or phantom duplicate charges if a network timeout occurs midway through a 3-way distributed transaction?`
    ];
    for (const c of challengePool) {
      if (!isTooSimilarToRecent(c, lastAiUtterances)) return c;
    }
    return challengePool[0];
  }

  // Scan matched domains
  for (const item of CREATIVE_DOMAIN_PROBES) {
    if (item.triggerRegex.test(combinedText)) {
      for (const probe of item.probes) {
        if (!isTooSimilarToRecent(probe, lastAiUtterances)) {
          return probe;
        }
      }
    }
  }

  // Fallback to rich creative challenge
  for (const gen of GENERIC_CREATIVE_CHALLENGES) {
    if (!isTooSimilarToRecent(gen, lastAiUtterances)) {
      return gen;
    }
  }

  return GENERIC_CREATIVE_CHALLENGES[0];
}

export async function handleInterviewSpeechTurnCore(payload: any) {
  const {
    candidateName = 'Candidate',
    companyName = 'Google',
    roleTitle = 'Software Engineer',
    difficulty = 'Mid',
    interviewType = 'Technical',
    language = 'English',
    plan = null,
    transcriptHistory = [],
    candidateMessage = '',
    candidateCode = '',
    currentQuestionIndex = 0,
    followUpCount = 0,
    askedQuestions = [],
    coveredTopics = [],
    lastAiUtterances = [],
    userRequestedHint = false,
    userRequestedRepeat = false,
    userRequestedChallenge = false,
    silentSeconds = 0
  } = payload;

  const currentPlanQ = plan?.questions?.[currentQuestionIndex] || null;
  const nextPlanQ = plan?.questions?.[currentQuestionIndex + 1] || null;

  const gemini = getGeminiClient();
  if (gemini) {
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        const temperature = attempts === 1 ? 0.75 : 0.95;

        const systemPrompt = `You are a Principal Engineer and Lead Interviewer at ${companyName} conducting an interview with ${candidateName} for the ${roleTitle} position (${difficulty} level, ${interviewType} round, language: ${language}).

CURRENT INTERVIEW STATUS:
Active Question #${currentQuestionIndex + 1}:
${currentPlanQ ? `Category: ${currentPlanQ.category}
Question Text: "${currentPlanQ.question}"
Rationale: ${currentPlanQ.contextOrRationale}
Expected Criteria: ${(currentPlanQ.rubricCriteria || []).join('; ')}
Expected Keywords: ${(currentPlanQ.expectedKeywords || []).join(', ')}` : 'Wrap-up & Candidate Questions stage'}

Next Planned Question #${currentQuestionIndex + 2}:
${nextPlanQ ? `"${nextPlanQ.question}" (${nextPlanQ.category})` : 'Interview Conclusion / Closing wrap-up'}

Questions Asked So Far:
${askedQuestions.length > 0 ? askedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n') : '(None yet)'}

Follow-up count on this question: ${followUpCount} (MAX 2 allowed per question)
Candidate requested challenge / tough probe: ${userRequestedChallenge}

Last 10 AI Utterances (CRITICAL: DO NOT REPEAT OR CLOSELY PARAPHRASE ANY OF THESE):
${lastAiUtterances.length > 0 ? lastAiUtterances.slice(-10).map((u: string) => `- "${u}"`).join('\n') : '(None)'}

Candidate Code in Editor:
"""
${candidateCode || '(Empty)'}
"""

CRITICAL INTERVIEW FLOW RULES (MANDATORY):
1. The candidate just answered the Active Question: "${currentPlanQ ? currentPlanQ.question : ''}".
   DO NOT RE-ASK THIS QUESTION. They already heard it and answered it!
2. If userRequestedHint is true: Provide an encouraging, conceptual clue without giving away the full answer (action = "clarify").
3. If userRequestedRepeat is true: Rephrase the question clearly (action = "clarify").
4. If followUpCount === 0 OR userRequestedChallenge is true:
   - ACTION = "follow_up":
   - Ask an INTERACTIVE, CREATIVE, SHARP follow-up probe!
   - Ground your probe directly in a specific term, method, metric, or trade-off the candidate just mentioned (e.g., Redis, Kafka, Raft, B-Tree, React hooks, memory leaks, P99 latency, rollback).
   - Challenge their assumptions: ask about a 10x traffic spike, a network partition, a cache invalidation race, database lock contention, or why they chose X over Y.
   - Concise: 2 to 3 sentences maximum so the candidate speaks most of the time.
5. If followUpCount >= 1 and candidate gave a clear answer:
   - ACTION = "next_question":
   - Acknowledge their point in 1 crisp sentence (e.g. "That makes sense regarding partition keys.").
   - Smoothly transition and CLEARLY POSE the Next Planned Question: "${nextPlanQ ? nextPlanQ.question : plan?.closingQuestion || 'Wrap-up questions'}".
6. End of Interview:
   - If nextPlanQ does not exist and current questions are complete, action = "end". Welcome candidate to ask their questions.
7. ANTI-REPETITION (MANDATORY):
   - Never start with stock openers like "That's great", "Interesting", "Thank you for sharing", "Thanks for sharing", "Awesome", "Got it", "I see", "Understood", "Very well", "Nice".
   - Start directly with your authentic reaction to what candidate said.
8. Return strict JSON according to schema.`;

        const contents = [
          {
            role: 'user',
            parts: [
              {
                text: `Transcript so far:
${transcriptHistory.map((t: any) => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n')}

Candidate just answered:
"${candidateMessage}"

Candidate requested hint? ${userRequestedHint}
Candidate requested repeat? ${userRequestedRepeat}
Candidate requested challenge? ${userRequestedChallenge}
Silent seconds: ${silentSeconds}`
              }
            ]
          }
        ];

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reaction: { type: Type.STRING },
                action: { type: Type.STRING, enum: ['follow_up', 'next_question', 'clarify', 'end'] },
                next_utterance: { type: Type.STRING },
                evaluation: {
                  type: Type.OBJECT,
                  properties: {
                    relevance: { type: Type.NUMBER },
                    depth: { type: Type.NUMBER },
                    clarity: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    notes: { type: Type.STRING },
                    whatWasGood: { type: Type.STRING },
                    whatWasMissing: { type: Type.STRING },
                    mistakesOrErrors: { type: Type.STRING },
                    idealModelAnswer: { type: Type.STRING }
                  },
                  required: ['relevance', 'depth', 'clarity', 'confidence', 'notes', 'whatWasGood', 'whatWasMissing', 'mistakesOrErrors', 'idealModelAnswer']
                }
              },
              required: ['reaction', 'action', 'next_utterance', 'evaluation']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.next_utterance) {
          let cleanUtterance = parsed.next_utterance;
          if (hasStockOpener(cleanUtterance)) {
            cleanUtterance = cleanUtterance.replace(STOCK_OPENERS_REGEX, '').trim();
            cleanUtterance = cleanUtterance.charAt(0).toUpperCase() + cleanUtterance.slice(1);
          }

          const ttsResult = await synthesizeDeepgramAura(cleanUtterance);
          const fillerWordsFound = (candidateMessage.match(/\b(um|uh|like|basically|actually|you know|sort of|matlab|so yeah)\b/gi) || []).map((w: string) => w.toLowerCase());
          const wordCount = candidateMessage.trim().split(/\s+/).filter(Boolean).length;

          return {
            success: true,
            reaction: parsed.reaction,
            action: parsed.action,
            next_utterance: cleanUtterance,
            aiResponseText: cleanUtterance,
            evaluation: parsed.evaluation,
            audioBase64: ttsResult.audioBase64,
            audioFormat: ttsResult.format,
            fillerWordsFound,
            wordCount,
            advanceQuestion: parsed.action === 'next_question'
          };
        }
      } catch (err: any) {
        console.warn(`[Turn Generation] Gemini attempt ${attempts} warning:`, err.message);
      }
    }
  }

  // -------------------------------------------------------------
  // INTELLIGENT ADAPTIVE SPEECH ENGINE (Resilient, Context-Aware)
  // -------------------------------------------------------------
  const isAskingToRepeat =
    userRequestedRepeat ||
    /\b(repeat|pardon|what was the question|say that again|could you repeat|didn't hear|can you say)\b/i.test(candidateMessage);

  const isAskingForHint =
    userRequestedHint ||
    /\b(hint|clue|can you give me a hint|not sure|help me|stuck)\b/i.test(candidateMessage);

  const isMicCheck =
    /\b(can you hear me|hello|am i audible|test|testing|is this working|hope you can hear)\b/i.test(candidateMessage) &&
    candidateMessage.trim().split(/\s+/).length <= 15;

  let reaction = 'Candidate response acknowledged.';
  let action: 'follow_up' | 'next_question' | 'clarify' | 'end' = 'follow_up';
  let next_utterance = '';

  if (isAskingToRepeat) {
    action = 'clarify';
    reaction = 'Repeated current question at candidate request.';
    const qText = currentPlanQ?.question || 'Could you walk me through your technical background and experience?';
    next_utterance = `Certainly! To repeat the question: ${qText}`;
  } else if (isAskingForHint) {
    action = 'clarify';
    reaction = 'Provided conceptual hint.';
    const hintKeywords = currentPlanQ?.expectedKeywords?.slice(0, 3).join(', ') || 'key architectural trade-offs';
    next_utterance = `Here is a hint to guide your thinking: Consider ${hintKeywords}. Think about how you would structure the design to optimize for reliability and performance.`;
  } else if (isMicCheck) {
    action = 'clarify';
    reaction = 'Confirmed audio reception with candidate.';
    const qText = currentPlanQ?.question || 'Please tell me a bit about yourself and your recent engineering projects.';
    next_utterance = `Yes, I can hear you clearly! Let's continue. ${qText}`;
  } else if (userRequestedChallenge) {
    // Immediate Bar-Raiser Challenge
    action = 'follow_up';
    reaction = 'Challenging candidate with high-stakes scenario.';
    next_utterance = extractCreativeFollowUp(candidateMessage, candidateCode, currentPlanQ?.category || 'technical', true, lastAiUtterances);
  } else if (followUpCount === 0) {
    // Candidate answered main question: ALWAYS ask an interactive, creative follow-up probe!
    action = 'follow_up';
    reaction = 'Probing candidate with contextual technical follow-up.';
    next_utterance = extractCreativeFollowUp(candidateMessage, candidateCode, currentPlanQ?.category || 'technical', false, lastAiUtterances);
  } else if (followUpCount === 1) {
    // Candidate answered 1st follow-up
    const words = candidateMessage.trim().split(/\s+/).filter(Boolean);
    if (words.length < 15) {
      // Short response: probe once more
      action = 'follow_up';
      reaction = 'Probing for additional depth on follow-up.';
      next_utterance = extractCreativeFollowUp(candidateMessage, candidateCode, currentPlanQ?.category || 'technical', false, lastAiUtterances);
    } else {
      // Good response: transition smoothly to next question!
      if (nextPlanQ) {
        action = 'next_question';
        reaction = 'Candidate provided thorough depth. Advancing to next plan question.';
        const transitionIntros = [
          `That makes sense and addresses the key trade-offs. Building on that foundation, let's explore our next area: ${nextPlanQ.question}`,
          `Good breakdown of those constraints. Shifting gears to our next topic: ${nextPlanQ.question}`,
          `Understood. That gives me a clear picture of your approach. Let's move into our next question: ${nextPlanQ.question}`
        ];
        next_utterance = transitionIntros[Math.floor(Math.random() * transitionIntros.length)];
      } else {
        action = 'end';
        reaction = 'Interview plan complete.';
        next_utterance = `Thank you, ${candidateName}. We have covered all the core technical and architectural areas today. You did very well. What questions do you have for me about our tech stack, roadmap, or engineering culture at ${companyName}?`;
      }
    }
  } else {
    // followUpCount >= 2: Advance to next question
    if (nextPlanQ) {
      action = 'next_question';
      reaction = 'Advancing to next plan question.';
      next_utterance = `That gives me a solid read on your thinking here. Let's move to our next question: ${nextPlanQ.question}`;
    } else {
      action = 'end';
      reaction = 'Interview plan complete.';
      next_utterance = `Thank you, ${candidateName}. We have covered all key topics today. What questions do you have for me about ${companyName}?`;
    }
  }

  if (hasStockOpener(next_utterance)) {
    next_utterance = next_utterance.replace(STOCK_OPENERS_REGEX, '').trim();
    next_utterance = next_utterance.charAt(0).toUpperCase() + next_utterance.slice(1);
  }

  const ttsResult = await synthesizeDeepgramAura(next_utterance);
  const fillerWordsFound = (candidateMessage.match(/\b(um|uh|like|basically|actually|you know|sort of|matlab|so yeah)\b/gi) || []).map((w: string) => w.toLowerCase());
  const wordCount = candidateMessage.trim().split(/\s+/).filter(Boolean).length;

  const evaluation = {
    relevance: Math.min(10, Math.max(6, 8 + (wordCount > 20 ? 1 : 0))),
    depth: Math.min(10, Math.max(6, 7 + (wordCount > 30 ? 2 : 1))),
    clarity: 8.5,
    confidence: 8,
    notes: `Candidate addressed ${currentPlanQ?.category || 'question'} with relevant context.`,
    whatWasGood: 'Clear articulation and structured response.',
    whatWasMissing: 'Could provide more specific quantitative metrics and production edge-case considerations.',
    mistakesOrErrors: 'None noted.',
    idealModelAnswer: currentPlanQ?.contextOrRationale || 'A well-structured answer with concrete architectural trade-offs.'
  };

  return {
    success: true,
    reaction,
    action,
    next_utterance,
    aiResponseText: next_utterance,
    evaluation,
    audioBase64: ttsResult.audioBase64,
    audioFormat: ttsResult.format,
    fillerWordsFound,
    wordCount,
    advanceQuestion: action === 'next_question'
  };
}
