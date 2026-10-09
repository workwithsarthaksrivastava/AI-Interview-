import { Company, Role, QuestionItem, AdminSettings, AvailabilitySlot, EvaluationReport } from '../types';

export const SEED_COMPANIES: Company[] = [
  {
    id: 'google',
    name: 'Google',
    logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80',
    industry: 'Cloud, Search & AI Infrastructure',
    hiringStyle: 'Googleyness & Leadership, Scalable Distributed Systems, Edge-Case Rigor',
    typicalRounds: ['Coding & Algorithms (2 rounds)', 'System Architecture & Scale (1 round)', 'Googleyness & Behavioral (1 round)'],
    personaProfile: {
      focusAreas: ['Distributed Systems', 'Algorithmic Complexity (Big-O)', 'Trade-off Analysis', 'Open-ended problem solving'],
      difficulty: 'Senior',
      tone: 'Analytical & Academic',
      typicalQuestionStyles: ['Ambiguous problem formulation', 'Scale from 10k to 10M QPS', 'Deep-dive into failure modes'],
      coreValues: ['Respect the user', 'Respect the opportunity', 'Think 10x, not 10%'],
      hiringBarCriteria: ['Clean code without helper libraries', 'Zero hand-waving on concurrency and scale', 'Intellectual humility']
    },
    active: true
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://images.unsplash.com/photo-1523474253246-63e03d381ad5?w=128&auto=format&fit=crop&q=80',
    industry: 'E-Commerce & AWS Cloud Services',
    hiringStyle: '16 Leadership Principles (LPs), Bar Raiser mechanism, Pragmatic engineering with metrics',
    typicalRounds: ['Technical Screen (1 round)', 'Behavioral LP Deep Dive (2 rounds)', 'System Design / OOD (1 round)', 'Bar Raiser (1 round)'],
    personaProfile: {
      focusAreas: ['Customer Obsession', 'Ownership', 'Dive Deep', 'Frugality & Resilient Architecture'],
      difficulty: 'Senior',
      tone: 'Fast-Paced & Metric-Driven',
      typicalQuestionStyles: ['Give me an example of when you disagreed and committed', 'Design a scalable order fulfillment tracker', 'How do you measure latency percentiles?'],
      coreValues: ['Customer Obsession', 'Bias for Action', 'Deliver Results', 'Have Backbone; Disagree and Commit'],
      hiringBarCriteria: ['Explicit STAR format with quantitative metrics', 'Clear trade-off reasoning between latency and cost']
    },
    active: true
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://images.unsplash.com/photo-1642132652075-2b23412776c5?w=128&auto=format&fit=crop&q=80',
    industry: 'Enterprise Cloud, Productivity & AI',
    hiringStyle: 'Growth Mindset, Customer Empathy, Enterprise Reliability, Clean maintainable code',
    typicalRounds: ['Technical Fundamentals (2 rounds)', 'System Design & Azure paradigms (1 round)', 'As-Appropriate (AA) Exec round (1 round)'],
    personaProfile: {
      focusAreas: ['Growth Mindset', 'Object-Oriented Design', 'Security & Backward Compatibility', 'Collaborative problem solving'],
      difficulty: 'Mid',
      tone: 'Friendly & Conversational',
      typicalQuestionStyles: ['How would you refactor legacy services without downtime?', 'Describe a time you learned from a production bug', 'Design a real-time collaborative doc editor'],
      coreValues: ['Empower every person and organization', 'Diversity and inclusion', 'Customer-centricity'],
      hiringBarCriteria: ['Demonstrated willingness to iterate and accept feedback', 'Solid testing mindset (unit, integration, load)']
    },
    active: true
  },
  {
    id: 'tcs',
    name: 'Tata Consultancy Services (TCS)',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80',
    industry: 'IT Services, Enterprise Transformation & Consulting',
    hiringStyle: 'TCS NQT / Digital / Innovator streams, Strong foundational concepts, Process adherence, Client-readiness',
    typicalRounds: ['Online Assessment', 'Technical Evaluation (Data Structures, OOP, SQL)', 'Managerial & HR Round'],
    personaProfile: {
      focusAreas: ['Core Java / Python / C++', 'Database Normalization & SQL Queries', 'OOP Principles', 'Adaptability to client shift/projects'],
      difficulty: 'Fresher',
      tone: 'Friendly & Conversational',
      typicalQuestionStyles: ['Explain polymorphism with real-world examples', 'Write a SQL query for second highest salary', 'Are you flexible with project location and shifts?'],
      coreValues: ['Integrity', 'Excellence', 'Respect for individual', 'Pioneering'],
      hiringBarCriteria: ['Rock-solid basic computer science fundamentals', 'Strong verbal communication and confidence', 'Willingness to learn new frameworks']
    },
    active: true
  },
  {
    id: 'infosys',
    name: 'Infosys',
    logo: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=128&auto=format&fit=crop&q=80',
    industry: 'Global Digital Services & Consulting',
    hiringStyle: 'InfyTQ / HackWithInfy, Problem-solving logic, Clean code, SDLC awareness',
    typicalRounds: ['Aptitude & Coding Round', 'Technical Interview (Algorithms, DBMS, Web Tech)', 'HR & Behavioral Round'],
    personaProfile: {
      focusAreas: ['Data Structures & Logic', 'Full Stack Basics (React, Spring Boot / Node)', 'Agile Methodology', 'Teamwork'],
      difficulty: 'Fresher',
      tone: 'Friendly & Conversational',
      typicalQuestionStyles: ['How do you optimize an array search or sorting algorithm?', 'Explain ACID properties in relational DBs', 'How do you handle conflict in a team project?'],
      coreValues: ['Client value', 'Leadership by example', 'Integrity and transparency'],
      hiringBarCriteria: ['Clean logical thought process', 'Understanding of basic modern web protocols (REST, HTTP status codes)']
    },
    active: true
  },
  {
    id: 'generic-startup',
    name: 'High-Growth Tech Startup',
    logo: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=128&auto=format&fit=crop&q=80',
    industry: 'Product-led SaaS & FinTech',
    hiringStyle: 'Rapid shipping, 0-to-1 autonomy, Full-stack ownership, High agency',
    typicalRounds: ['Practical Take-Home or Live Pair Programming', 'System Architecture & Trade-offs', 'Founder / Culture Alignment'],
    personaProfile: {
      focusAreas: ['Shipping Speed vs Quality', 'Full-stack problem solving', 'Product sense & user impact', 'Debugging complex production issues'],
      difficulty: 'Mid',
      tone: 'Rigorous & Technical',
      typicalQuestionStyles: ['Tell me about something you built from scratch in a weekend', 'How do you choose between Postgres and DynamoDB for this MVP?', 'How do you handle unclear product specs?'],
      coreValues: ['High agency', 'Speed as a habit', 'Extreme ownership'],
      hiringBarCriteria: ['Real hands-on builder DNA', 'Quick debugging under ambiguity']
    },
    active: true
  }
];

