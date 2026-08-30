import fs from "fs/promises";
import path from "path";
import { GoogleAuth } from "google-auth-library";

import {
  BLOG_PILLAR_CATEGORIES,
  type BlogInventorySummary,
  checkContentDuplicate,
} from "./db";

export interface ResearchTopicResult {
  selectedTopic: string;
  sourceTrend: string;
  coreProblem: string;
  whyCTOsCare: string;
  suggestedTitle: string;
  suggestedSlug: string;
  pillarCategory: string;
  tags: string[];
}

export interface GeneratedArticleResult {
  title: string;
  slug: string;
  excerpt: string;
  readTimeMinutes: number;
  tags: string[];
  pillarCategory: string;
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
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 1: REAL-TIME DEEP RESEARCH & TOPIC DISCOVERY (VERTEX AI GLOBAL)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function performDeepTopicResearch(
  inventory: BlogInventorySummary,
): Promise<ResearchTopicResult> {
  const publishedArticlesText = (inventory.articles || [])
    .slice(-30)
    .map(
      (item) =>
        `- "${item.title}" (slug: ${item.slug}, category: ${item.category}, tags: ${item.tags.join(", ")})\n  Theme: ${item.excerpt}`,
    )
    .join("\n");

  const categoriesCatalogText = BLOG_PILLAR_CATEGORIES.map(
    (c) =>
      `- Category ID: "${c.id}" | Name: "${c.name}"\n  Description: ${c.description}\n  Target Focus: ${c.themeKeywords.join(", ")}`,
  ).join("\n\n");

  const systemInstruction = `You are Mehdi Golzari, a Senior Independent Technical Partner and Fractional CTO for early-stage SaaS & AI startup founders.
Your job is to scout current tech news, AI ecosystem shifts, and startup engineering trends to discover high-converting, high-signal architectural topics.

AUDIENCE PROFILE (CRITICAL):
- Primary Audience: Founders, solo entrepreneurs, product-led leaders, and domain experts who are ACTIVELY LOOKING FOR A TECHNICAL CO-FOUNDER OR FRACTIONAL CTO to lead their system architecture and turn their vision into a scalable, production-grade MVP.
- What Keeps Them Awake at Night:
  * Fear of wasting $50k-$100k+ on dev agencies or offshore teams that deliver unmaintainable spaghetti code.
  * Navigating complex tech choices (AI models, vector databases, auth, multi-tenant databases, cloud infra) without deep engineering expertise.
  * Experiencing runaway AI token bills, non-deterministic agent crashes, and slow feature velocity.
  * Needing a senior technical partner to prepare their codebase for investor due diligence and seed funding.

5 CORE STRATEGIC PILLAR CATEGORIES (You MUST assign the topic to one of these):
${categoriesCatalogText}

CRITICAL DEDUPLICATION RULE:
You MUST NOT select any topic that matches or overlaps with these published articles:
${publishedArticlesText || "None yet published."}

Return a STRICT JSON object with this EXACT structure (valid JSON only, no markdown code wrappers):
{
  "selectedTopic": "Short topic summary",
  "sourceTrend": "Current tech news, ecosystem shift, or trending discussion on HackerNews, Substack, Medium, or GitHub",
  "coreProblem": "The root architectural trap, financial drain, or vendor failure founders face",
  "whyCTOsCare": "Why a founder seeking a technical partner needs this exact insight to protect their product and capital",
  "suggestedTitle": "High-impact, founder-converting headline (max 60 chars)",
  "suggestedSlug": "kebab-case-slug-without-special-chars",
  "pillarCategory": "ai-engineering",
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

  const userPrompt =
    "Search current tech news and founder discussions to discover an urgent, practical topic for founders seeking a technical co-founder/partner. Return the selected JSON topic now.";

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

  // Validate pillar category
  const validPillarIds = BLOG_PILLAR_CATEGORIES.map((c) => c.id as string);
  if (!parsed.pillarCategory || !validPillarIds.includes(parsed.pillarCategory)) {
    parsed.pillarCategory = "ai-engineering";
  }

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
  inventory?: BlogInventorySummary,
): Promise<GeneratedArticleResult> {
  const publishedArticles = inventory?.articles || [];
  const conversionPages = inventory?.conversionPages || [];

  const existingLinksInventoryText = [
    "--- HIGH-VALUE CONVERSION & ADVISORY PAGES ---",
    ...conversionPages.map(
      (cp) => `- [${cp.title}](${cp.url}) -> Intent: ${cp.intent}`,
    ),
    "",
    "--- PUBLISHED ARTICLES IN OUR REPOSITORY (FOR TOPIC CLUSTER CROSS-LINKING) ---",
    ...publishedArticles.slice(0, 15).map(
      (pa) => `- [${pa.title}](${pa.url}) (Category: ${pa.category}) -> Focus: ${pa.excerpt}`,
    ),
  ].join("\n");

  const systemPrompt = `You are Mehdi Golzari, Senior Independent Technical Partner & Fractional CTO for SaaS & AI startup founders.
You write authoritative, pragmatic, and high-trust architectural guides grounded in modern software engineering and your proprietary Founder-to-Launch Framework™.

PRIMARY OBJECTIVE:
Educate and empower startup founders who are looking for an experienced Technical Co-Founder or Fractional CTO to lead their product engineering from zero to launch.

MANDATORY WRITING & FORMATTING RULES:
1. Tone: Pragmatic, authoritative, lucid, and empathetic to founders. Demystify complex engineering into high-leverage business decisions without sacrificing technical depth.
2. Structured Callout Blocks (CRITICAL):
   You MUST include at least 3-4 structured callout alert blocks throughout the article:
   - \`> [!IMPORTANT]\` followed by essential architectural principles or security boundaries.
   - \`> [!RECOMMENDATION]\` followed by high-leverage advice on saving dev capital, speeding up launch by weeks, or slashing 80% off cloud/AI bills.
   - \`> [!WARNING]\` followed by common agency traps, premature scaling pitfalls, or costly rewrite mistakes.
   - \`> [!NOTE]\` followed by technical benchmarks, ecosystem context, or due diligence standards.
3. Code & Architecture Blocks:
   Provide concrete, production-grade snippets (TypeScript / SQL / Python / Bash) with clear explanatory comments showing how clean architecture is structured in practice.
4. Visual Architecture Flow:
   Include a structured ASCII or Mermaid flow diagram illustrating the clean data flow or state machine.
5. Architectural Comparison Matrix:
   Include a clean Markdown comparison table:
   | Approach | Time-to-MVP | Monthly Burn ($) | Dev Complexity | Failure Risk |
6. Numbered CTO Action Checklist:
   Provide a step-by-step checklist with bold titles and concrete founder directives.
7. CONTEXTUAL SEMANTIC INTERNAL LINKING (CRITICAL SEO REQUIREMENT):
   You MUST insert 3 to 5 natural, high-relevance internal markdown links into the body content referencing our site inventory:
   ${existingLinksInventoryText}
   - Rule A: Always use descriptive, keyword-rich anchor text that clearly explains the destination page. For example: [deterministic AI state machines](/blog/why-naive-ai-agents-fail-deterministic-mvp-architecture). NEVER use vague text like "click here", "read this", or "our website".
   - Rule B: When discussing early MVP scoping, boundary validation, or technical debt prevention, naturally link to [Founder-to-Launch Blueprint™](/blueprint).
   - Rule C: When discussing hiring technical partners, CTO equity, or auditing agency code, link to [Fractional CTO Advisory](/offers/fractional-cto) or [Technical Due Diligence](/offers/technical-due-diligence).
   - Rule D: Cross-link to related published articles from our catalog when referencing complementary engineering topics.

Return a STRICT JSON object with this EXACT structure (valid JSON only, no markdown code block surrounding the JSON):
{
  "title": "Compelling Headline",
  "slug": "${research.suggestedSlug}",
  "excerpt": "High-impact 2-sentence summary explaining the problem and solution (max 160 chars)",
  "tags": ${JSON.stringify(research.tags)},
  "pillarCategory": "${research.pillarCategory || "ai-engineering"}",
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
- Pillar Category: ${research.pillarCategory || "ai-engineering"}
- Tags: ${research.tags.join(", ")}

Draft the complete, production-grade technical article JSON now with internal links, rich alert blocks, code snippets, comparison table, and checklist for founders looking for a technical partner.`;

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

  // Fallback link enrichment if model generated zero internal links
  if (inventory && (!parsed.contentMarkdown.includes("](") || !parsed.contentMarkdown.includes("/"))) {
    parsed.contentMarkdown = enrichContentWithFallbackInternalLinks(parsed.contentMarkdown, inventory);
  }

  // Calculate actual reading time based on word count (~200 words per minute)
  const wordCount = (parsed.contentMarkdown || "").split(/\s+/).filter(Boolean).length;
  parsed.readTimeMinutes = Math.max(3, Math.ceil(wordCount / 200));

  parsed.slug = (parsed.slug || research.suggestedSlug)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  parsed.pillarCategory = research.pillarCategory || parsed.pillarCategory || "ai-engineering";

  return parsed;
}

export function enrichContentWithFallbackInternalLinks(
  contentMarkdown: string,
  inventory: BlogInventorySummary,
): string {
  let enriched = contentMarkdown;

  // Link Blueprint if not already linked
  if (!enriched.includes("/blueprint")) {
    enriched = enriched.replace(
      /(Founder-to-Launch Framework™|Go-to-Launch Blueprint|MVP architecture blueprint)/i,
      "[$1](/blueprint)",
    );
  }

  // Link Fractional CTO if not already linked
  if (!enriched.includes("/offers/fractional-cto")) {
    enriched = enriched.replace(
      /(Fractional CTO|Technical Partner Advisory|Technical Co-Founder)/i,
      "[$1](/offers/fractional-cto)",
    );
  }

  // Link existing articles if matching their title
  for (const article of inventory.articles || []) {
    if (!enriched.includes(article.url)) {
      const escapedTitle = article.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const titleRegex = new RegExp(`\\b(${escapedTitle})\\b`, "i");
      if (titleRegex.test(enriched)) {
        enriched = enriched.replace(titleRegex, `[$1](${article.url})`);
        break; // Add 1 article link fallback
      }
    }
  }

  return enriched;
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
