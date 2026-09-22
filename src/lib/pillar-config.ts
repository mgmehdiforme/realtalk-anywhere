export interface StrategicPillar {
  id: string;
  slug: string;
  title: string;
  headline: string;
  tagline: string;
  description: string;
  badge: string;
  iconName: "Layers" | "Brain" | "Rocket" | "Shield" | "TrendingUp";
  categoryKeys: string[];
  tagKeys: string[];
  blueprintPresetKey: string;
  contactTopic: "triage" | "mvp" | "automation" | "fractional";
  manifestoRules: Array<{
    title: string;
    description: string;
  }>;
  keyTopics: string[];
}

export const STRATEGIC_PILLARS: Record<string, StrategicPillar> = {
  "saas-architecture": {
    id: "saas-architecture",
    slug: "saas-architecture",
    title: "SaaS & Systems Architecture",
    headline: "Modular Monoliths, Multi-Tenancy & High-Velocity B2B Systems",
    tagline: "Battle-tested systems design for software founders. Avoid premature microservices, enforce domain boundaries, and scale with PostgreSQL row-level security.",
    description: "Explore in-depth architecture playbooks on modular monolith design, multi-tenant database isolation, ACID event dispatching, and avoiding distributed systems tech debt.",
    badge: "SaaS Systems Hub",
    iconName: "Layers",
    categoryKeys: ["saas-architecture", "mvp-architecture"],
    tagKeys: ["Modular Monolith", "PostgreSQL RLS", "Multi-Tenant SaaS", "MVP Architecture", "Tech Debt"],
    blueprintPresetKey: "saas-architecture",
    contactTopic: "fractional",
    manifestoRules: [
      {
        title: "Modular Monolith Before Microservices",
        description: "Never introduce distributed microservices until a single compute runtime cannot sustain load or when multiple autonomous teams require separated deployment boundaries.",
      },
      {
        title: "Postgres Row-Level Security on Day 1",
        description: "Enforce multi-tenant data isolation directly at the database engine level via RLS policies rather than relying on brittle ORM application-level WHERE clauses.",
      },
      {
        title: "In-Memory Decoupled Events",
        description: "Use typed in-process event buses for domain module separation. Postpone external cloud queue brokers until multi-instance background workers are required.",
      },
      {
        title: "Strict Directory Boundary Encapsulation",
        description: "Expose only designated public module contracts via index.ts and prohibit cross-domain internal imports with compiler and linter rules.",
      },
    ],
    keyTopics: [
      "Modular Monolith Architecture",
      "PostgreSQL Row-Level Security (RLS)",
      "Multi-Tenant Isolation Models",
      "In-Memory Event Emitters",
      "Domain-Driven Design (DDD)",
      "Database Transaction Integrity",
    ],
  },
  "ai-engineering": {
    id: "ai-engineering",
    slug: "ai-engineering",
    title: "AI Engineering & Deterministic Systems",
    headline: "Deterministic AI Agents, CI/CD Evals & Vector Retrieval",
    tagline: "Move beyond vibes-based prompt engineering. Build predictable multi-agent loops, automated regression eval suites, and token-efficient AI workflows.",
    description: "Practical engineering blueprints for founders building generative AI products: automated LLM evaluation harnesses, deterministic state machines, and vector search optimization.",
    badge: "AI Engineering Hub",
    iconName: "Brain",
    categoryKeys: ["ai-engineering"],
    tagKeys: ["AI Engineering", "Deterministic AI", "LangGraph", "LLM Agents", "LLM Evals", "CI/CD Guardrails"],
    blueprintPresetKey: "ai-engineering",
    contactTopic: "automation",
    manifestoRules: [
      {
        title: "Replace Vibes with Deterministic Evals",
        description: "Never push prompt modifications or model routing changes to production without automated CI/CD evaluation suites testing schema fidelity and regression metrics.",
      },
      {
        title: "Finite State Machines Over Open-Ended Agents",
        description: "Constrain multi-agent autonomy using strict state machine transitions, validating JSON outputs deterministically before triggering business actions.",
      },
      {
        title: "Aggressive Context & Prompt Caching",
        description: "Structure system instructions and static RAG context to leverage provider prompt caching, cutting API latency and recurring token costs by up to 80%.",
      },
      {
        title: "Decouple Generation from Business Logic",
        description: "Treat LLM calls as probabilistic text generators and isolate parsing, data transformation, and database mutations within deterministic TypeScript modules.",
      },
    ],
    keyTopics: [
      "Automated CI/CD LLM Evaluations",
      "Deterministic Multi-Agent State Machines",
      "Vector Search & Hybrid Retrieval (RAG)",
      "Structured Output Schema Validation",
      "Prompt Caching & Token Cost Reduction",
      "Semantic Guardrails & Hallucination Prevention",
    ],
  },
  "mvp-development": {
    id: "mvp-development",
    slug: "mvp-development",
    title: "Zero-to-One MVP & Product Launch",
    headline: "From Concept to Production Launch in 4–6 Weeks",
    tagline: "Pragmatic product development for venture-backed and bootstrapped founders. Eliminate agency fluff, avoid costly rewrites, and ship scale-ready codebases.",
    description: "Battle-tested 0-to-1 engineering guides for founders: selecting high-velocity tech stacks, building launch-ready MVPs, and establishing clean software foundations.",
    badge: "Zero-to-One MVP Hub",
    iconName: "Rocket",
    categoryKeys: ["mvp-development", "mvp-architecture"],
    tagKeys: ["MVP Architecture", "Modular Monolith", "Seed Funding", "Tech Debt"],
    blueprintPresetKey: "mvp-development",
    contactTopic: "mvp",
    manifestoRules: [
      {
        title: "Speed of Discovery Over Premature Scale",
        description: "Your primary engineering objective before Product-Market Fit is rapid iteration speed and feedback velocity, not horizontal Kubernetes clusters.",
      },
      {
        title: "Full-Stack TypeScript Unification",
        description: "Eliminate context switching and duplicated type definitions by sharing schemas, validation models, and types end-to-end across React and Node.",
      },
      {
        title: "Managed PaaS Over Infrastructure Management",
        description: "Deploy to managed application runtimes (Render, Railway, Cloud Run) and managed Postgres to spend 100% of engineering time on customer-facing features.",
      },
      {
        title: "Production Modularity from Day 1",
        description: "Build clean, separated domain folders early so your codebase passes investor due diligence and can easily be handed over to full-time hires post-seed.",
      },
    ],
    keyTopics: [
      "Founder-to-Launch Framework™",
      "4–6 Week Launch Sprints",
      "Full-Stack TypeScript Architecture",
      "Seed Round Investor Due Diligence",
      "Avoiding Offshore Agency Pitfalls",
      "Managed Cloud Deployment Pipelines",
    ],
  },
  "fractional-cto": {
    id: "fractional-cto",
    slug: "fractional-cto",
    title: "Fractional CTO & Technical Leadership",
    headline: "Executive Engineering Strategy Without Cap-Table Dilution",
    tagline: "Bridge the technical co-founder gap. Architect scale-ready systems, lead dev teams, and pass institutional investor technical due diligence.",
    description: "Guidance for founders evaluating engineering leadership: engaging an embedded Fractional CTO, conducting codebase audits, avoiding agency traps, and structuring team equity.",
    badge: "Technical Leadership Hub",
    iconName: "Shield",
    categoryKeys: ["fractional-cto", "due-diligence"],
    tagKeys: ["Fractional CTO", "Technical Co-Founder", "Technical Partner", "Equity Vesting", "Technical Due Diligence", "Codebase Audit", "Agency Trap"],
    blueprintPresetKey: "saas-architecture",
    contactTopic: "fractional",
    manifestoRules: [
      {
        title: "Protect Your Cap Table Early",
        description: "Avoid rushing into irreversible 30–50% equity co-founder arrangements before your technical scope and working chemistry are proven in production.",
      },
      {
        title: "Hands-On Architecture Leadership",
        description: "A fractional CTO must write critical architectural code, define repository standards, and review PRs—not just produce theoretical slide decks.",
      },
      {
        title: "Rigorous Agency & Vendor Audits",
        description: "Enforce strict deliverable acceptance criteria and perform bi-weekly architecture audits on external dev shops to prevent unmaintainable code dumps.",
      },
      {
        title: "Institutional Due Diligence Preparation",
        description: "Structure automated tests, license compliance, security headers, and infrastructure diagrams so your platform sails through VC seed due diligence.",
      },
    ],
    keyTopics: [
      "Fractional CTO vs Technical Co-Founder",
      "Seed Investor Due Diligence Audits",
      "Vetting Offshore Development Agencies",
      "Engineering Hiring & Team Scaling",
      "Technical Roadmapping & Cap-Table Protection",
      "Codebase Health & Tech Debt Remediation",
    ],
  },
  "startup-economics": {
    id: "startup-economics",
    slug: "startup-economics",
    title: "Startup Economics & Cloud Costs",
    headline: "Slashing Cloud Spend, API Burn & Dev Inefficiencies",
    tagline: "Protect your startup runway. Eliminate idle infrastructure costs, slash LLM API token burn by 80%, and maximize developer velocity per dollar invested.",
    description: "Tactical guides for startup executives to optimize software unit economics: slashing OpenAI/Anthropic API bills, right-sizing cloud databases, and cutting developer toil.",
    badge: "DevOps & Economics Hub",
    iconName: "TrendingUp",
    categoryKeys: ["startup-economics", "cloud-devops", "performance-scaling"],
    tagKeys: ["Startup Economics", "AI API Burn Rate", "Prompt Caching", "LLM Cost Optimization", "Cloud Costs"],
    blueprintPresetKey: "startup-economics",
    contactTopic: "fractional",
    manifestoRules: [
      {
        title: "Scrutinize Cloud Infrastructure Monthly",
        description: "Audit compute utilization, database instance sizing, and unused NAT gateways to keep early hosting bills under $100/mo.",
      },
      {
        title: "Cache Model Prompts Aggressively",
        description: "Leverage prefix and prompt caching for frequent context blocks, reducing recurring inference costs and network roundtrips.",
      },
      {
        title: "Avoid Over-Engineered Distributed Stacks",
        description: "Running Kubernetes clusters before having paying customers is financial malpractice. Leverage high-density single instances on managed cloud PaaS.",
      },
      {
        title: "Measure Dev Velocity per Dollar",
        description: "Prioritize developer tools, type safety, and CI automated tests that prevent expensive production outages and developer context-switching.",
      },
    ],
    keyTopics: [
      "Slashing Generative AI API Burn",
      "Prompt Caching & Context Re-use",
      "Cloud Database Instance Rightsizing",
      "PaaS vs Serverless Cost Breakdown",
      "Runway Protection & Infrastructure ROI",
      "Zero-Downtime Low-Cost Deployments",
    ],
  },
};