export const SEED_ROLES: Role[] = [
  {
    id: 'sde-2',
    companyIds: ['google', 'amazon', 'microsoft', 'generic-startup'],
    title: 'Software Development Engineer II (SDE II)',
    department: 'Core Engineering',
    skills: ['Data Structures & Algorithms', 'System Design', 'Microservices', 'Concurrency', 'Distributed Caching', 'SQL/NoSQL'],
    difficultyLevels: ['Mid', 'Senior'],
    description: 'Design, build and maintain resilient microservices handling high transaction volumes with low latency.',
    active: true
  },
  {
    id: 'frontend-dev',
    companyIds: ['google', 'microsoft', 'tcs', 'infosys', 'generic-startup'],
    title: 'Senior Frontend Engineer',
    department: 'Web & Mobile Experience',
    skills: ['React', 'TypeScript', 'Web Performance (Core Web Vitals)', 'State Management', 'CSS & Responsive Design', 'Accessibility (a11y)'],
    difficultyLevels: ['Fresher', 'Mid', 'Senior'],
    description: 'Deliver pixel-perfect, accessible, and high-performance user interfaces with modern client-side architectures.',
    active: true
  },
  {
    id: 'fullstack-dev',
    companyIds: ['all', 'amazon', 'microsoft', 'tcs', 'infosys', 'generic-startup'],
    title: 'Full Stack Engineer',
    department: 'Product Engineering',
    skills: ['React / Vue', 'Node.js / Express / Spring', 'PostgreSQL', 'Docker', 'REST & GraphQL APIs', 'CI/CD Pipelines'],
    difficultyLevels: ['Fresher', 'Mid', 'Senior'],
    description: 'Bridge backend services and frontend interfaces, delivering end-to-end features with high velocity.',
    active: true
  },
  {
    id: 'ml-engineer',
    companyIds: ['google', 'amazon', 'microsoft', 'generic-startup'],
    title: 'Machine Learning / AI Engineer',
    department: 'Artificial Intelligence',
    skills: ['PyTorch / TensorFlow', 'LLM Fine-tuning & RAG', 'Model Serving & Inference Optimization', 'Vector Databases', 'Python', 'MLOps'],
    difficultyLevels: ['Mid', 'Senior'],
    description: 'Implement, evaluate, and deploy generative AI and machine learning systems into production pipelines.',
    active: true
  },
  {
    id: 'product-manager',
    companyIds: ['google', 'amazon', 'microsoft', 'generic-startup'],
    title: 'Product Manager (Technical)',
    department: 'Product Strategy',
    skills: ['Product Sense & Roadmap', 'User Journey Mapping', 'A/B Testing & Metrics', 'Technical Feasibility', 'Stakeholder Management'],
    difficultyLevels: ['Mid', 'Senior'],
    description: 'Define product vision, align cross-functional teams, and translate ambiguous customer pain points into roadmaps.',
    active: true
  },
  {
    id: 'data-analyst',
    companyIds: ['amazon', 'microsoft', 'tcs', 'infosys'],
    title: 'Data Analyst & BI Specialist',
    department: 'Analytics & Insights',
    skills: ['Advanced SQL (Window functions, CTEs)', 'Python (Pandas, NumPy)', 'Tableau / PowerBI', 'Statistical Hypothesis Testing', 'Data Warehousing'],
    difficultyLevels: ['Fresher', 'Mid'],
    description: 'Extract business insights from complex datasets, design executive dashboards, and guide data-backed decisions.',
    active: true
  },
  {
    id: 'cloud-devops',
    companyIds: ['google', 'amazon', 'microsoft', 'tcs'],
    title: 'Cloud & DevOps Architect',
    department: 'Infrastructure & SRE',
    skills: ['Kubernetes', 'Terraform (IaC)', 'AWS / GCP / Azure', 'Observability (Prometheus, Grafana)', 'Security & Compliance', 'Disaster Recovery'],
    difficultyLevels: ['Mid', 'Senior'],
    description: 'Automate multi-region cloud infrastructure, ensure 99.99% uptime, and optimize cloud consumption costs.',
    active: true
  },
  {
    id: 'system-design',
    companyIds: ['google', 'amazon', 'microsoft'],
    title: 'Distributed Systems Specialist',
    department: 'Infrastructure',
    skills: ['CAP Theorem', 'Consistent Hashing', 'Message Queues (Kafka/SQS)', 'Database Sharding', 'Rate Limiting', 'Idempotency'],
    difficultyLevels: ['Senior'],
    description: 'Architect planetary-scale data backbones with fault tolerance, eventual consistency, and sub-second latencies.',
    active: true
  },
  {
    id: 'tcs-digital-fresher',
    companyIds: ['tcs', 'infosys'],
    title: 'Software Engineer - Campus / Fresher',
    department: 'Graduate Engineering Trainee',
    skills: ['Data Structures (Arrays, Linked Lists, Trees)', 'Object-Oriented Programming (Java/Python)', 'SQL Queries', 'Basic Web Technologies', 'Logical Reasoning'],
    difficultyLevels: ['Fresher'],
    description: 'Entry-level software development role focusing on core coding aptitude, logic, and enterprise training foundations.',
    active: true
  },
  {
    id: 'hr-behavioral',
    companyIds: ['all', 'google', 'amazon', 'microsoft', 'tcs', 'infosys', 'generic-startup'],
    title: 'Behavioral & Leadership Specialist',
    department: 'Talent & Culture',
    skills: ['STAR Method', 'Conflict Resolution', 'Cross-cultural Communication', 'Feedback Reception', 'Ethical Decision Making'],
    difficultyLevels: ['Fresher', 'Mid', 'Senior'],
    description: 'Evaluate culture fit, team collaboration, leadership traits, resilience under pressure, and emotional intelligence.',
    active: true
  }
];

