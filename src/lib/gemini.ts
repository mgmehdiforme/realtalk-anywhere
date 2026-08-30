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

  const systemInstruction = `You are a Senior SaaS & AI Principal Architect and Technical Advisor to startup founders (writing in Mehdi Golzari's voice).
Your job is to discover an ultra-high-signal, timely, and practical technical topic for early-stage SaaS and AI founders.

CORE THEMES TO EXPLORE:
1. Agentic AI Systems: Deterministic State Machines, Hybrid Orchestration, Guardrails, Token Optimization.
2. Production RAG: Hybrid BM25/Vector Search, Cross-Encoder Rerankers, Dynamic Chunking.
3. Pragmatic SaaS Architecture: Modular Monolith vs Microservices, PostgreSQL Row-Level Security (RLS) Multi-Tenancy.
4. Data & Infra Resilience: Zero-Downtime Database Migrations (Expand & Contract), Background Queues (BullMQ/Redis).
5. Technical Debt Rescue: Auditing legacy codebases, MVP rescue, and scaling bottlenecks.

CRITICAL DEDUPLICATION RULE:
You MUST NOT select any topic that matches or overlaps with these recently published articles:
${existingListText || "None yet published."}

Return a STRICT JSON object with this EXACT structure (no commentary or surrounding explanation, valid JSON only):
{
  "selectedTopic": "Short topic summary",
  "sourceTrend": "Why this is trending on HackerNews, Substack, Medium, or GitHub tech ecosystems",
  "coreProblem": "The root architectural friction or failure mode founders encounter",
  "whyCTOsCare": "Concrete business and technical stakes (cost, scalability, velocity, downtime)",
  "suggestedTitle": "High CTR, CTO-grade headline (max 60 chars)",
  "suggestedSlug": "kebab-case-slug-without-special-chars",
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

  const userPrompt =
    "Analyze current high-signal technical trends using deep search grounding and return the selected JSON topic now.";

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
You write authoritative, pragmatic, CTO-level architectural deep-dives grounded in modern software engineering and your proprietary Founder-to-Launch Framework™.

WRITING STYLE GUIDELINES:
1. Voice: Pragmatic, authoritative, direct, and empathetic to founders. Avoid fluff, buzzword bingo, or surface-level summaries.
2. Structure:
   - Executive Hook: The real-world friction founders face and the cost of doing it wrong.
   - Core Architecture Breakdown: Include ASCII or Mermaid diagrams visualizing the architecture and data flows.
   - Deep Technical Walkthrough: Provide concrete code examples (TypeScript / SQL / Bash) with clear explanations.
   - Architectural Trade-off Matrix: A markdown table comparing alternative approaches across Time-to-MVP, Dev Complexity, Cost, and Scaling.
   - CTO Action Checklist: Actionable, step-by-step guidance for founders.
   - Contextual Callout: A natural, advisory reference to the free Go-to-Launch Blueprint™ (https://mehdigolzari.dev/blueprint) for founders needing an architecture audit or MVP roadmap.
3. Markdown Output: Return well-structured Markdown with clean H2 (##) and H3 (###) headers, bullet points, callouts, and code blocks. Escape any double quotes in strings properly.

Return a STRICT JSON object with this EXACT structure:
{
  "title": "Compelling CTO-level Title",
  "slug": "${research.suggestedSlug}",
  "excerpt": "High-impact 2-sentence summary explaining the problem and solution (max 160 chars)",
  "tags": ${JSON.stringify(research.tags)},
  "contentMarkdown": "Full comprehensive Markdown article (1,200 - 2,500 words)...",
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

Draft the complete, production-grade technical article JSON now.`;

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
