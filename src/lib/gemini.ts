import fs from "fs/promises";
import path from "path";

export interface ResearchTopicResult {
  selectedTopic: string;
  sourceTrend: string;
  coreProblem: string;
  whyCTOsCare: string;
  suggestedTitle: string;
  suggestedSlug: string;
  tags: string[];
}

export interface GeneratedArticleResult {
  title: string;
  slug: string;
  excerpt: string;
  readTimeMinutes: number;
  tags: string[];
  contentMarkdown: string;
  targetKeywords: string[];
  imagePrompt: string;
}

const BLOG_ASSETS_DIR = path.resolve(process.cwd(), "data/blog-assets");

/**
 * Get the active Gemini API Key
 */
function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    null
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 1: DEEP RESEARCH & TOPIC SELECTION
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function performDeepTopicResearch(
  existingSlugsAndTitles: Array<{ slug: string; title: string }>,
): Promise<ResearchTopicResult> {
  const apiKey = getGeminiApiKey();

  const existingListText = existingSlugsAndTitles
    .slice(-20)
    .map((item) => `- "${item.title}" (slug: ${item.slug})`)
    .join("\n");

  const systemInstruction = `You are a Senior SaaS & AI Principal Architect and Technical Advisor to startup founders.
Your job is to scan current high-signal trends across SaaS engineering, AI systems (RAG, agents, vector pipelines), architectural scaling, multi-tenant databases, technical debt rescue, and fractional CTO strategy.

Select ONE highly timely, practical, high-value technical topic that startup founders and technical leaders are actively struggling with right now.

CRITICAL DEDUPLICATION RULE:
You MUST NOT pick any topic that matches or closely overlaps with any of these recently published articles:
${existingListText || "None yet published."}

Return a STRICT JSON object with this EXACT structure (no markdown fences, just valid JSON):
{
  "selectedTopic": "Short topic summary",
  "sourceTrend": "Why this is trending on HackerNews, Substack, Medium, or GitHub tech ecosystems",
  "coreProblem": "The root architectural friction or failure mode founders encounter",
  "whyCTOsCare": "Concrete business and technical stakes (cost, scalability, velocity, downtime)",
  "suggestedTitle": "High CTR, CTO-grade headline (max 60 chars)",
  "suggestedSlug": "kebab-case-slug-without-special-chars",
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

  if (!apiKey) {
    console.log("No GEMINI_API_KEY found. Using high-signal fallback topic generator.");
    const fallbackTopics: ResearchTopicResult[] = [
      {
        selectedTopic: "Agentic AI Architecture: State Machines vs. Pure LLM Loops",
        sourceTrend: "High failure rates in production autonomous agents due to infinite loops and uncontrolled token drift.",
        coreProblem: "Relying purely on LLM autonomy without deterministic state boundaries causes runaway latency and inconsistent state.",
        whyCTOsCare: "Reduces AI execution costs by 70% and prevents catastrophic agent hallucinations in customer-facing workflows.",
        suggestedTitle: "Deterministic State Machines for Reliable AI Agents",
        suggestedSlug: "deterministic-state-machines-reliable-ai-agents",
        tags: ["AI Engineering", "Architecture", "LLM"],
      },
      {
        selectedTopic: "Modular Monolith vs Microservices for Early-Stage SaaS",
        sourceTrend: "Founders burning Seed capital managing Kubernetes clusters for 500 active users instead of validating product-market fit.",
        coreProblem: "Premature microservice distribution adds distributed transaction overhead, network latency, and DevOps complexity.",
        whyCTOsCare: "A well-structured modular monolith delivers 10x faster feature velocity and runs on a single $20/mo instance until Series A.",
        suggestedTitle: "Why Your Next SaaS Should Be a Modular Monolith",
        suggestedSlug: "why-your-next-saas-should-be-a-modular-monolith",
        tags: ["Architecture", "SaaS MVP", "Scaling"],
      },
      {
        selectedTopic: "Production RAG in 2026: Hybrid Search, Chunking & Rerankers",
        sourceTrend: "Naive vector retrieval failing in complex domain-specific SaaS applications.",
        coreProblem: "Cosine similarity on raw chunks misses keyword precision and relational business context.",
        whyCTOsCare: "Hybrid BM25 + Vector search with cross-encoder reranking lifts accuracy from 62% to 94% with zero fine-tuning.",
        suggestedTitle: "Beyond Vector Search: Production-Grade RAG Pipelines",
        suggestedSlug: "beyond-vector-search-production-grade-rag-pipelines",
        tags: ["AI Engineering", "RAG", "Search"],
      },
      {
        selectedTopic: "SaaS Multi-Tenancy: Row-Level Security vs Schema-per-Tenant",
        sourceTrend: "PostgreSQL 17 Row-Level Security (RLS) performance benchmarks vs isolation requirements in B2B SaaS.",
        coreProblem: "Choosing between operational simplicity and enterprise data compliance isolation.",
        whyCTOsCare: "Proper RLS implementation prevents costly database connection pooling bottlenecks while ensuring strict tenant isolation.",
        suggestedTitle: "PostgreSQL RLS for High-Performance Multi-Tenant SaaS",
        suggestedSlug: "postgresql-rls-high-performance-multi-tenant-saas",
        tags: ["Databases", "PostgreSQL", "SaaS"],
      },
      {
        selectedTopic: "Zero-Downtime Database Migrations in Continuous Delivery",
        sourceTrend: "Schema lockouts causing customer outages during mid-day deployments.",
        coreProblem: "Breaking database changes (renaming columns, adding NOT NULL constraints) executed without expand-and-contract patterns.",
        whyCTOsCare: "Eliminates maintenance windows and ensures 99.99% uptime for enterprise SLAs.",
        suggestedTitle: "Zero-Downtime Database Migrations: Expand & Contract",
        suggestedSlug: "zero-downtime-database-migrations-expand-contract",
        tags: ["DevOps", "Databases", "Scaling"],
      },
    ];

    // Filter out already published slugs
    const publishedSlugSet = new Set(existingSlugsAndTitles.map((i) => i.slug.toLowerCase()));
    const available = fallbackTopics.filter((t) => !publishedSlugSet.has(t.suggestedSlug.toLowerCase()));
    const choice = available.length > 0 ? available[0] : fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];

    return choice;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\nSearch recent discussions and output the JSON topic recommendation now.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Research API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const clean = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const result = JSON.parse(clean) as ResearchTopicResult;
    return result;
  } catch (error) {
    console.error("performDeepTopicResearch API error (falling back to curated topic engine):", error);
    const fallbackTopics: ResearchTopicResult[] = [
      {
        selectedTopic: "Agentic AI Architecture: State Machines vs. Pure LLM Loops",
        sourceTrend: "High failure rates in production autonomous agents due to infinite loops and uncontrolled token drift.",
        coreProblem: "Relying purely on LLM autonomy without deterministic state boundaries causes runaway latency and inconsistent state.",
        whyCTOsCare: "Reduces AI execution costs by 70% and prevents catastrophic agent hallucinations in customer-facing workflows.",
        suggestedTitle: "Deterministic State Machines for Reliable AI Agents",
        suggestedSlug: "deterministic-state-machines-reliable-ai-agents",
        tags: ["AI Engineering", "Architecture", "LLM"],
      },
      {
        selectedTopic: "Modular Monolith vs Microservices for Early-Stage SaaS",
        sourceTrend: "Founders burning Seed capital managing Kubernetes clusters for 500 active users instead of validating product-market fit.",
        coreProblem: "Premature microservice distribution adds distributed transaction overhead, network latency, and DevOps complexity.",
        whyCTOsCare: "A well-structured modular monolith delivers 10x faster feature velocity and runs on a single $20/mo instance until Series A.",
        suggestedTitle: "Why Your Next SaaS Should Be a Modular Monolith",
        suggestedSlug: "why-your-next-saas-should-be-a-modular-monolith",
        tags: ["Architecture", "SaaS MVP", "Scaling"],
      },
      {
        selectedTopic: "Production RAG in 2026: Hybrid Search, Chunking & Rerankers",
        sourceTrend: "Naive vector retrieval failing in complex domain-specific SaaS applications.",
        coreProblem: "Cosine similarity on raw chunks misses keyword precision and relational business context.",
        whyCTOsCare: "Hybrid BM25 + Vector search with cross-encoder reranking lifts accuracy from 62% to 94% with zero fine-tuning.",
        suggestedTitle: "Beyond Vector Search: Production-Grade RAG Pipelines",
        suggestedSlug: "beyond-vector-search-production-grade-rag-pipelines",
        tags: ["AI Engineering", "RAG", "Search"],
      },
      {
        selectedTopic: "SaaS Multi-Tenancy: Row-Level Security vs Schema-per-Tenant",
        sourceTrend: "PostgreSQL 17 Row-Level Security (RLS) performance benchmarks vs isolation requirements in B2B SaaS.",
        coreProblem: "Choosing between operational simplicity and enterprise data compliance isolation.",
        whyCTOsCare: "Proper RLS implementation prevents costly database connection pooling bottlenecks while ensuring strict tenant isolation.",
        suggestedTitle: "PostgreSQL RLS for High-Performance Multi-Tenant SaaS",
        suggestedSlug: "postgresql-rls-high-performance-multi-tenant-saas",
        tags: ["Databases", "PostgreSQL", "SaaS"],
      },
      {
        selectedTopic: "Zero-Downtime Database Migrations in Continuous Delivery",
        sourceTrend: "Schema lockouts causing customer outages during mid-day deployments.",
        coreProblem: "Breaking database changes (renaming columns, adding NOT NULL constraints) executed without expand-and-contract patterns.",
        whyCTOsCare: "Eliminates maintenance windows and ensures 99.99% uptime for enterprise SLAs.",
        suggestedTitle: "Zero-Downtime Database Migrations: Expand & Contract",
        suggestedSlug: "zero-downtime-database-migrations-expand-contract",
        tags: ["DevOps", "Databases", "Scaling"],
      },
    ];

    const publishedSlugSet = new Set(existingSlugsAndTitles.map((i) => i.slug.toLowerCase()));
    const available = fallbackTopics.filter((t) => !publishedSlugSet.has(t.suggestedSlug.toLowerCase()));
    return available.length > 0 ? available[0] : fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 2: CTO-LEVEL CONTENT & SEO DRAFTING
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function generateBlogPostContent(
  research: ResearchTopicResult,
): Promise<GeneratedArticleResult> {
  const apiKey = getGeminiApiKey();

  const systemPrompt = `You are Mehdi Golzari — Senior Independent Technical Partner and Fractional CTO for SaaS & AI founders.
Your website is MehdiGolzari.dev.
Your methodology is the "Founder-to-Launch Framework™" (7 Phases: Discover, Validate, Blueprint, Build, Launch, Scale, Partner).

You write practical, battle-tested, high-signal architectural deep-dives for startup founders and lead engineers.

AUTHOR IDENTITY & STYLE GUIDELINES:
1. Speak in Mehdi Golzari's direct, pragmatic engineering voice:
   - "When founders bring me code to rescue, 90% of the time the issue isn't the framework..."
   - "If this were my startup, here is the exact architectural trade-off I would make..."
   - "Before you burn months writing microservices..."
   - "In Phase 2 (Validate) of the Founder-to-Launch Framework™, we test this assumption before touching core code..."
2. AVOID generic boilerplate intros ("In today's fast-paced digital world..."). Dive immediately into the core technical problem and stakes.
3. STRUCTURE:
   - Use clear markdown headers (## and ###).
   - Include ASCII or Mermaid architecture diagrams inside fenced code blocks.
   - Include practical, production-ready code examples (TypeScript, C#, Python, SQL, or Docker/Terraform where appropriate).
   - Include a comparison trade-off table (Options vs. Latency, Cost, Complexity, Time-to-Market).
   - Include a dedicated "CTO Action Plan" checklist at the end.
   - Include a natural callout to the Go-to-Launch Blueprint™ ("If you're building a SaaS or AI product and need to map your architecture before writing code, run the free Go-to-Launch Blueprint™ at MehdiGolzari.dev").
4. LENGTH & VALUE:
   - Provide a comprehensive, in-depth read (1,200 to 2,000 words of real substance, not filler).

OUTPUT SCHEMA:
Return a STRICT JSON object with this EXACT structure (no markdown fences, just valid JSON):
{
  "title": "High CTR, CTO-grade headline (max 60 chars)",
  "slug": "kebab-case-slug",
  "excerpt": "Compelling 150-160 char meta description explaining the article value",
  "readTimeMinutes": 7,
  "tags": ["Tag1", "Tag2", "Tag3"],
  "contentMarkdown": "Full article markdown content...",
  "targetKeywords": ["keyword1", "keyword2", "keyword3"],
  "imagePrompt": "Detailed visual description for Imagen 3: dark mode, minimalist 3D abstract isometric wireframe architecture, deep navy background with glowing neon violet #6366f1 accents, clean glassmorphism"
}`;

  const userPrompt = `Topic to write about:
Title Idea: ${research.suggestedTitle}
Topic: ${research.selectedTopic}
Trend Context: ${research.sourceTrend}
Core Problem: ${research.coreProblem}
Why CTOs Care: ${research.whyCTOsCare}
Suggested Tags: ${research.tags.join(", ")}

Generate the complete, production-grade technical article JSON now.`;

  if (!apiKey) {
    console.log("No GEMINI_API_KEY found. Generating structured mock article.");
    const slug = research.suggestedSlug || "why-your-next-saas-should-be-a-modular-monolith";
    const title = research.suggestedTitle || "Why Your Next SaaS Should Be a Modular Monolith";
    
    return {
      title,
      slug,
      excerpt: "Why premature microservice adoption destroys early-stage SaaS velocity and how a clean modular monolith scales past your first $1M ARR.",
      readTimeMinutes: 6,
      tags: research.tags || ["Architecture", "SaaS MVP", "Scaling"],
      contentMarkdown: `# ${title}

When early-stage founders approach me for an architectural audit or SaaS rescue, one recurring anti-pattern stands out: **premature distribution**. 

Before securing their first ten design partners, founders are frequently convinced by generic tutorials to deploy Kubernetes clusters, API gateways, Kafka message brokers, and five microservices. The consequence? 80% of their engineering velocity is spent debugging distributed state and network serialization rather than shipping product features.

In this guide, we'll examine why a well-designed **Modular Monolith** is almost always the superior architectural choice for SaaS products scaling from **Phase 1 (Discover)** through **Phase 4 (Build)** in the *Founder-to-Launch Framework™*.

---

## The True Cost of Premature Microservices

Microservices do not solve code quality problems—they distribute them across a network boundary.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                 PREMATURE MICROSERVICES                     │
├─────────────────┬───────────────────┬───────────────────────┤
│ API Gateway     │ Auth Microservice │ Billing Microservice  │
│ [Network Hop 1] │ [Network Hop 2]   │ [Network Hop 3]       │
└─────────────────┴───────────────────┴───────────────────────┘
  ↳ Distributed transactions (Saga / 2PC)
  ↳ Eventual consistency lag
  ↳ Complex local developer setup
\`\`\`

### Key Friction Points:
1. **Distributed Transactions:** Handling atomic checkout and seat provisioning requires complex Saga patterns or two-phase commits.
2. **Operational Overhead:** Observability (OpenTelemetry, distributed tracing, log aggregation) demands dedicated DevOps engineering.
3. **Local Development Friction:** New engineers spend days configuring Docker Compose files with 12 interconnected containers.

---

## The Modular Monolith Architecture

A Modular Monolith provides the logical boundaries of microservices with the deployment simplicity of a single binary.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                  MODULAR MONOLITH (SINGLE APP)              │
├─────────────────┬───────────────────┬───────────────────────┤
│ [Auth Module]   │ [Billing Module]  │ [Core Domain Module]  │
│  - Domain Logic │  - Stripe Handlers│  - Business Workflow  │
│  - Internal API │  - Invoicing      │  - Event Bus (In-Mem) │
└─────────────────┴───────────────────┴───────────────────────┘
            └── Shared PostgreSQL (Logical Schemas) ──┘
\`\`\`

### Enforcing Module Boundaries in TypeScript

Each module exposes a strict public API interface while keeping internal entities private:

\`\`\`typescript
// src/modules/billing/index.ts (Public Contract)
export interface BillingService {
  createSubscription(tenantId: string, planId: string): Promise<SubscriptionResult>;
  cancelSubscription(tenantId: string): Promise<void>;
  getTenantEntitlements(tenantId: string): Promise<Entitlements>;
}

// Internal implementations remain private to /billing/internal/
\`\`\`

---

## Architectural Comparison Matrix

| Dimension | Microservices | Modular Monolith | Serverless / Lambdas |
| :--- | :--- | :--- | :--- |
| **Time-to-MVP** | 8–14 Weeks | **2–4 Weeks** | 4–6 Weeks |
| **Local Dev Setup** | Heavy (Docker Compose) | **Light (npm run dev)** | Medium (Cloud Mocks) |
| **Hosting Cost (0–10k Users)** | $300–$800/mo | **$15–$50/mo** | $20–$100/mo |
| **Refactoring Ease** | Difficult (API contracts) | **Instant (IDE Refactoring)**| Medium |
| **Transaction Safety** | Eventual Consistency | **ACID SQL Transactions** | Mixed |

---

## CTO Action Plan: How to Build for Future Extraction

If your startup reaches massive scale (e.g., millions of requests per second on a specific subsystem like PDF rendering or vector ingestion), a clean modular monolith can be split in days:

1. **Keep Database Access Isolated:** Never allow Module A to directly query tables owned by Module B. Use internal module service interfaces.
2. **Use Domain Events:** Emit in-memory asynchronous events for side effects (e.g., \`UserRegisteredEvent\` triggers \`WelcomeEmailHandler\` and \`BillingAccountProvisioner\`).
3. **Isolate Heavy Background Tasks:** Offload long-running background compute to a worker queue (BullMQ or Celery) backed by Redis.

> **Independent Technical Advisory Note:**
> Before investing months building complex infrastructure, validate your core architecture first. If you want a tailored breakdown of your MVP scope, technical stack, and risks, run our free [Go-to-Launch Blueprint™](https://mehdigolzari.dev/blueprint).`,
      targetKeywords: ["modular monolith", "saas architecture", "microservices vs monolith", "cto advisory", "mvp development"],
      imagePrompt: "Minimalist dark mode 3D architectural wireframe of modular monolithic software design, deep navy background with glowing neon indigo and violet accents, clean glassmorphism grid",
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Content Generation API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const clean = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const result = JSON.parse(clean) as GeneratedArticleResult;
    return result;
  } catch (error) {
    console.error("generateBlogPostContent API error (falling back to curated article generator):", error);
    const slug = research.suggestedSlug || "why-your-next-saas-should-be-a-modular-monolith";
    const title = research.suggestedTitle || "Why Your Next SaaS Should Be a Modular Monolith";

    return {
      title,
      slug,
      excerpt: "Why premature microservice adoption destroys early-stage SaaS velocity and how a clean modular monolith scales past your first $1M ARR.",
      readTimeMinutes: 6,
      tags: research.tags || ["Architecture", "SaaS MVP", "Scaling"],
      contentMarkdown: `# ${title}

When early-stage founders approach me for an architectural audit or SaaS rescue, one recurring anti-pattern stands out: **premature distribution**. 

Before securing their first ten design partners, founders are frequently convinced by generic tutorials to deploy Kubernetes clusters, API gateways, Kafka message brokers, and five microservices. The consequence? 80% of their engineering velocity is spent debugging distributed state and network serialization rather than shipping product features.

In this guide, we'll examine why a well-designed **Modular Monolith** is almost always the superior architectural choice for SaaS products scaling from **Phase 1 (Discover)** through **Phase 4 (Build)** in the *Founder-to-Launch Framework™*.

---

## The True Cost of Premature Microservices

Microservices do not solve code quality problems—they distribute them across a network boundary.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                 PREMATURE MICROSERVICES                     │
├─────────────────┬───────────────────┬───────────────────────┤
│ API Gateway     │ Auth Microservice │ Billing Microservice  │
│ [Network Hop 1] │ [Network Hop 2]   │ [Network Hop 3]       │
└─────────────────┴───────────────────┴───────────────────────┘
  ↳ Distributed transactions (Saga / 2PC)
  ↳ Eventual consistency lag
  ↳ Complex local developer setup
\`\`\`

### Key Friction Points:
1. **Distributed Transactions:** Handling atomic checkout and seat provisioning requires complex Saga patterns or two-phase commits.
2. **Operational Overhead:** Observability (OpenTelemetry, distributed tracing, log aggregation) demands dedicated DevOps engineering.
3. **Local Development Friction:** New engineers spend days configuring Docker Compose files with 12 interconnected containers.

---

## The Modular Monolith Architecture

A Modular Monolith provides the logical boundaries of microservices with the deployment simplicity of a single binary.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                  MODULAR MONOLITH (SINGLE APP)              │
├─────────────────┬───────────────────┬───────────────────────┤
│ [Auth Module]   │ [Billing Module]  │ [Core Domain Module]  │
│  - Domain Logic │  - Stripe Handlers│  - Business Workflow  │
│  - Internal API │  - Invoicing      │  - Event Bus (In-Mem) │
└─────────────────┴───────────────────┴───────────────────────┘
            └── Shared PostgreSQL (Logical Schemas) ──┘
\`\`\`

### Enforcing Module Boundaries in TypeScript

Each module exposes a strict public API interface while keeping internal entities private:

\`\`\`typescript
// src/modules/billing/index.ts (Public Contract)
export interface BillingService {
  createSubscription(tenantId: string, planId: string): Promise<SubscriptionResult>;
  cancelSubscription(tenantId: string): Promise<void>;
  getTenantEntitlements(tenantId: string): Promise<Entitlements>;
}

// Internal implementations remain private to /billing/internal/
\`\`\`

---

## Architectural Comparison Matrix

| Dimension | Microservices | Modular Monolith | Serverless / Lambdas |
| :--- | :--- | :--- | :--- |
| **Time-to-MVP** | 8–14 Weeks | **2–4 Weeks** | 4–6 Weeks |
| **Local Dev Setup** | Heavy (Docker Compose) | **Light (npm run dev)** | Medium (Cloud Mocks) |
| **Hosting Cost (0–10k Users)** | $300–$800/mo | **$15–$50/mo** | $20–$100/mo |
| **Refactoring Ease** | Difficult (API contracts) | **Instant (IDE Refactoring)**| Medium |
| **Transaction Safety** | Eventual Consistency | **ACID SQL Transactions** | Mixed |

---

## CTO Action Plan: How to Build for Future Extraction

If your startup reaches massive scale (e.g., millions of requests per second on a specific subsystem like PDF rendering or vector ingestion), a clean modular monolith can be split in days:

1. **Keep Database Access Isolated:** Never allow Module A to directly query tables owned by Module B. Use internal module service interfaces.
2. **Use Domain Events:** Emit in-memory asynchronous events for side effects (e.g., \`UserRegisteredEvent\` triggers \`WelcomeEmailHandler\` and \`BillingAccountProvisioner\`).
3. **Isolate Heavy Background Tasks:** Offload long-running background compute to a worker queue (BullMQ or Celery) backed by Redis.

> **Independent Technical Advisory Note:**
> Before investing months building complex infrastructure, validate your core architecture first. If you want a tailored breakdown of your MVP scope, technical stack, and risks, run our free [Go-to-Launch Blueprint™](https://mehdigolzari.dev/blueprint).`,
      targetKeywords: ["modular monolith", "saas architecture", "microservices vs monolith", "cto advisory", "mvp development"],
      imagePrompt: "Minimalist dark mode 3D architectural wireframe of modular monolithic software design, deep navy background with glowing neon indigo and violet accents, clean glassmorphism grid",
    };
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 3: COVER IMAGE GENERATION & ASSET STORAGE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function generateCoverImage(
  slug: string,
  title: string,
  categoryTag: string,
  _customPrompt?: string,
): Promise<string> {
  await fs.mkdir(BLOG_ASSETS_DIR, { recursive: true });

  const fileName = `${slug}.svg`;
  const filePath = path.join(BLOG_ASSETS_DIR, fileName);

  // Generate ultra-clean, high-resolution branded SVG hero graphic (1200x630)
  // Perfectly matching the dark OKLCH aesthetic of MehdiGolzari.dev
  const svgContent = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="70%" fx="30%" fy="20%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#09090b" />
    </radialGradient>

    <!-- Neon Glows -->
    <radialGradient id="neonGlow1" cx="20%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="neonGlow2" cx="80%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
    </radialGradient>

    <!-- Text Gradient -->
    <linearGradient id="neonText" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>

    <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0.1" />
    </linearGradient>

    <!-- Grid Pattern -->
    <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#techGrid)" />

  <!-- Ambient Glow Orbs -->
  <rect width="1200" height="630" fill="url(#neonGlow1)" />
  <rect width="1200" height="630" fill="url(#neonGlow2)" />

  <!-- Outer Frame -->
  <rect x="40" y="40" width="1120" height="550" rx="24" stroke="url(#cardBorder)" stroke-width="1.5" fill="none" />

  <!-- Header Branding -->
  <g transform="translate(80, 95)">
    <!-- Logo Icon -->
    <rect width="32" height="32" rx="8" fill="#6366f1" />
    <rect x="10" y="10" width="12" height="12" rx="3" fill="#09090b" />
    <text x="44" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#ffffff" letter-spacing="-0.5">
      MehdiGolzari<tspan fill="#a855f7">.dev</tspan>
    </text>
    <text x="210" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">
      · Architectural Insights
    </text>
  </g>

  <!-- Category Tag Badge -->
  <g transform="translate(80, 175)">
    <rect width="${Math.max(categoryTag.length * 10 + 32, 120)}" height="32" rx="16" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1" />
    <text x="16" y="20" font-family="ui-monospace, monospace" font-size="12" font-weight="700" fill="#38bdf8" text-transform="uppercase" letter-spacing="1">
      ${escapeXml(categoryTag.toUpperCase())}
    </text>
  </g>

  <!-- Title Wrapping (2 Lines Max) -->
  <g transform="translate(80, 270)">
    <text font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="-1">
      ${wrapTextToSvg(title, 42)}
    </text>
  </g>

  <!-- Footer Metadata & Architecture Signature -->
  <line x1="80" y1="495" x2="1120" y2="495" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />

  <g transform="translate(80, 535)">
    <text font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">
      Senior Independent Technical Partner for SaaS & AI Founders
    </text>
    <text x="750" y="0" font-family="ui-monospace, monospace" font-size="13" font-weight="500" fill="#94a3b8">
      Founder-to-Launch Framework™
    </text>
  </g>
</svg>`.trim();

  await fs.writeFile(filePath, svgContent, "utf-8");
  return `/api/blog/asset?slug=${slug}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapTextToSvg(text: string, maxCharsPerLine = 40): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 2) break;
    }
  }
  if (currentLine && lines.length < 2) {
    lines.push(currentLine);
  }

  return lines
    .map(
      (line, i) =>
        `<tspan x="0" dy="${i === 0 ? 0 : 56}">${escapeXml(line)}</tspan>`,
    )
    .join("");
}
