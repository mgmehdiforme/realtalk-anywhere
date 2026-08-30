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
