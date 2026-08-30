import fs from "fs/promises";
import path from "path";
import { GoogleAuth } from "google-auth-library";

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
 * Singleton Google Auth Client for Vertex AI Project Credentials
 */
let googleAuthInstance: GoogleAuth | null = null;

function getGoogleAuthClient(): GoogleAuth {
  if (!googleAuthInstance) {
    googleAuthInstance = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      projectId:
        process.env.VERTEX_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.GCLOUD_PROJECT ||
        "mehdigolzari",
    });
  }
  return googleAuthInstance;
}

/**
 * Retrieve Vertex AI configuration
 */
function getVertexConfig(): { projectId: string; location: string } {
  const projectId =
    process.env.VERTEX_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    "mehdigolzari";

  // Force global location everywhere as requested
  const location =
    process.env.VERTEX_LOCATION ||
    process.env.GOOGLE_CLOUD_LOCATION ||
    "global";

  return { projectId, location };
}

/**
 * Retrieve Gemini API Key fallback from environment
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
 * Retrieve Secondary LLM (Qwen / OpenAI compatible) credentials
 */
function getSecondaryLLMConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  const apiKey =
    process.env.QWEN_API_KEY ||
    process.env.DASHSCOPE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    null;

  if (!apiKey) return null;

  const baseUrl =
    process.env.QWEN_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1";

  const model = process.env.QWEN_MODEL || "qwen3.7-plus";

  return { apiKey, baseUrl, model };
}

/**
 * Sanitize unescaped control characters in JSON strings produced by LLMs
 */
