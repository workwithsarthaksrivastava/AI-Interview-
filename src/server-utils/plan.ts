import { Type } from '@google/genai';
import { db, getGeminiClient } from './db.js';


export function generateAdaptiveInterviewPlan(params: {
  candidateName?: string;
  companyId?: string;
  roleId?: string;
  difficulty?: string;
  interviewType?: string;
  language?: string;
  durationMinutes?: number;
  skills?: string[];
  parsedResume?: any;
}) {
  const {
    candidateName = 'Candidate',
    companyId = 'google',
    roleId = 'sde-2',
    difficulty = 'Mid',
    parsedResume = null
  } = params;

  const company = db.companies.find((c) => c.id === companyId) || db.companies[0];
  const role = db.roles.find((r) => r.id === roleId) || db.roles[0];
  const roleTitle = role.title;
  const companyName = company.name;

  // 1. Spoken Greeting (Warmup Intro - spoken by interviewer upon joining room)
  const spokenGreetings = [
    `Hello ${candidateName}, welcome to your ${companyName} live interview for the ${roleTitle} position! I'm really glad to connect with you today. To get us oriented, could you introduce yourself briefly and highlight an engineering challenge you tackled recently that you're especially proud of?`,
    `Welcome ${candidateName}! It's great to have you here for this ${roleTitle} evaluation at ${companyName}. Before we dive into technical deep-dives and system architecture, could you give me a brief introduction to your background and what technical domains you've been working in lately?`,
    `Hi ${candidateName}, welcome! We have an exciting interview session lined up today for the ${roleTitle} role at ${companyName}. To kick things off smoothly, walk me through a quick overview of your background and the kind of engineering problems that energize you most.`
  ];
  const warmupIntro = spokenGreetings[Math.floor(Math.random() * spokenGreetings.length)];

  // Stage 1 Question: Career Arc & Architectural Ownership (distinct from spoken greeting!)
  const stage1Questions = [
    `Could you walk me through the overall arc of your engineering journey—specifically, what was the most pivotal architectural transition you led or contributed to, and why did it shape how you design software today?`,
    `Reflecting on your recent engineering work, could you walk me through a core feature or service you owned from conception to production, focusing on the key design decisions you made early on?`,
    `To establish technical context, what do you consider your greatest engineering breakthrough or milestone so far, and how did you navigate the trade-offs between delivery speed and system robustness?`
  ];
  const introQuestionText = stage1Questions[Math.floor(Math.random() * stage1Questions.length)];

  // 2. Stage 2: Resume Deep-Dive - dynamically customized based on candidate background
  let resumeQ = '';
  let resumeRationale = 'Probes real hands-on architectural experience from candidate background.';
  const projects = parsedResume?.projects || [];
  const experience = parsedResume?.experience || [];
  const resumeSkills = parsedResume?.skills || [];

  if (projects.length > 0) {
    const proj = projects[Math.floor(Math.random() * projects.length)];
    const techStr = proj.technologies?.length > 0 ? ` using ${proj.technologies.slice(0, 3).join(', ')}` : '';
    resumeQ = `In your resume, you highlighted '${proj.name}'${techStr}. Walk me through the high-level architecture: what were the primary data flows, the toughest operational bottleneck you encountered, and how you validated the system's reliability under load?`;
    resumeRationale = `Deep-dives into candidate project: ${proj.name}.`;
  } else if (experience.length > 0) {
    const exp = experience[0];
    resumeQ = `In your role as ${exp.role} at ${exp.company}, what was the most demanding technical problem you solved, and what specific quantitative metrics (latency, throughput, availability, or error budget) did you track to prove success?`;
    resumeRationale = `Explores candidate experience at ${exp.company}.`;
  } else if (resumeSkills.length > 0) {
    const skillsSubset = resumeSkills.slice(0, 3).join(', ');
    resumeQ = `Your profile highlights core strengths in ${skillsSubset}. Can you walk me through a production-grade service you engineered using these technologies, detailing the concurrency, storage, and failover constraints you had to solve?`;
  } else {
    const fallbackProjects = [
      `Walk me through the most complex distributed or multi-tier system you have personally engineered. What was the single biggest bottleneck in that design, and how did you resolve it?`,
      `Describe a high-throughput or latency-sensitive project you worked on recently. How did you structure the data pipelines and caching tiers to maintain sub-second P99 response times?`,
      `Tell me about an architectural decision in a past project where you had to push back on requirements or pivot designs due to unforeseen scale constraints. What was the technical trade-off?`
    ];
    resumeQ = fallbackProjects[Math.floor(Math.random() * fallbackProjects.length)];
  }

  // 3. Stage 3 & 4: Technical Fundamentals & Concepts (Tailored to role domain with large, varied pools)
  const roleLower = (role.id || '').toLowerCase();
  const titleLower = (role.title || '').toLowerCase();
  const isFrontend = roleLower.includes('frontend') || titleLower.includes('frontend') || titleLower.includes('ui');
  const isML = roleLower.includes('ml') || titleLower.includes('machine learning') || titleLower.includes('ai');
  const isFresher = roleLower.includes('fresher') || companyId === 'tcs' || companyId === 'infosys' || difficulty === 'Fresher';
  const isFullstack = roleLower.includes('fullstack') || titleLower.includes('full stack');
  const isDevOps = roleLower.includes('devops') || roleLower.includes('cloud') || titleLower.includes('infrastructure');

  let technicalPool: Array<{ question: string; rationale: string; rubric: string[]; keywords: string[] }> = [];

  if (isFrontend) {
    technicalPool = [
      {
        question: 'What are the Core Web Vitals (LCP, INP, CLS)? If a web application suffers from a poor Interaction to Next Paint (INP) score of 600ms, how do you diagnose and eliminate the long tasks causing it?',
        rationale: 'Tests modern web performance profiling and user responsiveness.',
        rubric: ['Long task breakdown', 'Chrome DevTools Performance profiling', 'Web Workers & requestIdleCallback'],
        keywords: ['INP', 'LCP', 'CLS', 'Web Vitals', 'Long Tasks', 'Web Workers']
      },
      {
        question: 'When designing component state in a large-scale React application, how do you decide between local state, context, server-state libraries (like React Query), and global stores (like Zustand or Redux)?',
        rationale: 'Evaluates state architecture and re-render optimization.',
        rubric: ['Server vs client state', 'Context re-render pitfalls', 'Zustand/Redux immutability'],
        keywords: ['State Management', 'React Query', 'Zustand', 'Context API', 'Re-render']
      },
      {
        question: 'How does React concurrent rendering handle interruptible state updates, and how does useTransition help keep interactive inputs responsive while rendering heavy background lists?',
        rationale: 'Tests modern React internals and fiber scheduling.',
        rubric: ['Concurrent mode scheduling', 'useTransition non-urgent updates', 'Fiber reconciliation'],
        keywords: ['useTransition', 'Concurrent Mode', 'Fiber', 'Suspense', 'Virtual DOM']
      },
      {
        question: 'How do you guarantee that a complex web application meets WCAG 2.1 AA accessibility standards? What are your core guidelines for keyboard navigation and screen reader semantics?',
        rationale: 'Verifies accessibility rigor and semantic HTML proficiency.',
        rubric: ['Semantic HTML', 'ARIA attributes (when needed)', 'Color contrast & tabIndex management'],
        keywords: ['WCAG', 'ARIA', 'Accessibility', 'Keyboard Navigation', 'Semantic HTML']
      },
      {
        question: 'Explain how the browser critical rendering path works. What causes layout thrashing and reflows, and how do you write CSS and JavaScript to trigger only composite-layer animations (GPU)?',
        rationale: 'Tests low-level browser rendering engine mechanics.',
        rubric: ['DOM & CSSOM construction', 'Render tree, layout, paint, composite', 'transform vs top/left performance'],
        keywords: ['Critical Rendering Path', 'Layout Thrashing', 'Reflow', 'GPU Composite', 'CSSOM']
      },
      {
        question: 'How do you implement micro-frontends or module federation without blowing up bundle sizes or duplicating shared runtime dependencies like React across multiple teams?',
        rationale: 'Evaluates enterprise frontend architecture and Module Federation.',
        rubric: ['Webpack/Vite Module Federation', 'Shared singletons in host/remotes', 'Independent deployment & version mismatch handling'],
        keywords: ['Module Federation', 'Microfrontends', 'Shared Dependencies', 'Bundle Splitting']
      }
    ];
  } else if (isML) {
    technicalPool = [
      {
        question: 'In a production Retrieval-Augmented Generation (RAG) system, what strategies do you employ to improve chunk retrieval precision and prevent hallucinations across enterprise documents?',
        rationale: 'Tests modern generative AI architecture and vector search.',
        rubric: ['Hybrid search (BM25 + Dense)', 'Re-ranking cross-encoders', 'Chunking strategies & metadata filtering'],
        keywords: ['RAG', 'Vector Search', 'Embeddings', 'Re-ranking', 'Hallucinations']
      },
      {
        question: 'Explain the difference between LoRA (Low-Rank Adaptation) and full parameter fine-tuning of Large Language Models. Why does LoRA drastically cut GPU VRAM requirements?',
        rationale: 'Evaluates parameter-efficient fine-tuning mechanics.',
        rubric: ['Rank-decomposition matrices', 'Frozen base weights', 'Optimizer state memory savings'],
        keywords: ['LoRA', 'Fine-tuning', 'VRAM', 'Rank Decomposition', 'Weights']
      },
      {
        question: 'How do you optimize LLM inference latency and throughput in production? Touch on KV-caching, continuous batching, and quantization (FP8 / INT4).',
        rationale: 'Tests model serving efficiency and GPU throughput.',
        rubric: ['KV-cache memory management', 'Continuous batching (vLLM)', 'Quantization trade-offs'],
        keywords: ['KV-Cache', 'Quantization', 'Inference', 'vLLM', 'Throughput']
      },
      {
        question: 'How do you detect and mitigate data drift and concept drift in a real-time recommendation or classification pipeline serving millions of queries daily?',
        rationale: 'Assesses MLOps observability and production model reliability.',
        rubric: ['Kolmogorov-Smirnov test / PSI', 'Feature drift dashboards', 'Automated shadow retraining pipelines'],
        keywords: ['Data Drift', 'Concept Drift', 'PSI', 'Shadow Deployment', 'MLOps']
      }
    ];
  } else if (isDevOps) {
    technicalPool = [
      {
        question: 'How do you design a zero-downtime blue-green or canary release pipeline in Kubernetes, and what automated health metrics determine whether to promote traffic or initiate an immediate rollback?',
        rationale: 'Tests progressive delivery and Kubernetes release safety.',
        rubric: ['Argo Rollouts / Flagger', 'Error budget and P99 latency gates', 'Automated rollback automation'],
        keywords: ['Canary Deployment', 'Blue-Green', 'Kubernetes', 'Prometheus Metrics', 'Rollback']
      },
      {
        question: 'How do you troubleshoot a Kubernetes cluster where pods are intermittently getting evicted or failing with CrashLoopBackOff and OOMKilled errors under sudden traffic spikes?',
        rationale: 'Tests Linux kernel cgroups, memory limits, and Kubernetes resource scheduling.',
        rubric: ['cgroups memory limits vs requests', 'dmesg / kernel OOM killer logs', 'HPA tuning and VPA analysis'],
        keywords: ['OOMKilled', 'CrashLoopBackOff', 'cgroups', 'Resource Limits', 'HPA']
      },
      {
        question: 'How do you architect multi-region disaster recovery for an active-passive or active-active cloud infrastructure with an RPO of under 1 minute and RTO of under 5 minutes?',
        rationale: 'Evaluates enterprise disaster recovery and cloud resilience.',
        rubric: ['Cross-region DB asynchronous replication', 'DNS failover (Route 53 / Cloud DNS health checks)', 'Infrastructure as Code parity (Terraform)'],
        keywords: ['RPO', 'RTO', 'Disaster Recovery', 'Active-Active', 'Terraform']
      }
    ];
  } else if (isFresher) {
    technicalPool = [
      {
        question: 'What are the four pillars of Object-Oriented Programming (OOP)? Could you explain runtime polymorphism with a clear real-world code example?',
        rationale: 'Assesses core object-oriented principles and method dispatch.',
        rubric: ['Encapsulation, Abstraction, Inheritance, Polymorphism', 'Method overriding vs overloading', 'Dynamic method dispatch'],
        keywords: ['Polymorphism', 'Inheritance', 'Encapsulation', 'Abstraction', 'Overriding']
      },
      {
        question: 'What is the difference between an inner join, left outer join, and full outer join in SQL? How do database indexes (like B-trees) speed up query lookups on large tables?',
        rationale: 'Tests relational database querying and indexing fundamentals.',
        rubric: ['Join mechanics and NULL handling', 'B-tree index lookups vs full table scans', 'Query execution plan awareness'],
        keywords: ['SQL', 'Inner Join', 'Left Join', 'B-Tree Index', 'DBMS']
      },
      {
        question: 'How do you analyze the time and space complexity of sorting algorithms like QuickSort and MergeSort? In what scenarios is MergeSort preferred over QuickSort?',
        rationale: 'Verifies Big-O algorithm analysis and memory trade-offs.',
        rubric: ['O(N log N) average vs worst-case', 'Auxiliary space O(N) vs in-place', 'Stability in sorting'],
        keywords: ['QuickSort', 'MergeSort', 'Big-O', 'Time Complexity', 'Space Complexity']
      },
      {
        question: 'What are ACID properties in database transactions? Explain how isolation levels protect against dirty reads and concurrent modification anomalies.',
        rationale: 'Tests transaction consistency and database fundamentals.',
        rubric: ['Atomicity, Consistency, Isolation, Durability', 'Dirty read explanation', 'Rollback mechanics'],
        keywords: ['ACID', 'Atomicity', 'Isolation', 'Durability', 'Transactions']
      },
      {
        question: 'How does memory stack vs heap allocation work in modern languages? What causes a stack overflow error versus an out-of-memory heap error?',
        rationale: 'Tests basic computer architecture and memory segments.',
        rubric: ['Stack frame call stack lifecycle', 'Heap dynamic memory allocation', 'Recursion depth vs memory exhaustion'],
        keywords: ['Stack vs Heap', 'Memory Allocation', 'Stack Overflow', 'Recursion']
      }
    ];
  } else if (isFullstack) {
    technicalPool = [
      {
        question: 'Describe the complete lifecycle of an HTTP/HTTPS request from the instant a user hits Enter in the browser until the page renders, touching on DNS, TLS 1.3, TCP handshake, and DOM construction.',
        rationale: 'Verifies holistic full-stack networking and browser rendering understanding.',
        rubric: ['DNS resolution & caching', 'TLS handshake', 'HTTP request-response cycle', 'Critical rendering path'],
        keywords: ['DNS', 'TLS Handshake', 'HTTP/2', 'DOM', 'Rendering Engine']
      },
      {
        question: 'How do you architect an idempotent payment or order submission endpoint so that network timeouts and repeated clicks never double-charge a user?',
        rationale: 'Tests distributed idempotency and transaction boundaries.',
        rubric: ['Idempotency keys in Redis/DB', 'Unique constraint enforcement', 'Atomic status transitions'],
        keywords: ['Idempotency', 'Payment Gateway', 'Distributed Lock', 'Atomic Transaction']
      },
      {
        question: 'When designing a RESTful API vs a GraphQL schema for a client with fluctuating mobile connectivity, what are the primary trade-offs you evaluate regarding over-fetching, caching, and rate limiting?',
        rationale: 'Assesses API design and mobile optimization trade-offs.',
        rubric: ['Over-fetching and under-fetching', 'HTTP CDN caching in REST vs POST in GraphQL', 'Query complexity analysis'],
        keywords: ['GraphQL', 'REST', 'Caching', 'Over-fetching', 'API Design']
      },
      {
        question: 'How do you handle real-time bi-directional synchronization between client and server? Compare WebSockets, Server-Sent Events (SSE), and Long Polling in terms of overhead, proxy buffering, and reconnection resilience.',
        rationale: 'Evaluates real-time protocol selection and edge networking.',
        rubric: ['WebSocket full-duplex vs SSE HTTP/2 multiplexing', 'Reconnection and missed message replay', 'Heartbeats and load balancer timeouts'],
        keywords: ['WebSockets', 'Server-Sent Events', 'Long Polling', 'Real-time Sync']
      }
    ];
  } else {
    // SDE II / Backend / Distributed Systems (Rich diverse technical pool)
    technicalPool = [
      {
        question: 'How do you implement an LRU (Least Recently Used) cache with O(1) time complexity for both get and put operations? What data structures do you combine and why?',
        rationale: 'Tests data structure mastery and composite memory structures.',
        rubric: ['Hash map for O(1) lookup', 'Doubly linked list for O(1) eviction/insertion', 'Concurrency thread-safety considerations'],
        keywords: ['LRU Cache', 'Doubly Linked List', 'Hash Map', 'O(1) Time Complexity']
      },
      {
        question: 'How do you handle data consistency and concurrency control when multiple distributed microservices attempt to update the same record concurrently?',
        rationale: 'Tests distributed locks, isolation levels, and idempotency.',
        rubric: ['Optimistic locking with version numbers', 'Redis distributed locks (Redlock)', 'Saga pattern or 2PC trade-offs'],
        keywords: ['Optimistic Locking', 'Distributed Lock', 'Idempotency', 'Concurrency']
      },
      {
        question: 'How do memory management and garbage collection work in your primary language runtime (e.g. V8 or JVM)? What tools and metrics do you use to diagnose a slow memory leak in production?',
        rationale: 'Verifies runtime internals and production APM observability.',
        rubric: ['Generational GC / heap vs stack', 'Heap snapshot differential analysis', 'APM metrics (heapUsed, GC pause times)'],
        keywords: ['Garbage Collection', 'Memory Leak', 'Heap Snapshot', 'V8 Engine', 'Profiling']
      },
      {
        question: 'Explain the difference between optimistic locking and pessimistic locking. In a high-throughput flash sale service with limited inventory, which approach would you choose and why?',
        rationale: 'Evaluates database transaction design under extreme write contention.',
        rubric: ['Row-level exclusive locks vs version checks', 'Throughput vs retry overhead', 'Redis reservation pre-deduction pattern'],
        keywords: ['Optimistic Locking', 'Pessimistic Locking', 'Flash Sale', 'Throughput']
      },
      {
        question: 'What is the difference between an LSM-Tree (Log-Structured Merge-Tree used in Cassandra/RocksDB) and a B+ Tree (used in PostgreSQL/MySQL)? In what write vs read workloads does each shine?',
        rationale: 'Tests database storage engine internals and sequential vs random I/O.',
        rubric: ['Sequential append-only writes vs random page writes', 'Compaction overhead and write amplification', 'Point lookup vs range scan trade-offs'],
        keywords: ['LSM-Tree', 'B+ Tree', 'Write Amplification', 'Compaction', 'Sequential I/O']
      },
      {
        question: 'How does consistent hashing work with virtual nodes? How does it prevent hotspot skew when cluster nodes are added or removed dynamically?',
        rationale: 'Tests distributed data partitioning and load balancing.',
        rubric: ['Hash ring mechanics', 'Virtual node mapping for uniform distribution', 'Minimal key remapping on node join/leave'],
        keywords: ['Consistent Hashing', 'Virtual Nodes', 'Hash Ring', 'Partitioning', 'Hotspots']
      }
    ];
  }

  // Shuffle and pick 2 distinct technical questions
  const shuffledTech = [...technicalPool].sort(() => Math.random() - 0.5);
  const tech1 = shuffledTech[0];
  const tech2 = shuffledTech[1] || shuffledTech[0];

  // 4. Stage 5: Practical Architecture Scenario (Rich role and scale-specific pools)
  let scenarioQ = {
    question: `Imagine a flash sale where 50,000 concurrent buyers click checkout on 100 inventory items in 2 seconds. How do you design the reservation, inventory deduction, and payment pipeline to prevent overselling while keeping latency under 100ms?`,
    rationale: `Evaluates distributed inventory reservation under high contention.`,
    rubric: [`Redis Lua script atomic decrements`, `Asynchronous payment queuing`, `Compensating transactions for expired holds`],
    keywords: [`Atomic Decrement`, `Redis Lua`, `Inventory Reservation`, `High Concurrency`, `Queue`]
  };

  if (isFrontend) {
    const frontendScenarios = [
      {
        question: `Imagine you need to render a real-time data table with 50,000 updating rows per second without freezing the UI thread. How would you design the virtualization, throttling, and web worker offloading?`,
        rationale: `Tests high-frequency frontend rendering and web worker parallelism.`,
        rubric: [`Windowing / virtualization (react-window)`, `requestAnimationFrame batching`, `OffscreenCanvas or Web Workers for data diffing`],
        keywords: [`Virtualization`, `Web Workers`, `requestAnimationFrame`, `UI Performance`, `Batching`]
      },
      {
        question: `Imagine building an offline-first collaborative document editor (like Google Docs or Notion). How do you handle local state persistence, optimistic UI updates, and real-time conflict resolution when reconnecting?`,
        rationale: `Tests offline-first architecture, IndexedDB, and Conflict-free Replicated Data Types (CRDTs).`,
        rubric: ['IndexedDB local caching', 'CRDTs or Operational Transformation', 'Reconnection sync queue and conflict merge'],
        keywords: ['CRDTs', 'IndexedDB', 'Offline-First', 'Optimistic UI', 'Sync']
      }
    ];
    scenarioQ = frontendScenarios[Math.floor(Math.random() * frontendScenarios.length)];
  } else if (isML) {
    scenarioQ = {
      question: `Imagine you are deploying an enterprise search copilot over 10 million confidential documents. How do you design the vector index, hybrid search pipeline, and safety guardrails to ensure sub-300ms latency and zero PII leaks?`,
      rationale: `Tests scalable enterprise generative AI system design.`,
      rubric: [`HNSW vector indexing`, `Hybrid search with reranking`, `PII masking and output guardrails`],
      keywords: [`HNSW`, `Vector Index`, `Guardrails`, `Latency`, `PII Masking`]
    };
  } else if (isFresher) {
    const fresherScenarios = [
      {
        question: `Imagine you are building an online bookstore where users search books by title, author, or category. As the catalog grows to 5 million records, searches take several seconds. What indexing, caching, and database query optimizations would you implement?`,
        rationale: `Assesses database indexing, query optimization, and basic caching.`,
        rubric: [`Database indexes on search columns`, `Redis caching for popular searches`, `Avoiding SELECT * and full table scans`],
        keywords: [`Indexes`, `Caching`, `Redis`, `Query Optimization`, `SQL`]
      },
      {
        question: `Imagine you need to design a simple file upload and download service for a college portal that supports 1,000 students submitting assignments simultaneously. How do you structure the API, storage, and validation to prevent server crashes?`,
        rationale: `Tests basic full-stack API architecture and file storage handling.`,
        rubric: ['Streaming file upload / cloud object storage', 'File size & extension validation', 'Database metadata record tracking'],
        keywords: ['File Upload', 'Streaming', 'Object Storage', 'Validation', 'API Design']
      }
    ];
    scenarioQ = fresherScenarios[Math.floor(Math.random() * fresherScenarios.length)];
  } else {
    const backendScenarios = [
      {
        question: `Imagine a flash sale where 50,000 concurrent buyers click checkout on 100 inventory items in 2 seconds. How do you design the reservation, inventory deduction, and payment pipeline to prevent overselling while keeping latency under 100ms?`,
        rationale: `Evaluates distributed inventory reservation under high contention.`,
        rubric: [`Redis Lua script atomic decrements`, `Asynchronous payment queuing`, `Compensating transactions for expired holds`],
        keywords: [`Atomic Decrement`, `Redis Lua`, `Inventory Reservation`, `High Concurrency`, `Queue`]
      },
      {
        question: `Imagine we need to design a distributed URL shortener service handling 100 million new URLs per day with 1 billion daily redirects. How would you design the key generation, database partitioning, and caching layers?`,
        rationale: `Classic distributed system design testing capacity planning and key generation.`,
        rubric: [`Base62 encoding with Snowflake ID generator`, `Consistent hashing database partitioning`, `Redis cache for top 20% URLs`],
        keywords: [`URL Shortener`, `Base62`, `Consistent Hashing`, `Redis Cache`, `Capacity Planning`]
      },
      {
        question: `Imagine designing a real-time ride-sharing matching engine (like Uber or Lyft) tracking 500,000 active drivers and riders with geospatial updates every 3 seconds. How do you architect the geospatial indexing, location ingestion, and match dispatching?`,
        rationale: `Tests geospatial data structures (H3, S2, Geohash) and high-throughput real-time streaming.`,
        rubric: ['Geospatial indexing (H3 / S2 / Redis GEO)', 'Kafka location telemetry ingestion', 'Sub-second driver match dispatch queue'],
        keywords: ['Geospatial Indexing', 'H3', 'Kafka', 'Redis GEO', 'Real-Time Dispatch']
      }
    ];
    scenarioQ = backendScenarios[Math.floor(Math.random() * backendScenarios.length)];
  }

  // 5. Stage 6: Behavioral (STAR method, tailored to company culture with rich pools)
  let behavioralQ = {
    question: `Tell me about a time when a critical bug or latency regression occurred in production on a system you owned. How did you troubleshoot it under pressure, and what remediation steps did you introduce?`,
    rationale: `Assesses STAR response, incident triage, and blameless post-mortem culture.`,
    rubric: [`Structured STAR delivery`, `Observability troubleshooting`, `Preventative post-mortem actions`],
    keywords: [`Incident`, `Observability`, `Post-mortem`, `Root Cause`, `Mitigation`]
  };

  if (companyId === 'amazon') {
    const amazonBehaviorals = [
      {
        question: `Tell me about a time when you had to make a high-stakes technical decision with incomplete information and under a tight deadline. How did you assess the risk, and what was the outcome? (Amazon Bias for Action & Dive Deep)`,
        rationale: `Evaluates Amazon Leadership Principles: Bias for Action and Dive Deep.`,
        rubric: [`One-way vs two-way door framework`, `Mitigation and rollback strategy`, `Quantified business outcome`],
        keywords: [`Bias for Action`, `Dive Deep`, `Two-way door`, `Risk Assessment`, `Metrics`]
      },
      {
        question: `Describe a situation where you had to push back on a product manager or senior leadership because a requested launch would sacrifice long-term scalability or security. How did you handle that disagreement? (Customer Obsession & Have Backbone)`,
        rationale: `Assesses Amazon LP: Customer Obsession, Earn Trust, and Have Backbone.`,
        rubric: [`Data-backed technical pushback`, `Customer-first rationale`, `Constructive alignment`],
        keywords: [`Customer Obsession`, `Have Backbone`, `Earn Trust`, `Trade-offs`]
      }
    ];
    behavioralQ = amazonBehaviorals[Math.floor(Math.random() * amazonBehaviorals.length)];
  } else if (companyId === 'google') {
    const googleBehaviorals = [
      {
        question: `Describe a time when you received tough technical criticism on your design or code during a peer review. How did you process that feedback in the moment, and what specific improvements did you make?`,
        rationale: `Tests Googleyness, intellectual humility, and constructive collaboration.`,
        rubric: [`Non-defensive active listening`, `Objective technical iteration`, `Positive team dynamic`],
        keywords: [`Googleyness`, `Feedback`, `Code Review`, `Collaboration`, `Humility`]
      },
      {
        question: `Tell me about a time when you championed a significant technical refactoring or code health initiative that did not deliver immediate user-facing features. How did you justify the investment to your team and leadership?`,
        rationale: `Tests Googleyness, code health stewardship, and 10x long-term thinking.`,
        rubric: ['Quantifying technical debt', 'Demonstrating developer velocity impact', 'Incremental delivery strategy'],
        keywords: ['Code Health', 'Refactoring', 'Technical Debt', 'Googleyness']
      }
    ];
    behavioralQ = googleBehaviorals[Math.floor(Math.random() * googleBehaviorals.length)];
  } else if (companyId === 'microsoft') {
    behavioralQ = {
      question: `Tell me about a time when an architectural choice or feature you delivered did not meet user expectations or failed in production. How did you embrace a growth mindset to learn and iterate?`,
      rationale: `Evaluates Microsoft Growth Mindset and resilience under failure.`,
      rubric: [`Growth mindset reflection`, `Blameless root cause analysis`, `Continuous improvement`],
      keywords: [`Growth Mindset`, `Resilience`, `Learning`, `Customer Empathy`]
    };
  } else if (companyId === 'tcs' || companyId === 'infosys') {
    behavioralQ = {
      question: `Tell me about a situation in a team project where you had to adapt quickly to an unfamiliar programming language, framework, or tight project milestone. How did you approach the learning curve?`,
      rationale: `Assesses adaptability, self-learning capability, and teamwork.`,
      rubric: [`Proactive self-learning approach`, `Seeking timely guidance`, `Delivering project milestones`],
      keywords: [`Adaptability`, `Learning Curve`, `Teamwork`, `Agile`, `Deadlines`]
    };
  } else {
    // Startup / Fast-Paced
    behavioralQ = {
      question: `In a fast-paced environment with ambiguous requirements, tell me about a time you had to take extreme ownership of a feature outside your comfort zone and deliver it from 0 to 1. What was the toughest hurdle?`,
      rationale: `Assesses extreme ownership and high agency in startup environments.`,
      rubric: [`High agency`, `Rapid pragmatic delivery`, `Navigating ambiguity`],
      keywords: [`Extreme Ownership`, `0 to 1`, `Ambiguity`, `High Agency`]
    };
  }

  // 6. Stage 7: Culture & Bar-Raiser Fit
  let fitQ = {
    question: `How do you navigate technical disagreements with peers or senior architects when you hold differing views on an architectural direction?`,
    rationale: `Evaluates collaboration, data-driven persuasion, and disagree-and-commit attitude.`,
    rubric: [`Data-driven consensus`, `Active listening`, `Disagree and commit`],
    keywords: [`Trade-offs`, `Prototypes`, `Collaboration`, `Alignment`]
  };

  if (companyId === 'amazon') {
    fitQ = {
      question: `Amazon's 'Have Backbone; Disagree and Commit' principle values constructive debate. Tell me about a time you vigorously challenged an architectural decision, but then fully committed once the final decision was made.`,
      rationale: `Assesses Amazon LP: Have Backbone; Disagree and Commit.`,
      rubric: [`Constructive data-backed debate`, `Putting team first`, `100% commitment to execution`],
      keywords: [`Disagree and Commit`, `Leadership Principles`, `Team First`, `Ownership`]
    };
  } else if (companyId === 'google') {
    fitQ = {
      question: `At Google, we prioritize user-first engineering and 10x thinking. How do you balance shipping fast versus maintaining planetary-scale reliability and code health?`,
      rationale: `Evaluates balance between velocity, user trust, and long-term maintainability.`,
      rubric: [`Technical debt management`, `Respect for the user`, `Long-term architectural sustainability`],
      keywords: [`Googleyness`, `User First`, `Code Health`, `Scalability`, `Technical Debt`]
    };
  }

  // 7. Stage 8: Closing
  const closingQText = `We have covered substantial ground today across architecture, problem-solving, and team dynamics. What questions do you have for me about our tech stack, upcoming roadmap, or engineering standards at ${companyName}?`;

  return {
    interviewId: `plan-${Date.now()}`,
    candidateName,
    companyName,
    roleTitle,
    overview: `Tailored 8-question ${roleTitle} evaluation at ${companyName} (${difficulty} level).`,
    warmupIntro,
    closingQuestion: closingQText,
    questions: [
      {
        id: `q-plan-1-${Date.now()}`,
        category: 'intro',
        question: introQuestionText,
        contextOrRationale: 'Assesses career narrative, motivation, and communication clarity.',
        suggestedDurationSeconds: 180,
        rubricCriteria: ['Concise narrative', 'Clear career arc', 'Authentic motivation'],
        expectedKeywords: ['Experience', 'Growth', 'Impact', 'Architecture']
      },
      {
        id: `q-plan-2-${Date.now()}`,
        category: 'resume deep-dive',
        question: resumeQ,
        contextOrRationale: resumeRationale,
        suggestedDurationSeconds: 240,
        rubricCriteria: ['Specific trade-offs', 'Metric-backed outcomes', 'Technical ownership'],
        expectedKeywords: ['Trade-offs', 'Bottleneck', 'Latency', 'Reliability']
      },
      {
        id: `q-plan-3-${Date.now()}`,
        category: 'technical',
        question: tech1.question,
        contextOrRationale: tech1.rationale,
        suggestedDurationSeconds: 240,
        rubricCriteria: tech1.rubric,
        expectedKeywords: tech1.keywords
      },
      {
        id: `q-plan-4-${Date.now()}`,
        category: 'technical',
        question: tech2.question,
        contextOrRationale: tech2.rationale,
        suggestedDurationSeconds: 210,
        rubricCriteria: tech2.rubric,
        expectedKeywords: tech2.keywords
      },
      {
        id: `q-plan-5-${Date.now()}`,
        category: 'scenario',
        question: scenarioQ.question,
        contextOrRationale: scenarioQ.rationale,
        suggestedDurationSeconds: 300,
        rubricCriteria: scenarioQ.rubric,
        expectedKeywords: scenarioQ.keywords
      },
      {
        id: `q-plan-6-${Date.now()}`,
        category: 'behavioral',
        question: behavioralQ.question,
        contextOrRationale: behavioralQ.rationale,
        suggestedDurationSeconds: 240,
        rubricCriteria: behavioralQ.rubric,
        expectedKeywords: behavioralQ.keywords
      },
      {
        id: `q-plan-7-${Date.now()}`,
        category: 'fit',
        question: fitQ.question,
        contextOrRationale: fitQ.rationale,
        suggestedDurationSeconds: 200,
        rubricCriteria: fitQ.rubric,
        expectedKeywords: fitQ.keywords
      },
      {
        id: `q-plan-8-${Date.now()}`,
        category: 'closing',
        question: closingQText,
        contextOrRationale: 'Gauges candidate curiosity, engineering standards, and role interest.',
        suggestedDurationSeconds: 180,
        rubricCriteria: ['Thoughtful questions', 'Genuine technical curiosity'],
        expectedKeywords: ['Roadmap', 'Culture', 'Architecture', 'Team']
      }
    ]
  };
}

