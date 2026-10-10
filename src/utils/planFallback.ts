import { InterviewPlan } from '../types';
import { SEED_COMPANIES, SEED_ROLES } from '../data/seedData';

export function createAdaptiveInterviewPlanFallback(params: {
  candidateName: string;
  companyId: string;
  roleId: string;
  difficulty: string;
  interviewType: string;
  language: string;
  durationMinutes: number;
  skills: string[];
  parsedResume?: any;
}): InterviewPlan {
  const company = SEED_COMPANIES.find((c) => c.id === params.companyId) || SEED_COMPANIES[0];
  const role = SEED_ROLES.find((r) => r.id === params.roleId) || SEED_ROLES[0];
  const candidateName = params.candidateName || 'Candidate';
  const roleTitle = role.title;
  const companyName = company.name;

  return {
    interviewId: `plan-${Date.now()}`,
    candidateName,
    companyName,
    roleTitle,
    overview: `Comprehensive ${params.difficulty} level ${params.interviewType} interview for the ${roleTitle} position at ${companyName}. Focuses on architectural scalability, hands-on technical problem solving, clean code, and engineering leadership.`,
    warmupIntro: `Hello ${candidateName}, welcome to your ${companyName} interview for the ${roleTitle} role! I'm excited to speak with you today. To get started, could you briefly introduce yourself and share an engineering challenge you worked on recently that you're especially proud of?`,
    closingQuestion: `Thank you for sharing your experience today, ${candidateName}. We have covered technical depth, architecture, and problem solving. Do you have any questions for me about the team, our engineering scale, or tech stack?`,
    questions: [
      {
        id: 'q-plan-1',
        category: 'intro',
        question: `Could you walk me through the overall arc of your engineering journey—specifically, what was the most pivotal architectural transition you led or contributed to, and why did it shape how you design software today?`,
        contextOrRationale: 'Establishes technical seniority, architectural depth, and career trajectory.',
        suggestedDurationSeconds: 180,
        rubricCriteria: ['Clear technical narrative', 'Ownership of core architecture', 'Articulated lessons learned'],
        expectedKeywords: ['Architecture', 'Scale', 'Trade-offs', 'Ownership', 'Production']
      },
      {
        id: 'q-plan-2',
        category: 'resume deep-dive',
        question: `Looking at your background in ${params.skills.slice(0, 3).join(', ')}, could you walk me through a high-impact production service you engineered? What were the primary data flows, the toughest bottleneck you encountered, and how did you validate system reliability under load?`,
        contextOrRationale: 'Probes hands-on production engineering experience and validation strategies.',
        suggestedDurationSeconds: 240,
        rubricCriteria: ['Specific metrics cited', 'Root cause diagnosis', 'Load testing methodologies'],
        expectedKeywords: ['Latency', 'Throughput', 'Caching', 'Database', 'P99', 'Concurrency']
      },
      {
        id: 'q-plan-3',
        category: 'technical',
        question: `How do you implement an LRU (Least Recently Used) cache with O(1) time complexity for both get and put operations? What data structures do you combine and what concurrency control mechanisms would you apply for thread-safe access?`,
        contextOrRationale: 'Evaluates composite data structures, hash maps, doubly linked lists, and lock granularities.',
        suggestedDurationSeconds: 240,
        rubricCriteria: ['Hash map + Doubly Linked List integration', 'O(1) eviction mechanics', 'Thread safety awareness'],
        expectedKeywords: ['Hash Map', 'Doubly Linked List', 'O(1)', 'Mutex', 'Concurrency', 'Eviction']
      },
      {
        id: 'q-plan-4',
        category: 'scenario',
        question: `Design an idempotent payment processing endpoint that guarantees a customer is never double-charged during sudden mobile network drops, timeout retries, or repeated button clicks. Walk through your token generation, database transaction isolation, and distributed locking.`,
        contextOrRationale: 'Tests distributed transaction boundaries, idempotency keys, and database constraints.',
        suggestedDurationSeconds: 300,
        rubricCriteria: ['Unique idempotency key validation', 'Atomic database state transitions', 'Two-phase commit or distributed lock reasoning'],
        expectedKeywords: ['Idempotency Key', 'Atomic', 'Redis Lock', 'Transactions', 'ACID', 'Deduplication']
      },
      {
        id: 'q-plan-5',
        category: 'behavioral',
        question: `Tell me about a high-severity production outage or critical bug you were involved in troubleshooting. How did you coordinate the incident response, isolate the root cause under time pressure, and what post-mortem safeguards did you institute to prevent recurrence?`,
        contextOrRationale: 'Assesses composure under pressure, root cause analysis, and blameless post-mortem culture.',
        suggestedDurationSeconds: 240,
        rubricCriteria: ['STAR methodology', 'Systematic telemetry isolation', 'Preventative automated alerting'],
        expectedKeywords: ['Incident', 'Outage', 'Telemetry', 'Post-mortem', 'Observability', 'Safeguards']
      },
      {
        id: 'q-plan-6',
        category: 'fit',
        question: `At ${companyName}, engineers often balance rapid product delivery with long-term architectural stability. Describe a time when you had to navigate conflicting technical opinions with a senior peer or product manager regarding technical debt versus new features.`,
        contextOrRationale: 'Evaluates collaboration, conflict resolution, pragmatism, and communication clarity.',
        suggestedDurationSeconds: 180,
        rubricCriteria: ['Collaborative mindset', 'Data-driven persuasion', 'Business value alignment'],
        expectedKeywords: ['Trade-offs', 'Collaboration', 'Technical Debt', 'Alignment', 'Communication']
      }
    ]
  };
}