/**
 * Normalizes input ID or alias to find the matching canonical pillar
 */
export function getPillarById(idOrAlias: string): StrategicPillar | null {
  if (!idOrAlias) return null;
  const clean = idOrAlias.toLowerCase().trim();

  // 1. Direct match
  if (STRATEGIC_PILLARS[clean]) {
    return STRATEGIC_PILLARS[clean];
  }

  // 2. Alias match through categoryKeys
  for (const pillar of Object.values(STRATEGIC_PILLARS)) {
    if (pillar.categoryKeys.some((k) => k.toLowerCase() === clean)) {
      return pillar;
    }
  }

  // 3. Fallback matching
  if (clean.includes("saas") || clean.includes("monolith")) {
    return STRATEGIC_PILLARS["saas-architecture"];
  }
  if (clean.includes("ai") || clean.includes("agent") || clean.includes("llm")) {
    return STRATEGIC_PILLARS["ai-engineering"];
  }
  if (clean.includes("mvp") || clean.includes("launch")) {
    return STRATEGIC_PILLARS["mvp-development"];
  }
  if (clean.includes("cto") || clean.includes("founder") || clean.includes("diligence")) {
    return STRATEGIC_PILLARS["fractional-cto"];
  }
  if (clean.includes("cost") || clean.includes("cloud") || clean.includes("devops") || clean.includes("scale")) {
    return STRATEGIC_PILLARS["startup-economics"];
  }

  return null;
}

export function getAllPillars(): StrategicPillar[] {
  return Object.values(STRATEGIC_PILLARS);
}