function sanitizeJsonString(str: string): string {
  let inString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      result += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else if (char.charCodeAt(0) < 32) {
        result += " ";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Robust JSON Extractor for LLM responses (properly handles nested markdown code blocks)
 */
export function extractJsonObject<T = any>(raw: string): T {
  if (!raw || !raw.trim()) {
    throw new Error("Empty response received from AI model");
  }

  let candidate = raw.trim();

  // Strip leading/trailing markdown JSON fence if the ENTIRE response is wrapped in one
  if (candidate.startsWith("```")) {
    candidate = candidate
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  // Find outermost { and }
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidate = candidate.substring(firstBrace, lastBrace + 1);
  }

  // 1. Direct parse
  try {
    return JSON.parse(candidate) as T;
  } catch (_) {}

  // 2. Sanitize unescaped control characters in string literals
  try {
    const sanitized = sanitizeJsonString(candidate);
    return JSON.parse(sanitized) as T;
  } catch (err: any) {
    throw new Error(`Failed to parse AI JSON response: ${err.message}`);
  }
}

/**
 * Universal Production LLM caller with multi-provider failover:
 * 1. Google Cloud Vertex AI (Project Credentials & Global Location)
 * 2. Google AI Studio / Gemini API Key
 * 3. Secondary Provider (Qwen / DashScope)
 */
async function executeUniversalLLMPrompt(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.5,
  useSearchGrounding = false,
  modelPreference?: string,
): Promise<string> {
  const vertexConfig = getVertexConfig();
  const model =
    modelPreference ||
    process.env.GEMINI_MODEL ||
    process.env.GEMINI_CONTENT_MODEL ||
    "gemini-3.7-flash";

  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDER 1: Google Cloud Vertex AI with Project Credentials (ADC / IAM)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const auth = getGoogleAuthClient();
    const token = await auth.getAccessToken();

    if (token) {
      const baseUrl =
        vertexConfig.location === "global"
          ? "https://aiplatform.googleapis.com"
          : `https://${vertexConfig.location}-aiplatform.googleapis.com`;

      const url = `${baseUrl}/v1/projects/${vertexConfig.projectId}/locations/${vertexConfig.location}/publishers/google/models/${model}:generateContent`;

      const requestBody: Record<string, any> = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 8192,
        },
      };

      if (useSearchGrounding) {
        requestBody.tools = [{ googleSearch: {} }];
      } else {
        requestBody.generationConfig.responseMimeType = "application/json";
      }

      // Retry up to 2 times for transient network fluctuations
      let response: Response | null = null;
      let lastFetchError: any = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
          break;
        } catch (fetchErr) {
          lastFetchError = fetchErr;
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } else if (response) {
        const errText = await response.text();
        console.warn(
          `[AI Engine] Vertex AI (${vertexConfig.location}/${model}) returned ${response.status}: ${errText}. Attempting fallback...`,
        );
      } else if (lastFetchError) {
        console.warn("[AI Engine] Vertex AI fetch error:", lastFetchError, ". Attempting fallback...");
      }
    }
  } catch (vertexError) {
    console.warn("[AI Engine] Vertex AI execution error:", vertexError, ". Attempting fallback...");
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDER 2: Google AI Studio / Gemini API Key (Fallback)
  // ───────────────────────────────────────────────────────────────────────────
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const requestBody: Record<string, any> = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 8192,
        },
      };

      if (useSearchGrounding) {
        requestBody.tools = [{ googleSearch: {} }];
      } else {
        requestBody.generationConfig.responseMimeType = "application/json";
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } else {
        const errText = await response.text();
        console.warn(
          `[AI Engine] Gemini API (${model}) returned status ${response.status}: ${errText}. Attempting secondary provider...`,
        );
      }
    } catch (geminiError) {
      console.warn("[AI Engine] Gemini API request failed:", geminiError, ". Attempting secondary provider...");
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDER 3: Secondary AI Provider (Qwen / OpenAI Compatible Endpoint)
  // ───────────────────────────────────────────────────────────────────────────
  const secondary = getSecondaryLLMConfig();
  if (secondary) {
    try {
      const fetchUrl = secondary.baseUrl.endsWith("/chat/completions")
        ? secondary.baseUrl
        : `${secondary.baseUrl.replace(/\/$/, "")}/chat/completions`;

      const response = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secondary.apiKey}`,
        },
        body: JSON.stringify({
          model: secondary.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } else {
        const errText = await response.text();
        console.warn(`[AI Engine] Secondary LLM returned status ${response.status}: ${errText}`);
      }
    } catch (secondaryError) {
      console.warn("[AI Engine] Secondary LLM call failed:", secondaryError);
    }
  }

  throw new Error(
    "No AI providers responded successfully. Please verify Vertex AI credentials or ensure GEMINI_API_KEY is configured in your environment.",
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 1: REAL-TIME DEEP RESEARCH & TOPIC DISCOVERY (VERTEX AI GLOBAL)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function performDeepTopicResearch(
  existingSlugsAndTitles: Array<{ slug: string; title: string }>,
): Promise<ResearchTopicResult> {
  const existingListText = existingSlugsAndTitles
    .slice(-30)
    .map((item) => `- "${item.title}" (slug: ${item.slug})`)
    .join("\n");

  const systemInstruction = `You are a Senior SaaS & AI Principal Architect and Technical Partner to startup founders (writing in Mehdi Golzari's voice).
Your job is to scout current tech news, engineering breakthroughs, and ecosystem shifts to discover an ultra-high-signal, timely, and practical technical topic specifically tailored to early-stage SaaS & AI founders.

AUDIENCE PROFILE:
- Early-stage SaaS & AI founders, technical co-founders, and solo builders.
- Goals: Ship fast, avoid costly rewrites, keep cloud/LLM burn rates low, and build resilient production systems.

HIGH-LEVERAGE THEMES TO SCOUT:
1. Agentic AI & Deterministic Engineering: Escaping non-deterministic agent loops, structured tool-use guardrails, FSM-based state machines, token optimization.
2. Real-World RAG & Search: Hybrid BM25/Dense Vector search, cross-encoder reranking, schema-aware indexing, reducing vector DB costs.
3. Pragmatic SaaS Foundations: Modular monoliths vs microservices, PostgreSQL Row-Level Security (RLS) multi-tenancy, background task queues (BullMQ/Redis).
4. Data & Infra Resilience: Zero-downtime database migrations (Expand & Contract), serverless cost traps, robust SSR architecture.
5. Tech Debt Rescue: Auditing legacy codebases, avoiding premature scaling, and accelerating time-to-market.

CRITICAL DEDUPLICATION RULE:
You MUST NOT select any topic that matches or overlaps with these recently published articles:
${existingListText || "None yet published."}

Return a STRICT JSON object with this EXACT structure (valid JSON only, no markdown wrappers):
{
  "selectedTopic": "Short topic summary",
  "sourceTrend": "Current tech news, ecosystem shift, or trending discussion on HackerNews, Substack, Medium, or GitHub",
  "coreProblem": "The root architectural failure mode or financial burn founders encounter",
  "whyCTOsCare": "Concrete business stakes for early founders (time-to-MVP, cloud bills, customer churn, technical debt)",
  "suggestedTitle": "Action-oriented, high-CTR headline for startup founders (max 60 chars)",
  "suggestedSlug": "kebab-case-slug-without-special-chars",
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

  const userPrompt =
    "Search current high-signal technical news and founder discussions to discover an urgent, practical architectural topic. Return the selected JSON topic now.";

  const deepResearchModel =
    process.env.GEMINI_DEEPRESEARCH_MODEL ||
    process.env.GEMINI_RESEARCH_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-3.7-flash";

  const rawJson = await executeUniversalLLMPrompt(
    systemInstruction,
    userPrompt,
    0.7,
    true,
    deepResearchModel,
  );

  const parsed = extractJsonObject<ResearchTopicResult>(rawJson);

  // Clean slug
  parsed.suggestedSlug = (parsed.suggestedSlug || "autonomous-tech-insight")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!parsed.tags || !Array.isArray(parsed.tags)) {
    parsed.tags = ["Architecture", "SaaS", "AI"];
  }

  return parsed;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 2: CTO-GRADE TECHNICAL ARTICLE DRAFTING & SEO (VERTEX AI GLOBAL)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function generateBlogPostContent(
  research: ResearchTopicResult,
): Promise<GeneratedArticleResult> {
  const systemPrompt = `You are Mehdi Golzari, Senior Independent Technical Partner to SaaS & AI startup founders.
You write authoritative, battle-tested, CTO-level architectural guides grounded in modern software engineering and your proprietary Founder-to-Launch Framework™.

TARGET AUDIENCE:
Early-stage SaaS & AI founders and CTOs who need actionable, battle-tested solutions to build scalable products without burning investor cash or getting trapped in rewrite cycles.

MANDATORY WRITING & FORMATTING RULES:
1. Tone: Pragmatic, authoritative, direct, and developer-first. No generic AI fluff or surface-level summaries.
2. Structured Callout Blocks (CRITICAL):
   You MUST include at least 3-4 structured callout alert blocks throughout the article using these exact formats:
   - \`> [!IMPORTANT]\` followed by non-negotiable architectural requirements or security boundaries.
   - \`> [!RECOMMENDATION]\` followed by high-leverage advice to save weeks of dev time or cut 80% off cloud/token bills.
   - \`> [!WARNING]\` followed by dangerous failure modes or premature scaling traps.
   - \`> [!NOTE]\` followed by technical context, benchmarks, or ecosystem insights.
3. Code Blocks:
   Provide complete, realistic code blocks (TypeScript / SQL / Python / Bash) with explicit typing, realistic error handling, and inline comments explaining the rationale. Always specify the language tag (e.g. \`\`\`typescript or \`\`\`sql).
4. Visual Architecture Flow:
   Include at least one structured ASCII or Mermaid flow diagram illustrating the data pipeline or state transitions.
5. Architectural Comparison Matrix:
   Include a clean Markdown comparison table contrasting:
   | Architecture / Approach | Time-to-MVP | Monthly Cost | Operational Complexity | Failure Mode |
6. Numbered CTO Action Checklist:
   Provide a step-by-step checklist with bold titles and concrete founder directives.
7. Blueprint Advisory Callout:
   Include a natural concluding recommendation referencing the free Go-to-Launch Blueprint™ (https://mehdigolzari.dev/blueprint) for founders needing an independent code, cost, or architecture audit.

Return a STRICT JSON object with this EXACT structure (valid JSON only, no markdown code block surrounding the JSON):
{
  "title": "Compelling CTO-level Title",
  "slug": "${research.suggestedSlug}",
  "excerpt": "High-impact 2-sentence summary explaining the problem and solution (max 160 chars)",
  "tags": ${JSON.stringify(research.tags)},
  "contentMarkdown": "Full comprehensive Markdown article (1,500 - 2,500 words)...",
  "targetKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "imagePrompt": "Detailed prompt describing a dark-mode 3D architectural illustration with glowing indigo and neon violet accents for the cover banner"
}`;

  const userPrompt = `Topic Research Brief:
- Selected Topic: ${research.selectedTopic}
- Source Trend: ${research.sourceTrend}
- Core Problem: ${research.coreProblem}
- Why CTOs Care: ${research.whyCTOsCare}
- Suggested Title: ${research.suggestedTitle}
- Suggested Slug: ${research.suggestedSlug}
- Tags: ${research.tags.join(", ")}

Draft the complete, production-grade technical article JSON now with rich alert blocks, code snippets, comparison table, and checklist.`;

  const contentModel =
    process.env.GEMINI_CONTENT_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-3.7-flash";

  const rawJson = await executeUniversalLLMPrompt(
    systemPrompt,
    userPrompt,
    0.6,
    false,
    contentModel,
  );

  const parsed = extractJsonObject<GeneratedArticleResult>(rawJson);

  // Calculate actual reading time based on word count (~200 words per minute)
  const wordCount = (parsed.contentMarkdown || "").split(/\s+/).filter(Boolean).length;
  parsed.readTimeMinutes = Math.max(3, Math.ceil(wordCount / 200));

  parsed.slug = (parsed.slug || research.suggestedSlug)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  return parsed;
}

import { buildBrandedBlogHeroSvg } from "./svg-generator";

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

  const svgContent = buildBrandedBlogHeroSvg(slug, title, categoryTag);

  await fs.writeFile(filePath, svgContent, "utf-8");
  return `/api/blog/asset?slug=${slug}`;
}
