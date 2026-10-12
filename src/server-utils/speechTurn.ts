import { Type, ThinkingLevel } from '@google/genai';
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
    try {
      const systemPrompt = `You are an elite, highly empathetic, and direct Principal Technical Interviewer at ${companyName} conducting an interactive live mock interview with ${candidateName} for the ${roleTitle} role (${difficulty} level, ${interviewType} round).

CONTEXT:
Active Question #${currentQuestionIndex + 1}:
${currentPlanQ ? `Category: ${currentPlanQ.category}
Question Text: "${currentPlanQ.question}"
Rationale: ${currentPlanQ.contextOrRationale}
Expected Keywords: ${(currentPlanQ.expectedKeywords || []).join(', ')}` : 'Interview Closing Wrap-up'}

Next Planned Question #${currentQuestionIndex + 2}:
${nextPlanQ ? `"${nextPlanQ.question}" (${nextPlanQ.category})` : 'Final Closing Wrap-up & Candidate Questions'}

Follow-up count on current question: ${followUpCount} (Max 2 before advancing)
Candidate requested challenge: ${userRequestedChallenge}
Candidate requested hint: ${userRequestedHint}
Candidate requested repeat: ${userRequestedRepeat}

Previous Utterances to Avoid:
${lastAiUtterances.slice(-5).map((u: string) => `- "${u}"`).join('\n') || '(None)'}

CRITICAL HUMAN INTERACTION & CONVERSATIONAL RULES (MANDATORY):
1. CANDIDATE SAYS "I DON'T KNOW", "NOT SURE", "SORRY", "NO IDEA", OR ASKS TO SKIP:
   - Action = "next_question".
   - First, CONSOLE and reassure them with genuine human warmth. Nobody knows everything, and honesty is valued in engineering.
   - If the question was a basic fundamental for their seniority (e.g. Senior or Lead not knowing basics like indices, mutexes, HTTP codes, or data structures):
     Be honestly constructive! Say something like: "No worries at all! To be candid, for a ${difficulty} role this is a basic fundamental you'll definitely want to review later, but don't sweat it today. Let's move along to our next question: ${nextPlanQ ? nextPlanQ.question : 'Wrap-up questions'}".
   - If it was an advanced or specialized concept:
     Console warmly: "No worries at all, that's completely okay! Nobody has every edge case memorized, and I appreciate your honesty. Let's pivot to our next area: ${nextPlanQ ? nextPlanQ.question : 'Wrap-up questions'}".

2. CANDIDATE ASKS TO REPEAT ("Can you repeat?", "Didn't hear you", "Say that again", "What was that?", "Could you rephrase?"):
   - Action = "clarify".
   - DO NOT repeat the exact same formal sentence! REPEAT IN MUCH SIMPLER, INTUITIVE TERMS.
   - Strip away academic jargon and explain the challenge in plain English using a real-world scenario (e.g. "No problem, let me simplify that: in plain English, imagine thousands of shoppers all trying to buy the exact same item at the same millisecond—how do you prevent the database from double-selling or freezing up?").

3. CANDIDATE ASKS FOR A HINT OR CLUE:
   - Action = "clarify".
   - Give an intuitive, encouraging conceptual hint without giving away the full answer.

4. CANDIDATE ANSWERS THE TECHNICAL QUESTION:
   - Listen to their exact answer: "${candidateMessage}".
   - Provide an authentic, concise human reaction (e.g., "Good instinct on partition keys...", "I like that you addressed cache invalidation first...", "Watch out though, that creates a bottleneck on the primary database...").
   - If followUpCount === 0 OR userRequestedChallenge is true:
     - Action = "follow_up".
     - Ask an authentic, sharp follow-up probe digging into trade-offs, 10x scale, concurrency, or failure recovery.
     - Keep it concise (1 to 2 sentences) so the candidate speaks most of the time.
   - If followUpCount >= 1 OR candidate gave a thorough answer:
     - Action = "next_question".
     - Acknowledge their point in 1 crisp sentence, then smoothly transition and clearly pose the Next Planned Question: "${nextPlanQ ? nextPlanQ.question : plan?.closingQuestion || 'What questions do you have for me?'}".

5. SPEED & TONE:
   - Respond in 1 to 3 punchy sentences maximum.
   - Sound like a real, supportive yet sharp senior engineer. Avoid robotic praise ("That's great!", "Interesting!").`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Transcript so far:
${transcriptHistory.slice(-8).map((t: any) => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n')}

Candidate just said:
"${candidateMessage}"

Candidate Code in Editor:
"""
${candidateCode || '(Empty)'}
"""`
            }
          ]
        }
      ];

      // Ultra-low latency generation with ThinkingLevel.LOW
      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.35,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
                  notes: { type: Type.STRING }
                },
                required: ['relevance', 'depth', 'clarity', 'confidence', 'notes']
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
          evaluation: {
            ...parsed.evaluation,
            whatWasGood: 'Authentic response addressing the conversation.',
            whatWasMissing: 'Can articulate deeper quantitative metrics and edge cases.',
            mistakesOrErrors: 'None noted.',
            idealModelAnswer: currentPlanQ?.contextOrRationale || 'A structured architectural answer with trade-offs.'
          },
          audioBase64: ttsResult.audioBase64,
          audioFormat: ttsResult.format,
          fillerWordsFound,
          wordCount,
          advanceQuestion: parsed.action === 'next_question'
        };
      }
    } catch (err: any) {
      console.warn('[Turn Generation] Gemini turn warning, falling back to adaptive engine:', err.message);
    }
  }

  // -------------------------------------------------------------
  // INTELLIGENT CONTEXT-AWARE & EMPATHETIC ADAPTIVE ENGINE
  // -------------------------------------------------------------
  const normalizedMsg = candidateMessage.toLowerCase().trim();

  const isAdmittingNoAnswer =
    /\b(don't know|dont know|not sure|no idea|haven't worked with|havent worked|cannot answer|can't answer|skip this|move on|never used|unfamiliar|pass on this|have no clue)\b/i.test(normalizedMsg) ||
    (/\b(sorry|apologies)\b/i.test(normalizedMsg) && /\b(no|don't|dont|not|can't|cant|clue)\b/i.test(normalizedMsg));

  const isAskingToRepeat =
    userRequestedRepeat ||
    /\b(repeat|pardon|what was the question|say that again|could you repeat|didn't hear|did not hear|can you say|rephrase)\b/i.test(normalizedMsg);

  const isAskingForHint =
    userRequestedHint ||
    /\b(hint|clue|can you give me a hint|help me|stuck|give a clue)\b/i.test(normalizedMsg);

  const isMicCheck =
    /\b(can you hear me|hello|am i audible|test|testing|is this working|hope you can hear)\b/i.test(normalizedMsg) &&
    normalizedMsg.split(/\s+/).length <= 15;

  let reaction = 'Candidate response acknowledged.';
  let action: 'follow_up' | 'next_question' | 'clarify' | 'end' = 'follow_up';
  let next_utterance = '';

  if (isAdmittingNoAnswer) {
    action = 'next_question';
    reaction = 'Candidate admitted unfamiliarity; consoled with empathy and moved to next topic.';
    const isSeniorLevel = difficulty === 'Senior' || difficulty === 'Lead';
    const isBasicCategory = currentPlanQ?.category?.toLowerCase().includes('fundamental') || currentPlanQ?.category?.toLowerCase().includes('core');

    if (isSeniorLevel && isBasicCategory) {
      next_utterance = `No worries at all, I appreciate your honesty! To be candid, for a ${difficulty} position, this is a core building block you'll definitely want to review later, but don't sweat it today. Let's move right along to our next question: ${nextPlanQ ? nextPlanQ.question : 'What questions do you have for me?'}`;
    } else {
      next_utterance = `No problem at all, that's completely okay! Tech interviews cover a lot of ground, so don't stress over it. Let's pivot to our next area: ${nextPlanQ ? nextPlanQ.question : 'What questions do you have for me?'}`;
    }
  } else if (isAskingToRepeat) {
    action = 'clarify';
    reaction = 'Rephrased question in simpler, intuitive terms.';
    const qText = currentPlanQ?.question || 'Could you walk me through your technical background and experience?';
    next_utterance = `Sure, let me simplify that for you! In plain terms: ${qText.replace(/^(Could you |Can you |Please )/i, '').replace(/\?$/, '')}. How would you approach that in production?`;
  } else if (isAskingForHint) {
    action = 'clarify';
    reaction = 'Provided conceptual hint.';
    const hintKeywords = currentPlanQ?.expectedKeywords?.slice(0, 3).join(', ') || 'key architectural trade-offs';
    next_utterance = `Here is a hint to guide your thinking: Consider ${hintKeywords}. Think through how you would optimize for reliability, performance, and failure recovery.`;
  } else if (isMicCheck) {
    action = 'clarify';
    reaction = 'Confirmed audio reception with candidate.';
    const qText = currentPlanQ?.question || 'Please tell me a bit about yourself and your recent engineering projects.';
    next_utterance = `Yes, I can hear you loud and clear! Let's continue. ${qText}`;
  } else if (userRequestedChallenge) {
    action = 'follow_up';
    reaction = 'Challenging candidate with high-stakes scenario.';
    next_utterance = `Let's push further on this design: Imagine traffic surges by 20x during a peak event, causing connection pool exhaustion on your primary datastore. Walk me through your failover, shedding, and backpressure strategy.`;
  } else if (followUpCount === 0) {
    action = 'follow_up';
    reaction = 'Probing candidate with contextual technical follow-up.';
    if (currentPlanQ?.category?.toLowerCase().includes('intro') || currentPlanQ?.category?.toLowerCase().includes('warmup')) {
      next_utterance = `That gives me helpful context on your background. Building on that, what was the most demanding architectural problem you personally led in your recent projects, and what trade-offs did you make?`;
    } else {
      next_utterance = `That makes sense on the core design. How would your architecture guard against data inconsistency or race conditions if two concurrent updates hit that path at the exact same millisecond?`;
    }
  } else {
    // Advance to next planned question
    if (nextPlanQ) {
      action = 'next_question';
      reaction = 'Advancing to next planned question.';
      next_utterance = `Understood, that gives me a clear read on your approach. Let's move into our next area: ${nextPlanQ.question}`;
    } else {
      action = 'end';
      reaction = 'Interview plan complete.';
      next_utterance = `Thank you, ${candidateName}. We have covered all the core technical and architectural areas today. You did very well. What questions do you have for me about our tech stack, roadmap, or engineering culture at ${companyName}?`;
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
    relevance: isAdmittingNoAnswer ? 2 : Math.min(10, Math.max(5, 7 + (wordCount > 20 ? 1 : 0))),
    depth: isAdmittingNoAnswer ? 1 : Math.min(10, Math.max(5, 6 + (wordCount > 30 ? 2 : 1))),
    clarity: isAdmittingNoAnswer ? 7 : 8,
    confidence: isAdmittingNoAnswer ? 4 : 7.5,
    notes: isAdmittingNoAnswer
      ? 'Candidate acknowledged unfamiliarity with this topic. Transparent, but identifies a clear knowledge gap.'
      : `Candidate addressed ${currentPlanQ?.category || 'question'} with relevant context.`,
    whatWasGood: isAdmittingNoAnswer
      ? 'Honest admission without attempting to bluff or guess.'
      : 'Constructive response addressing the technical scenario.',
    whatWasMissing: isAdmittingNoAnswer
      ? 'Technical understanding and practical production experience on this core topic.'
      : 'Could provide more specific quantitative metrics and edge-case considerations.',
    mistakesOrErrors: isAdmittingNoAnswer ? 'Unable to provide technical approach.' : 'None noted.',
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