export const SEED_QUESTIONS: QuestionItem[] = [
  // 1-10: SDE / Algorithms
  {
    id: 'q-1',
    roleId: 'sde-2',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'How would you design a distributed rate limiter that handles 100,000 requests per second across multiple data centers without creating a single point of failure?',
    idealAnswer: 'Use Token Bucket or Leaky Bucket algorithm backed by Redis clusters with local in-memory token buffering to avoid cross-region network hops on every request. Sync token pools asynchronously or use sliding window counters with consistent hashing.',
    tags: ['System Design', 'Rate Limiting', 'Redis', 'Concurrency'],
    active: true
  },
  {
    id: 'q-2',
    roleId: 'sde-2',
    companyId: 'amazon',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'Explain the difference between Optimistic Locking and Pessimistic Locking. In an Amazon shopping cart checkout service during Black Friday, which one would you choose and why?',
    idealAnswer: 'Pessimistic locking uses database row locks (SELECT ... FOR UPDATE) preventing concurrency and risking deadlocks. Optimistic locking uses version numbers. For high-throughput flash sales, optimistic locking combined with Redis-based distributed reservation locks and queueing yields far superior throughput.',
    tags: ['Databases', 'Transactions', 'High Concurrency'],
    active: true
  },
  {
    id: 'q-3',
    roleId: 'sde-2',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'How do you detect memory leaks in a production Node.js or Java service, and what tools or metrics do you look at?',
    idealAnswer: 'Monitor heap memory growth over time using APM tools (e.g. Prometheus metrics heapUsed vs heapTotal). Take heap snapshots at different times using Chrome DevTools or jmap and compare retained objects, closure references, or unclosed database connections.',
    tags: ['Debugging', 'Memory Management', 'Observability'],
    active: true
  },
  {
    id: 'q-4',
    roleId: 'sde-2',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'Walk me through how you would implement an LRU (Least Recently Used) cache in code. What is the time complexity of get and put operations, and what data structures do you combine?',
    idealAnswer: 'Combine a Hash Map with a Doubly Linked List. The hash map maps keys to nodes for O(1) lookups, while the doubly linked list maintains the access order with O(1) removal and insertion at the head. Both get and put operate in O(1) time complexity.',
    tags: ['Data Structures', 'LRU Cache', 'Hash Table'],
    active: true
  },
  {
    id: 'q-5',
    roleId: 'sde-2',
    companyId: 'amazon',
    type: 'Behavioral',
    difficulty: 'Senior',
    text: 'Tell me about a time when you had to make a high-stakes technical decision with incomplete data. How did you assess the risk, and what was the outcome? (Amazon Bias for Action & Dive Deep)',
    idealAnswer: 'Use STAR structure: specify the project context, explain what data was missing (e.g. unknown vendor API latency), define two-way vs one-way door decision, describe the rollback mitigation plan, and share concrete post-launch business metrics.',
    tags: ['Behavioral', 'Amazon LP', 'Bias for Action', 'STAR'],
    active: true
  },
  {
    id: 'q-6',
    roleId: 'frontend-dev',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'What are the Core Web Vitals (LCP, INP, CLS)? If a web app has a poor Interaction to Next Paint (INP) score of 600ms, how would you diagnose and fix it?',
    idealAnswer: 'INP measures user interface responsiveness. Diagnose using Chrome DevTools Performance panel to find Long Tasks (>50ms). Fix by breaking long JavaScript tasks with scheduler.yield() or requestAnimationFrame, debouncing inputs, and offloading heavy compute to Web Workers.',
    tags: ['Frontend', 'Performance', 'Web Vitals'],
    active: true
  },
  {
    id: 'q-7',
    roleId: 'frontend-dev',
    companyId: 'generic-startup',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'How does React 19 / Concurrent Mode handle state updates differently than synchronous rendering? Explain how useTransition helps with rendering heavy UI lists.',
    idealAnswer: 'Concurrent rendering allows React to interrupt, pause, or abandon renders if a higher-priority event (like typing or click) arrives. useTransition marks state updates as non-urgent transitions, keeping the input responsive while the expensive list renders in the background.',
    tags: ['React', 'Concurrency', 'State Management'],
    active: true
  },
  {
    id: 'q-8',
    roleId: 'frontend-dev',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'How do you ensure a web application meets WCAG 2.1 AA accessibility standards? What are the key rules for keyboard navigation and screen readers?',
    idealAnswer: 'Use semantic HTML elements (button, nav, main), proper ARIA attributes only when needed (aria-expanded, aria-live for dynamic updates), ensure 4.5:1 text color contrast, maintain logical tabIndex order, and provide visible focus rings (:focus-visible).',
    tags: ['Accessibility', 'HTML', 'WCAG'],
    active: true
  },
  {
    id: 'q-9',
    roleId: 'fullstack-dev',
    companyId: 'generic-startup',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'Describe the life cycle of an HTTP request from the moment a user hits Enter in the browser until the HTML finishes rendering. Touch on DNS, TLS handshake, HTTP/2 multiplexing, and DOM construction.',
    idealAnswer: 'Browser checks DNS cache -> DNS recursive resolution -> TCP 3-way handshake -> TLS 1.3 cryptographic negotiation -> HTTP GET request sent -> Server processes and streams response headers & body -> Browser parses HTML, tokens -> builds DOM and CSSOM -> Render tree -> Layout -> Paint.',
    tags: ['Networking', 'HTTP', 'Browser Internals'],
    active: true
  },
  {
    id: 'q-10',
    roleId: 'fullstack-dev',
    companyId: 'amazon',
    type: 'Behavioral',
    difficulty: 'Mid',
    text: 'Describe a situation where a disagreement arose between you and another engineer about technical architecture. How did you resolve it? (Amazon Disagree and Commit)',
    idealAnswer: 'STAR format: Describe the two competing architectural approaches (e.g., monolith vs event-driven lambda), create an objective evaluation matrix (cost, latency, complexity), build a small prototype, debate constructively, and once a decision was made, commit 100% to making it successful.',
    tags: ['Behavioral', 'Amazon LP', 'Leadership'],
    active: true
  },
  // 11-20: ML / AI Engineering
  {
    id: 'q-11',
    roleId: 'ml-engineer',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'In a Retrieval-Augmented Generation (RAG) system, what strategies do you use to prevent hallucinations and improve retrieval precision over a 10-million document enterprise corpus?',
    idealAnswer: 'Hybrid search (BM25 sparse + dense embeddings), reciprocal rank fusion (RRF), re-ranking models (cross-encoders), semantic document chunking with metadata filtering, context compression, and citations with strict confidence thresholding.',
    tags: ['AI', 'RAG', 'Vector Search', 'LLMs'],
    active: true
  },
  {
    id: 'q-12',
    roleId: 'ml-engineer',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'Explain the difference between LoRA (Low-Rank Adaptation) and full fine-tuning of Large Language Models. Why does LoRA drastically reduce GPU VRAM requirements?',
    idealAnswer: 'Full fine-tuning updates all weights W. LoRA freezes original weights W and injects trainable rank-decomposition matrices A and B such that W_new = W + A*B where rank r << d. This reduces trainable parameters by 99% and slashes VRAM needed for optimizer states.',
    tags: ['ML', 'Fine-tuning', 'LoRA', 'PyTorch'],
    active: true
  },
  {
    id: 'q-13',
    roleId: 'product-manager',
    companyId: 'google',
    type: 'Behavioral',
    difficulty: 'Senior',
    text: 'You are the PM for Google Maps and your team wants to introduce AI-generated trip recommendations. How do you define success metrics, guardrail metrics, and go-to-market strategy?',
    idealAnswer: 'North star: completed saved trips / engagement. Guardrail metrics: battery drain, search latency, hallucinated closed venues, user bounce rate. Rollout: internal dogfood -> 1% canary in one geo -> A/B test with cohort analysis before general availability.',
    tags: ['Product Management', 'Metrics', 'Strategy'],
    active: true
  },
  {
    id: 'q-14',
    roleId: 'product-manager',
    companyId: 'amazon',
    type: 'Behavioral',
    difficulty: 'Mid',
    text: 'How do you prioritize your product backlog when Sales wants a custom enterprise feature, Engineering wants technical debt reduction, and UX wants a redesign?',
    idealAnswer: 'Use framework like RICE (Reach, Impact, Confidence, Effort) aligned with current quarterly OKRs. Allocate fixed engineering capacity (e.g. 20% for tech debt, 70% product goals, 10% bugs/sales blockers). Communicate transparently with stakeholders based on customer impact.',
    tags: ['Product Management', 'Prioritization', 'RICE'],
    active: true
  },
  {
    id: 'q-15',
    roleId: 'data-analyst',
    companyId: 'amazon',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'Write a conceptual SQL query to find the top 3 customers by revenue for each country, handling ties gracefully. What window function do you choose and why?',
    idealAnswer: 'Use DENSE_RANK() OVER (PARTITION BY country ORDER BY SUM(amount) DESC) as ranking in a Common Table Expression (CTE), then filter WHERE ranking <= 3. DENSE_RANK ensures consecutive ranks without skipping numbers when ties occur.',
    tags: ['SQL', 'Window Functions', 'Analytics'],
    active: true
  },
  {
    id: 'q-16',
    roleId: 'cloud-devops',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'Explain how Kubernetes handles Pod evictions during node resource pressure. How do QoS classes (Guaranteed, Burstable, BestEffort) determine eviction order?',
    idealAnswer: 'Kubelet monitors memory, disk, and PID thresholds. BestEffort pods (no requests/limits) are evicted first, followed by Burstable pods exceeding memory requests based on oom_score_adj. Guaranteed pods (requests equal limits) are evicted last.',
    tags: ['DevOps', 'Kubernetes', 'SRE'],
    active: true
  },
  {
    id: 'q-17',
    roleId: 'system-design',
    companyId: 'google',
    type: 'System Design',
    difficulty: 'Senior',
    text: 'Design a planetary-scale URL Shortener service like TinyURL. Calculate storage requirements for 100 million URLs created per day over 5 years, and outline your encoding and cache strategy.',
    idealAnswer: '100M URLs/day * 5 years * 365 = ~182.5 billion URLs. Using Base62 (a-z, A-Z, 0-9), 7 characters provide 62^7 = ~3.5 trillion unique keys. Use a distributed counter (Snowflake ID generator) to generate 64-bit integer and encode to Base62. Cache top 20% URLs in Redis (80/20 Pareto rule).',
    tags: ['System Design', 'Scalability', 'Capacity Planning'],
    active: true
  },
  {
    id: 'q-18',
    roleId: 'system-design',
    companyId: 'amazon',
    type: 'System Design',
    difficulty: 'Senior',
    text: 'Design a distributed notifications service that can deliver push notifications, SMS, and emails to 50 million active users with priority queues and rate limiting.',
    idealAnswer: 'API Gateway with authentication -> Priority Message Broker (Kafka with high/low priority topics) -> Worker microservices with Celery/SQS -> Provider integrations (SES, Twilio, APNs, FCM) -> Distributed idempotency store in Redis to prevent duplicate messages.',
    tags: ['System Design', 'Kafka', 'Architecture'],
    active: true
  },
  {
    id: 'q-19',
    roleId: 'tcs-digital-fresher',
    companyId: 'tcs',
    type: 'Technical',
    difficulty: 'Fresher',
    text: 'What are the core pillars of Object-Oriented Programming (OOP)? Explain runtime polymorphism with a simple code example.',
    idealAnswer: 'Encapsulation, Abstraction, Inheritance, and Polymorphism. Runtime polymorphism (Method Overriding) occurs when a subclass provides a specific implementation of a method already defined in its superclass, resolved dynamically at runtime via virtual method tables.',
    tags: ['OOP', 'Java', 'Fundamentals'],
    active: true
  },
  {
    id: 'q-20',
    roleId: 'tcs-digital-fresher',
    companyId: 'infosys',
    type: 'Technical',
    difficulty: 'Fresher',
    text: 'What is the difference between an inner join and a left outer join in SQL? What happens to unmatched records in both cases?',
    idealAnswer: 'Inner join returns only rows where there is a match in both tables. Left outer join returns all rows from the left table, and matching rows from the right table; if no match is found, columns from the right table are filled with NULL values.',
    tags: ['SQL', 'DBMS', 'Basics'],
    active: true
  },
  // 21-30: Behavioral, HR & Mixed
  {
    id: 'q-21',
    roleId: 'hr-behavioral',
    companyId: 'google',
    type: 'Behavioral',
    difficulty: 'Mid',
    text: 'Tell me about a time when you received constructive or harsh criticism on your work. How did you react in the moment, and what specific action did you take afterwards?',
    idealAnswer: 'Show emotional maturity: listen actively without being defensive, thank the reviewer, ask clarifying questions, assess the validity objectively, implement the recommended changes, and close the loop with the reviewer.',
    tags: ['Behavioral', 'Feedback', 'Culture'],
    active: true
  },
  {
    id: 'q-22',
    roleId: 'hr-behavioral',
    companyId: 'amazon',
    type: 'HR',
    difficulty: 'Fresher',
    text: 'Why do you want to join our organization specifically, and where do you see your career progressing in the next 3 to 5 years?',
    idealAnswer: 'Demonstrate company research: mention specific culture aspects, engineering scale, or products. Connect personal growth ambitions to the company mission, showing commitment to technical mastery and mentorship.',
    tags: ['HR', 'Career Goals', 'Motivation'],
    active: true
  },
  {
    id: 'q-23',
    roleId: 'tcs-digital-fresher',
    companyId: 'tcs',
    type: 'HR',
    difficulty: 'Fresher',
    text: 'Are you comfortable working in different technology stacks or relocating if a client project requires it? How do you adapt to unfamiliar tools?',
    idealAnswer: 'Demonstrate adaptability: explain that language and framework are tools to solve business problems, mention how you quickly learned a new library or tool during college projects, and confirm enthusiasm for client exposure.',
    tags: ['HR', 'Adaptability', 'TCS'],
    active: true
  },
  {
    id: 'q-24',
    roleId: 'sde-2',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'Explain how the Raft consensus algorithm maintains consistency across a distributed state machine during leader election and network partitions.',
    idealAnswer: 'Raft divides time into terms. Nodes can be Leader, Follower, or Candidate. If heartbeat times out, a node becomes Candidate and requests votes. Once elected with majority quorum, it appends log entries. Network splits without majority cannot commit entries, preventing split-brain.',
    tags: ['Distributed Systems', 'Raft', 'Consensus'],
    active: true
  },
  {
    id: 'q-25',
    roleId: 'frontend-dev',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'What is the difference between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Incremental Static Regeneration (ISR)? When would you choose each?',
    idealAnswer: 'CSR renders HTML in browser via JS (great for rich dashboards). SSR renders HTML on request (great for dynamic SEO content like e-commerce). ISR generates static pages at build time and regenerates them in the background on cache expiry (great for high-traffic blogs or docs).',
    tags: ['Next.js', 'SSR', 'Web Architecture'],
    active: true
  },
  {
    id: 'q-26',
    roleId: 'data-analyst',
    companyId: 'tcs',
    type: 'Technical',
    difficulty: 'Fresher',
    text: 'What are the main differences between primary keys, foreign keys, and unique constraints in relational databases?',
    idealAnswer: 'Primary key uniquely identifies each record in a table (cannot be NULL, only one per table). Unique constraint ensures all values in a column are distinct (allows one NULL). Foreign key references a primary or unique key in another table, enforcing referential integrity.',
    tags: ['Databases', 'Relational Models', 'SQL'],
    active: true
  },
  {
    id: 'q-27',
    roleId: 'cloud-devops',
    companyId: 'amazon',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'How do you design a zero-downtime Blue/Green deployment strategy on AWS with Route 53 or Application Load Balancers?',
    idealAnswer: 'Deploy the new release to an isolated Green environment. Run integration health checks. Once verified, switch ALB target group weights or DNS traffic to Green. If an alert triggers, rollback instantly by switching traffic back to Blue.',
    tags: ['AWS', 'CI/CD', 'Blue-Green Deployment'],
    active: true
  },
  {
    id: 'q-28',
    roleId: 'sde-2',
    companyId: 'generic-startup',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'What is database index fragmentation, and why does an index not always speed up SELECT queries (e.g. low cardinality or table scans)?',
    idealAnswer: 'Index fragmentation occurs when data pages are out of physical order due to frequent INSERT/UPDATE/DELETE operations. If a column has low cardinality (e.g. boolean gender), query planner chooses a full table scan because index traversal overhead exceeds sequential read benefits.',
    tags: ['Databases', 'Indexing', 'Performance'],
    active: true
  },
  {
    id: 'q-29',
    roleId: 'hr-behavioral',
    companyId: 'generic-startup',
    type: 'Behavioral',
    difficulty: 'Senior',
    text: 'Tell me about a time when a production incident occurred on your watch. How did you communicate with customers and stakeholders while fixing the issue?',
    idealAnswer: 'STAR format: Describe the severity and impact, assign an Incident Commander, communicate clear status updates every 15-30 minutes on a public status page, roll back or patch the bug, conduct a blameless post-mortem, and implement preventative monitoring.',
    tags: ['SRE', 'Incident Response', 'Communication'],
    active: true
  },
  {
    id: 'q-30',
    roleId: 'product-manager',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'How would you measure the product-market fit (PMF) of an enterprise collaboration tool? What leading indicators and lagging metrics would you track?',
    idealAnswer: 'Leading: Sean Ellis survey (40%+ users very disappointed if product disappeared), Daily Active Users / Monthly Active Users (DAU/MAU) ratio, organic referral rate, week-4 retention cohort curves flattening. Lagging: Net Revenue Retention (NRR > 120%), churn rate < 5%.',
    tags: ['Product Management', 'PMF', 'Analytics'],
    active: true
  },
  // 31-40: More coding, scenario and architectural questions
  {
    id: 'q-31',
    roleId: 'sde-2',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'Given a stream of integers, how would you find the median at any point in time with O(1) query time? What data structure facilitates this?',
    idealAnswer: 'Use two heaps: a Max-Heap for the lower half of numbers, and a Min-Heap for the upper half. Balance their sizes so they differ by at most 1. Inserting an element takes O(log N), while finding the median is O(1) by looking at the tops of the heaps.',
    tags: ['Algorithms', 'Heaps', 'Data Streams'],
    active: true
  },
  {
    id: 'q-32',
    roleId: 'fullstack-dev',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'How do you prevent SQL Injection and Cross-Site Scripting (XSS) in modern web applications? What defense-in-depth measures should be in place?',
    idealAnswer: 'For SQL injection: parameterized queries / prepared statements (never string concatenation) and ORMs. For XSS: context-aware HTML output encoding, Content Security Policy (CSP) HTTP headers, HttpOnly and Secure cookie flags, and framework sanitization.',
    tags: ['Security', 'XSS', 'SQLi'],
    active: true
  },
  {
    id: 'q-33',
    roleId: 'system-design',
    companyId: 'amazon',
    type: 'System Design',
    difficulty: 'Senior',
    text: 'Design an e-commerce flash sale system like Amazon Prime Day where 100,000 users try to buy 500 limited stock items in 10 seconds.',
    idealAnswer: 'Decouple checkout traffic with an asynchronous queue (Kafka). Validate inventory using Redis decrement (DECR) in an atomic Lua script to reject requests once stock hits zero. Push successful reservation IDs to order processing queue with a 10-minute payment timeout.',
    tags: ['System Design', 'Flash Sale', 'High Concurrency'],
    active: true
  },
  {
    id: 'q-34',
    roleId: 'ml-engineer',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'Explain how attention mechanism works in Transformer models. What is Query, Key, and Value conceptually?',
    idealAnswer: 'Scaled Dot-Product Attention: Attention(Q,K,V) = softmax(Q * K^T / sqrt(d_k)) * V. Conceptually: Query represents what token is looking for, Key represents token labels/identity, and Value represents the actual information transferred when Query and Key match.',
    tags: ['Deep Learning', 'Transformers', 'Attention'],
    active: true
  },
  {
    id: 'q-35',
    roleId: 'tcs-digital-fresher',
    companyId: 'infosys',
    type: 'Technical',
    difficulty: 'Fresher',
    text: 'Explain the difference between a process and a thread. What is a deadlock and what are the four Coffman conditions for it to occur?',
    idealAnswer: 'A process is an executing program with isolated memory space; a thread is a lightweight execution unit sharing memory within a process. Deadlock conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
    tags: ['Operating Systems', 'Concurrency', 'Basics'],
    active: true
  },
  {
    id: 'q-36',
    roleId: 'frontend-dev',
    companyId: 'generic-startup',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'How do Service Workers enable offline-first Progressive Web Apps (PWAs)? Explain the cache-first vs network-first strategies.',
    idealAnswer: 'Service Worker acts as a client-side network proxy. Cache-First checks CacheStorage first, returning immediately (ideal for static assets). Network-First fetches fresh data from server and falls back to cache if offline (ideal for dynamic API data).',
    tags: ['PWA', 'Service Workers', 'Offline'],
    active: true
  },
  {
    id: 'q-37',
    roleId: 'data-analyst',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'How do you handle missing data or outliers in an exploratory dataset before training a model or presenting to leadership?',
    idealAnswer: 'Identify missing patterns (MCAR, MAR, MNAR). Strategies: imputation (median/mode for skewed data, regression or KNN for complex relations), or indicator flags. For outliers: IQR or Z-score filtering, winsorization, or robust statistical metrics like median over mean.',
    tags: ['Data Science', 'Data Cleaning', 'Statistics'],
    active: true
  },
  {
    id: 'q-38',
    roleId: 'sde-2',
    companyId: 'amazon',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'What is the purpose of the Circuit Breaker pattern in microservice architectures, and what states does it transition through?',
    idealAnswer: 'Prevents cascading failures when a downstream dependency is down. States: Closed (normal traffic), Open (requests fail-fast without hitting failing service after threshold of errors), and Half-Open (allows trial requests to check if service recovered).',
    tags: ['Microservices', 'Resilience', 'Design Patterns'],
    active: true
  },
  {
    id: 'q-39',
    roleId: 'cloud-devops',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'Compare Infrastructure as Code (IaC) approaches: declarative (Terraform/OpenTofu) versus imperative (CDK/scripts). What are the advantages of state locking?',
    idealAnswer: 'Declarative defines target state; imperative defines execution steps. State locking (e.g. DynamoDB or GCS lock) prevents concurrent terraform apply executions from corrupting shared cloud resource state and creating duplicate infrastructure.',
    tags: ['IaC', 'Terraform', 'Cloud'],
    active: true
  },
  {
    id: 'q-40',
    roleId: 'hr-behavioral',
    companyId: 'tcs',
    type: 'HR',
    difficulty: 'Fresher',
    text: 'Describe a project where you had to collaborate with team members who had different skill levels or work ethics. How did you ensure the project was delivered on time?',
    idealAnswer: 'STAR format: divide tasks according to strengths, set transparent mini-deadlines, conduct regular standups to unblock peers, pair program on bottlenecks, and foster mutual respect without finger-pointing.',
    tags: ['Teamwork', 'Project Management', 'Soft Skills'],
    active: true
  },
  // 41-50: Advanced rounds & Closing questions
  {
    id: 'q-41',
    roleId: 'system-design',
    companyId: 'google',
    type: 'System Design',
    difficulty: 'Senior',
    text: 'How would you architect a real-time collaborative document editing service (like Google Docs) supporting concurrent edits without data loss?',
    idealAnswer: 'Use Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs) like Yjs or Automerge over WebSockets. Maintain causal history, resolve conflicting insert/delete character indices idempotently, and snapshot document states periodically.',
    tags: ['System Design', 'CRDT', 'WebSockets', 'Realtime'],
    active: true
  },
  {
    id: 'q-42',
    roleId: 'sde-2',
    companyId: 'microsoft',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'Explain the internal workings of a Garbage Collector (e.g. Java V8 generational GC). Why are objects divided into young and old generations?',
    idealAnswer: 'Weak Generational Hypothesis: most objects die young. Minor GC scans young generation (Eden/Survivor spaces) quickly using copying collector. Surviving objects get promoted to Old generation, which uses Mark-Sweep-Compact infrequently, saving CPU cycles.',
    tags: ['Garbage Collection', 'JVM', 'V8'],
    active: true
  },
  {
    id: 'q-43',
    roleId: 'frontend-dev',
    companyId: 'google',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'How do you optimize an SVG and canvas rendering pipeline in a high-density data visualization web dashboard displaying 50,000 data points?',
    idealAnswer: 'Use HTML5 Canvas or WebGL instead of 50,000 individual DOM SVG elements. Implement spatial indexing (QuadTree), level-of-detail (LOD) subsampling, offscreen canvas rendering, and requestAnimationFrame throttling.',
    tags: ['Canvas', 'WebGL', 'Performance'],
    active: true
  },
  {
    id: 'q-44',
    roleId: 'ml-engineer',
    companyId: 'amazon',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'What are the main causes of training instability in deep neural networks (e.g. exploding/vanishing gradients) and how do modern architectures mitigate them?',
    idealAnswer: 'Mitigations: Residual connections (ResNet skips), Layer Normalization (Transformer norm), proper weight initialization (He/Xavier), gradient clipping, and learning rate warm-up schedules.',
    tags: ['Deep Learning', 'Gradients', 'Optimization'],
    active: true
  },
  {
    id: 'q-45',
    roleId: 'product-manager',
    companyId: 'google',
    type: 'Behavioral',
    difficulty: 'Senior',
    text: 'How do you handle ethical considerations and algorithmic bias in AI product features before shipping to global markets?',
    idealAnswer: 'Establish representative test datasets across demographics, run adversarial red-teaming, introduce clear disclaimers and human-in-the-loop review, track fairness metrics (disparate impact ratio), and design easy appeal mechanisms.',
    tags: ['AI Ethics', 'Product Management', 'Governance'],
    active: true
  },
  {
    id: 'q-46',
    roleId: 'data-analyst',
    companyId: 'generic-startup',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'Explain Simpson’s Paradox in statistical analysis. Give a business example where aggregated metrics tell the opposite story of segmented cohorts.',
    idealAnswer: 'Simpson’s paradox occurs when a trend appears in several groups of data but disappears or reverses when the groups are combined. Example: an A/B test conversion rate appears higher overall for Variant B, but Variant A had higher conversion rates in both desktop and mobile segments due to disproportionate traffic distribution.',
    tags: ['Statistics', 'A/B Testing', 'Analytics'],
    active: true
  },
  {
    id: 'q-47',
    roleId: 'fullstack-dev',
    companyId: 'infosys',
    type: 'Technical',
    difficulty: 'Mid',
    text: 'What is CORS (Cross-Origin Resource Sharing)? Why does a preflight OPTIONS request happen, and how do you configure it securely on the server?',
    idealAnswer: 'CORS is a browser security mechanism restricting cross-origin HTTP requests. Preflight OPTIONS requests check whether the server permits custom headers, methods (like PUT/DELETE), or credentials. Configure Access-Control-Allow-Origin with specific allowed domains, never wildcard * when credentials are true.',
    tags: ['CORS', 'Web Security', 'HTTP'],
    active: true
  },
  {
    id: 'q-48',
    roleId: 'sde-2',
    companyId: 'generic-startup',
    type: 'Technical',
    difficulty: 'Senior',
    text: 'How do you implement distributed tracing (OpenTelemetry) across 15 microservices to locate a 2-second bottleneck in a checkout flow?',
    idealAnswer: 'Propagate W3C Trace Context (traceparent header containing trace-id and span-id) across HTTP/gRPC headers. Instrument service endpoints to create spans for database queries, external calls, and queues. Visualize span waterfall in Jaeger or Datadog to identify the slowest span.',
    tags: ['Observability', 'OpenTelemetry', 'Microservices'],
    active: true
  },
  {
    id: 'q-49',
    roleId: 'hr-behavioral',
    companyId: 'microsoft',
    type: 'Behavioral',
    difficulty: 'Mid',
    text: 'Tell me about a time you had to deliver difficult news to a manager or client regarding a delayed milestone. How did you prepare and what was the outcome?',
    idealAnswer: 'Early communication without surprises, clear root-cause breakdown without excuses, concrete revised plan with phased deliverable options, and preventative measures for future sprints.',
    tags: ['Communication', 'Stakeholders', 'STAR'],
    active: true
  },
  {
    id: 'q-50',
    roleId: 'hr-behavioral',
    companyId: 'all',
    type: 'HR',
    difficulty: 'Fresher',
    text: 'Do you have any questions for me as your interviewer regarding the engineering culture, technology stack, or upcoming roadmap?',
    idealAnswer: 'Demonstrates deep curiosity and engagement: candidate asks thoughtful questions regarding team engineering practices, production deployment frequency, mentorship, or how the team handles technical debt vs product deadlines.',
    tags: ['Closing', 'Candidate Questions', 'Engagement'],
    active: true
  }
];

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  aiModel: 'gemini-3.8-flash',
  aiVoice: 'Zephyr',
  voiceProvider: 'deepgram-agent',
  deepgramVoice: 'aura-asteria-en',
  deepgramSttLanguage: 'en',
  deepgramCreditLimit: 200,
  autoSwitchOnLowCredit: true,
  temperature: 0.7,
  strictnessLevel: 'Standard Industry Bar',
  maxInterviewDurationMinutes: 45,
  enabledLanguages: ['English', 'Hindi', 'Hinglish'],
  featureFlags: {
    enableWebcam: true,
    enableCodeEditor: true,
    enableWhiteboard: true,
    enableScheduling: true
  },
  systemPrompts: {
    interviewIntro: `You are an elite, empathetic, yet rigorous technical & behavioral interviewer at {{companyName}} interviewing {{candidateName}} for the role of {{roleTitle}} (Difficulty: {{difficulty}}, Type: {{interviewType}}, Language: {{language}}).

Conduct a realistic mock interview. 
Rules:
1. Warm greeting and quick 1-line check-in, then ask one question at a time.
2. Adapt to the candidate's answers. If vague, probe deeper with targeted follow-ups. If stuck for 20+ seconds, offer a constructive hint.
3. Be natural, conversational, professional, and authentic to {{companyName}}'s culture.
4. Keep strict track of time and conclude gracefully with 'Do you have any questions for me?'.`,
    evaluatorSystemPrompt: `You are a Principal Bar-Raiser and hiring committee lead. Evaluate the complete interview transcript thoroughly according to {{companyName}}'s hiring bar for {{roleTitle}}. Provide an exhaustive, evidence-backed evaluation with transcript quotes, detailed scores across 10 categories, question-by-question critique, speech analytics, and a 7-day/30-day personalized improvement roadmap. Never provide generic or shallow feedback.`,
    sampleMicCheckPrompt: `Hi {{candidateName}}, before we begin our live interview, let's do a quick audio calibration. Please tell me what you had for breakfast today, or introduce yourself in one short sentence!`
  },
  promptVersion: 1
};