export async function generateInterviewPlanWithGemini(params: any) {
  const {
    candidateName = 'Candidate',
    companyId,
    roleId,
    difficulty = 'Mid',
    interviewType = 'Technical',
    language = 'English',
    durationMinutes = 30,
    skills = [],
    parsedResume = null
  } = params;

  const company = db.companies.find((c) => c.id === companyId) || db.companies[0];
  const role = db.roles.find((r) => r.id === roleId) || db.roles[0];

  const gemini = getGeminiClient();
  if (!gemini) {
    return generateAdaptiveInterviewPlan(params);
  }

  const resumeDetails = parsedResume
    ? `Summary: ${parsedResume.summary || ''}
Experience: ${(parsedResume.experience || []).map((e: any) => `${e.role} at ${e.company} (${(e.highlights || []).slice(0, 2).join('; ')})`).join('\n')}
Projects: ${(parsedResume.projects || []).map((p: any) => `${p.name}: ${p.description}`).join('\n')}
Skills: ${(parsedResume.skills || skills).join(', ')}`
    : `Skills: ${skills.slice(0, 10).join(', ')}`;

  const prompt = `You are a Principal Bar-Raiser and Lead Interviewer at ${company.name} designing a comprehensive, role-specific live mock interview plan.
Candidate: ${candidateName}
Role: ${role.title}
Difficulty Level: ${difficulty}
Round Type: ${interviewType}
Target Duration: ${durationMinutes} minutes
Language: ${language}
Company Tone: ${company.personaProfile?.tone || 'Rigorous & Technical'}
Company Focus Areas: ${company.personaProfile?.focusAreas?.join(', ') || 'Scalability, Clean Code'}

Candidate Background & Resume Details:
"""
${resumeDetails}
"""

Generate an 8-to-12 question interview plan covering these EXACT 7 stages in order:
1. "intro": Warm Welcome & background probe (1 question)
2. "resume deep-dive": In-depth investigation of candidate's past projects, architectural decisions, and technologies claimed on resume (1-2 questions)
3. "technical": Core technical concepts, fundamentals, and language internals (2-3 questions)
4. "scenario": Practical architecture / high-throughput / coding scenario (1-2 questions)
5. "behavioral": Conflict resolution, handling production outages, ownership (STAR method) (1-2 questions)
6. "fit": Team dynamics, communication, and culture fit at ${company.name} (1 question)
7. "closing": Wrap-up & welcoming candidate questions (1 question)

Return structured JSON. Every question must be distinct, non-repetitive, and deeply relevant to ${role.title}.`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            warmupIntro: { type: Type.STRING },
            closingQuestion: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  question: { type: Type.STRING },
                  contextOrRationale: { type: Type.STRING },
                  suggestedDurationSeconds: { type: Type.NUMBER },
                  rubricCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
                  expectedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['id', 'category', 'question', 'contextOrRationale', 'suggestedDurationSeconds', 'rubricCriteria', 'expectedKeywords']
              }
            }
          },
          required: ['overview', 'warmupIntro', 'closingQuestion', 'questions']
        }
      }
    });

    const planData = JSON.parse(response.text || '{}');
    return {
      interviewId: `plan-${Date.now()}`,
      candidateName,
      companyName: company.name,
      roleTitle: role.title,
      ...planData
    };
  } catch (err) {
    console.warn('Gemini plan error, using adaptive fallback:', err);
    return generateAdaptiveInterviewPlan(params);
  }
}