export const SEED_AVAILABILITY: AvailabilitySlot[] = [
  { id: 'slot-mon-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', capacityPerSlot: 4 },
  { id: 'slot-mon-2', dayOfWeek: 1, startTime: '14:00', endTime: '18:00', capacityPerSlot: 4 },
  { id: 'slot-tue-1', dayOfWeek: 2, startTime: '09:00', endTime: '12:00', capacityPerSlot: 4 },
  { id: 'slot-tue-2', dayOfWeek: 2, startTime: '14:00', endTime: '18:00', capacityPerSlot: 4 },
  { id: 'slot-wed-1', dayOfWeek: 3, startTime: '09:00', endTime: '12:00', capacityPerSlot: 4 },
  { id: 'slot-wed-2', dayOfWeek: 3, startTime: '14:00', endTime: '18:00', capacityPerSlot: 4 },
  { id: 'slot-thu-1', dayOfWeek: 4, startTime: '09:00', endTime: '12:00', capacityPerSlot: 4 },
  { id: 'slot-thu-2', dayOfWeek: 4, startTime: '14:00', endTime: '18:00', capacityPerSlot: 4 },
  { id: 'slot-fri-1', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', capacityPerSlot: 4 },
  { id: 'slot-fri-2', dayOfWeek: 5, startTime: '14:00', endTime: '17:00', capacityPerSlot: 3 },
  { id: 'slot-sat-1', dayOfWeek: 6, startTime: '10:00', endTime: '14:00', capacityPerSlot: 2 }
];

export const DEMO_CANDIDATE_RESUME = `
SARTHAK SRIVASTAVA
Full Stack & Cloud Software Engineer
Email: sarthak.srivastava@example.com | Phone: +1 (555) 382-9481
LinkedIn: linkedin.com/in/sarthak-srivastava | GitHub: github.com/sarthak-dev

SUMMARY:
Results-driven Full Stack Engineer with 3+ years of experience building high-scale distributed web applications, cloud microservices, and modern frontend user experiences. Experienced in React, TypeScript, Node.js, Python, PostgreSQL, Redis, and AWS cloud infrastructure. Passionate about system performance, developer velocity, and resilient architecture.

SKILLS:
- Languages: TypeScript, JavaScript (ESNext), Python, Go, Java, SQL
- Frontend: React 19, Next.js, Tailwind CSS, Redux Toolkit, WebSockets, HTML5/CSS3
- Backend: Node.js, Express, Fastify, Python FastAPI, RESTful & GraphQL APIs, gRPC
- Databases & Caching: PostgreSQL, MongoDB, Redis, DynamoDB
- Cloud & DevOps: AWS (EC2, S3, Lambda, ECS), Docker, Kubernetes, CI/CD (GitHub Actions), Terraform
- Core Competencies: Distributed Systems, Scalable API Design, Microservices, Performance Profiling

PROFESSIONAL EXPERIENCE:
Senior Software Engineer | CloudScale Systems (2023 - Present)
- Architected and deployed an event-driven telemetry ingest pipeline processing 12M events/day using Kafka and Node.js microservices, cutting data ingestion latency by 42%.
- Led frontend redesign of the real-time analytics dashboard with React and WebSockets, improving Core Web Vitals (LCP reduced from 3.2s to 1.1s).
- Implemented Redis multi-tier caching strategy that decreased database read IOPS by 65% during peak client queries.

Software Engineer | NovaTech Solutions (2021 - 2023)
- Built resilient REST microservices for an e-commerce platform processing $2M+ monthly transactions.
- Automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing deployment cycle time from 4 hours to 18 minutes.
- Authored 120+ unit and integration tests with Jest, achieving 88% test coverage across critical billing modules.

EDUCATION:
Bachelor of Technology in Computer Science & Engineering
Tech University, Class of 2021 | GPA: 3.8 / 4.0

PROJECTS:
- Distributed URL Shortener & Analytics Engine: Designed a high-throughput link shortener with Base62 encoding, Redis caching, and ClickHouse analytics handling 5,000 QPS.
- Real-time Collaborative Code Workspace: Built a browser-based pair programming tool using WebSockets, Monaco editor, and Docker container execution sandboxes.

CERTIFICATIONS:
- AWS Certified Solutions Architect - Associate
- Certified Kubernetes Application Developer (CKAD)
`;

export const DEMO_EVALUATION_REPORT: EvaluationReport = {
  id: 'report-demo-sde2-google',
  interviewId: 'intv-demo-01',
  candidateName: 'Sarthak Srivastava',
  companyName: 'Google',
  roleTitle: 'Software Development Engineer II (SDE II)',
  interviewType: 'Technical',
  difficulty: 'Senior',
  date: 'Oct 9, 2026',
  durationMinutes: 30,
  overallScore: 86,
  gradeBand: 'Strong',
  hireReadinessVerdict: 'Strong Hire',
  executiveSummary:
    'Sarthak demonstrated exceptional architectural maturity, strong concurrency reasoning, and disciplined structured communication throughout the 30-minute technical evaluation. Handled ambiguity regarding cross-region replication trade-offs proactively and grounded performance claims in quantifiable operational metrics.',
  categoryScores: [
    {
      category: 'Technical Knowledge',
      score: 90,
      benchmark: 76,
      justification: 'Solid grasp of distributed consensus, cache eviction policies, and database write-ahead logging.'
    },
    {
      category: 'Problem Solving & Structure',
      score: 88,
      benchmark: 74,
      justification: 'Applied methodical top-down breakdown; explicitly validated system constraints before presenting solutions.'
    },
    {
      category: 'Coding & Architecture',
      score: 85,
      benchmark: 72,
      justification: 'Drafted clean TypeScript interfaces and handled concurrency race conditions using optimistic versioning.'
    },
    {
      category: 'Communication & Structure',
      score: 89,
      benchmark: 78,
      justification: 'Articulate, structured thoughts using the STAR model; checked in with the interviewer frequently.'
    },
    {
      category: 'Confidence & Pressure Handling',
      score: 84,
      benchmark: 70,
      justification: 'Maintained steady composure when challenged on edge case network partition scenarios.'
    },
    {
      category: 'Role & Culture Fit',
      score: 87,
      benchmark: 75,
      justification: 'Strong intellectual curiosity, openness to feedback, and high alignment with Google engineering principles.'
    }
  ],
  questionsBreakdown: [
    {
      questionNumber: 1,
      category: 'Warmup & Distributed Systems',
      questionText: 'Looking at your resume experience with distributed pipelines, how did you architect the event-driven ingest system at CloudScale, and how did you guarantee message ordering and zero data loss?',
      candidateAnswerExcerpt: 'We used a partitioned Kafka topic with key-based routing matching our entity IDs to guarantee in-order delivery per tenant. For at-least-once processing, consumers acknowledge only after writing to our PostgreSQL staging table within an idempotent database transaction.',
      scoreOutOf10: 9,
      whatWasGood: 'Accurately recognized that total ordering is only possible per partition key and specified idempotency keys.',
      whatWasMissing: 'Could have touched on consumer group rebalance storm mitigations during pod restarts.',
      mistakesOrErrors: 'None identified.',
      idealModelAnswer: 'Detailing key-based partitioning, transactional outbox pattern for zero data loss, and cooperative sticky assignors.',
      followUpAsked: 'What happens if a poison pill message fails downstream deserialization?',
      followUpHandling: 'Candidate immediately proposed a Dead Letter Queue (DLQ) with exponential backoff and alerting.',
      timeTakenSeconds: 310,
      transcriptTimestamp: '02:15'
    },
    {
      questionNumber: 2,
      category: 'Core Concurrency & Caching',
      questionText: 'How do you prevent cache stampedes and dogpiling when a highly requested cache entry expires under 100k QPS?',
      candidateAnswerExcerpt: 'We can utilize mutex locking with Redis Redlock or probabilistically recompute values before hard expiration using XFetch, or serve slightly stale data while an asynchronous background worker refreshes the cache.',
      scoreOutOf10: 8.5,
      whatWasGood: 'Mentioned XFetch probabilistic early expiration and stale-while-revalidate pattern.',
      whatWasMissing: 'Could have discussed single-flight request coalescing in application memory.',
      mistakesOrErrors: 'Minor initial confusion between Redis Redlock distributed lock vs local mutex.',
      idealModelAnswer: 'Combining local single-flight grouping with background cache warming and stale-while-revalidate headers.',
      timeTakenSeconds: 340,
      transcriptTimestamp: '08:45'
    },
    {
      questionNumber: 3,
      category: 'Behavioral & Root Cause Leadership',
      questionText: 'Tell me about a time when a critical bug or latency spike hit production on a service you owned. How did you diagnose it and communicate under pressure?',
      candidateAnswerExcerpt: 'When a new deployment caused our P99 latency to surge from 120ms to 2.4s due to connection pool starvation, I first initiated an instant canary rollback. Then I posted an initial status incident report to stakeholders within 8 minutes. We used distributed traces to uncover an unindexed query.',
      scoreOutOf10: 9,
      whatWasGood: 'Clear STAR format with concrete metrics; prioritized mitigation (rollback) before root cause diagnosis.',
      whatWasMissing: 'Could have expanded on long-term systemic safeguards like automated load-test gates in CI/CD.',
      mistakesOrErrors: 'None.',
      idealModelAnswer: 'Clear escalation protocols, blameless post-mortem with action items, and automated synthetic canary probes.',
      timeTakenSeconds: 280,
      transcriptTimestamp: '15:20'
    }
  ],
  speechAnalytics: {
    overallWpm: 144,
    paceConsistency: 'Well-Paced & Clear',
    fillerWordsCount: 7,
    fillerWordsBreakdown: [
      { word: 'um', count: 3 },
      { word: 'like', count: 2 },
      { word: 'basically', count: 2 }
    ],
    fillerWordTimeline: [
      { minute: 2, count: 2 },
      { minute: 8, count: 1 },
      { minute: 16, count: 3 },
      { minute: 24, count: 1 }
    ],
    longPausesCount: 1,
    averageResponseLatencySeconds: 1.6,
    interruptionsCount: 0,
    talkToListenRatioPercent: 66,
    clarityScore: 91,
    toneAndEnergyTimeline: [
      { minute: 2, energy: 78, confidence: 82 },
      { minute: 8, energy: 86, confidence: 88 },
      { minute: 16, energy: 84, confidence: 89 },
      { minute: 24, energy: 91, confidence: 93 }
    ],
    languageQuality: {
      grammarIssues: ['Consistent, grammatically correct professional English.'],
      repeatedPhrases: ['"at the architectural level" (used twice)'],
      strongPhrases: [
        '"idempotent database transactions"',
        '"trade-off between write throughput and read consistency"',
        '"canary rollback to preserve SLA"'
      ],
      weakPhrasesToReplace: [
        {
          weak: 'we just threw Redis at it',
          replacement: 'we introduced a distributed Redis caching tier to offload database IOPS'
        }
      ]
    }
  },
  behaviorAnalytics: {
    analyzed: true,
    eyeContactPercentage: 84,
    postureStability: 'Solid & Upright',
    facialEngagement: 'High & Expressive',
    distractionEventsCount: 0
  },
  psychologicalObservations: {
    handlingPressure: 'Remarkably steady composure when asked follow-up edge cases; did not panic or become defensive.',
    honestyVsBluffing: 'Explicitly acknowledged when something was outside direct production experience instead of guessing.',
    recoveryAfterMistakes: 'Quickly recalculated heap memory sizing after catching initial unit mismatch.',
    curiosityAndQuestionsAsked: 'Asked thoughtful, relevant questions about Google cross-region cell architectures.'
  },
  timelineEvents: [
    { minute: 2, questionNumber: 1, score: 90, confidence: 82, paceWpm: 140, eventNote: 'Background & Ingestion System' },
    { minute: 8, questionNumber: 2, score: 85, confidence: 86, paceWpm: 146, eventNote: 'Cache Stampede & Concurrency' },
    { minute: 16, questionNumber: 3, score: 90, confidence: 89, paceWpm: 142, eventNote: 'Production Incident Leadership' }
  ],
  topStrengths: [
    {
      title: 'Distributed Systems & Idempotency',
      evidenceQuote: '"For at-least-once processing, consumers acknowledge only after writing to our PostgreSQL staging table within an idempotent transaction."',
      impact: 'Eliminates duplicate writes and ensures transactional integrity during infrastructure restarts.'
    },
    {
      title: 'Incident Leadership & SLA Protection',
      evidenceQuote: '"I first initiated an instant canary rollback before debugging root cause."',
      impact: 'Demonstrates customer-first mindset and operational maturity under high-severity incidents.'
    },
    {
      title: 'Methodical Problem Decomposition',
      evidenceQuote: '"Let\'s break down the read path from the write path and evaluate the caching boundary first."',
      impact: 'Keeps interview discussions structured, focused, and free of chaotic speculation.'
    }
  ],
  topWeaknesses: [
    {
      title: 'CI/CD Regression Safeguards',
      evidenceQuote: '"We diagnosed it using traces afterwards."',
      remediation: 'Emphasize automated performance canary testing and load test gates before code reaches production.'
    },
    {
      title: 'Probabilistic Algorithm Depth',
      evidenceQuote: '"We could use something like XFetch..."',
      remediation: 'Review theoretical underpinnings of probabilistic early expiration formulas (beta parameters).'
    }
  ],
  redFlags: [],
  companySpecificInsights: {
    barComparison: 'Meets and slightly exceeds Google L5 / SDE II hiring bar on distributed systems and structured coding.',
    likelyToPassRounds: [
      'System Design & Distributed Architecture (Likely Pass)',
      'Leadership & Googleyness (Likely Pass)',
      'Algorithms & Data Structures (Pass)'
    ],
    likelyToStruggleRounds: [
      'Niche Low-Level Kernel OS & Memory Profiling (Potential edge case)'
    ],
    interviewCultureMatchPercent: 92
  },
  personalizedImprovementPlan: {
    top5PrioritySkillsToFix: [
      'Automated Canary Gate Design',
      'Probabilistic Cache Algorithms (XFetch)',
      'Kafka Consumer Rebalance Protocols',
      'Database B-Tree vs LSM Tree Internals',
      'Micro-benchmarking CPU cache lines'
    ],
    sevenDaySchedule: [
      { day: 'Day 1-2', task: 'Deep dive into Database Isolation Levels & Multi-Version Concurrency Control (MVCC)', timeNeeded: '2 hours' },
      { day: 'Day 3-4', task: 'Review Kafka Partition Rebalance Protocols (Cooperative Sticky Assignor)', timeNeeded: '2.5 hours' },
      { day: 'Day 5-7', task: 'Mock System Design: High-Scale Distributed Rate Limiter & Token Bucket', timeNeeded: '4 hours' }
    ],
    thirtyDaySchedule: [
      { week: 'Week 1', focus: 'Distributed Consensus & Raft/Paxos internals', outcome: 'Clear understanding of quorum writes & leader leases' },
      { week: 'Week 2', focus: 'Real-time WebSocket & Streaming Protocols', outcome: 'Built resilient push-notification mock' },
      { week: 'Week 3', focus: 'Advanced Concurrency & Lock-Free Data Structures', outcome: 'Master CAS operations and atomics' },
      { week: 'Week 4', focus: 'Executive Presence & Googleyness Leadership', outcome: 'Polished leadership narrative with quantitative metrics' }
    ],
    recommendedResources: [
      { title: 'Designing Data-Intensive Applications (Martin Kleppmann)', type: 'Doc', link: 'https://dataintensive.net' },
      { title: 'Google SRE Book - Managing Incidents', type: 'Doc', link: 'https://sre.google/sre-book/managing-incidents/' },
      { title: 'System Design Primer (Donne Martin)', type: 'Course', link: 'https://github.com/donnemartin/system-design-primer' }
    ],
    targetedPracticeQuestions: [
      'How does Raft elect a new leader during an asymmetric network partition?',
      'How do you design a multi-tenant rate limiter with sub-millisecond overhead?',
      'Explain how PostgreSQL MVCC handles write skews in Repeatable Read isolation.'
    ],
    quickWinsVsLongTerm: {
      quickWins: [
        'Lead with quantitative metrics in behavioral answers.',
        'Replace informal phrases like "threw Redis at it" with technical descriptions.'
      ],
      longTerm: [
        'Contribute to open-source distributed storage or message broker engines.'
      ]
    }
  },
  progressComparison: {
    previousScore: 78,
    scoreChangeDelta: 8,
    improvedCategories: ['Distributed System Architecture', 'STAR Story Articulation', 'Pacing & WPM'],
    declinedCategories: [],
    repeatedMistakes: []
  },
  appendix: {
    fullTranscript: [
      {
        id: 't-1',
        speaker: 'ai',
        text: 'Welcome Sarthak! Let us begin by discussing your experience with distributed event streaming. How did you architect the pipeline at CloudScale?',
        timestamp: '00:02',
        secondsFromStart: 2
      },
      {
        id: 't-2',
        speaker: 'candidate',
        text: 'We used a partitioned Kafka topic with key-based routing matching our entity IDs to guarantee in-order delivery per tenant. For at-least-once processing, consumers acknowledge only after writing to our PostgreSQL staging table within an idempotent transaction.',
        timestamp: '02:15',
        secondsFromStart: 135
      },
      {
        id: 't-3',
        speaker: 'ai',
        text: 'Excellent. What happens if a poison pill message fails downstream deserialization?',
        timestamp: '03:10',
        secondsFromStart: 190
      },
      {
        id: 't-4',
        speaker: 'candidate',
        text: 'We immediately route it to a Dead Letter Queue with an exponential retry backoff and alert our on-call Slack channel.',
        timestamp: '04:05',
        secondsFromStart: 245
      }
    ],
    codeSubmissions: `// Idempotent Transactional Outbox Handler in TypeScript
import { PoolClient } from 'pg';

interface IngestEvent {
  idempotencyKey: string;
  tenantId: string;
  payload: Record<string, unknown>;
}

export async function processIngestEvent(client: PoolClient, event: IngestEvent): Promise<boolean> {
  await client.query('BEGIN');
  try {
    const insertRes = await client.query(
      \`INSERT INTO processed_events (idempotency_key, tenant_id, processed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING idempotency_key\`,
      [event.idempotencyKey, event.tenantId]
    );

    if (insertRes.rowCount === 0) {
      // Duplicate event detected; skip processing safely
      await client.query('COMMIT');
      return false;
    }

    // Process business logic payload
    await client.query(
      \`INSERT INTO tenant_metrics (tenant_id, event_data) VALUES ($1, $2)\`,
      [event.tenantId, JSON.stringify(event.payload)]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}`,
    parsedResumeSkillsSnapshot: ['React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'AWS'],
    scoringRubricNotes: 'Scored against Google L5 / SDE II canonical engineering bar criteria.'
  },
  shareToken: 'sample-report-token-9941',
  createdAt: new Date().toISOString()
};

