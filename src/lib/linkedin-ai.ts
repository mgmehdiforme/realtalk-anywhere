import { executeUniversalLLMPrompt, extractJsonObject } from "./gemini";

export interface LinkedInFeedCandidate {
  index: number;
  domIndex?: number;
  authorName: string;
  authorHeadline: string;
  postText: string;
  postUrl: string;
  activityUrn?: string;
  reactionsCount?: number;
  commentsCount?: number;
}

export interface CandidateEvaluationResult {
  decision: "ENGAGE" | "SKIP";
  selectedPost: LinkedInFeedCandidate | null;
  selectedIndex: number | null;
  relevanceScore: number;
  reason: string;
  isSuitable: boolean;
}

/**
 * Stage 1: Evaluate Feed Candidates against Mehdi Golzari's Fractional CTO & Technical Partner ICP
 */
export async function evaluateFeedCandidates(
  candidates: LinkedInFeedCandidate[],
  topicContext?: string,
): Promise<CandidateEvaluationResult> {
  if (!candidates || candidates.length === 0) {
    return {
      decision: "SKIP",
      selectedPost: null,
      selectedIndex: null,
      relevanceScore: 0,
      reason: "No feed candidates available to evaluate.",
      isSuitable: false,
    };
  }

  const formattedCandidates = candidates.map((c) => ({
    index: c.index,
    author: `${c.authorName} (${c.authorHeadline || "No headline"})`,
    engagement: `${c.reactionsCount ?? 0} reactions/likes, ${c.commentsCount ?? 0} comments`,
    preview: c.postText.slice(0, 600),
  }));

  const systemPrompt = `You are the elite AI strategic advisor for Mehdi Golzari (Senior Independent Technical Partner & Fractional CTO for SaaS and AI startup founders).
Your task is to review posts scanned from LinkedIn search and select AT MOST ONE post that is a high-value opportunity for Mehdi to leave an authoritative, insightful technical comment.

${topicContext ? `CURRENT SCOUTING CONTEXT / THEME: "${topicContext}"\n` : ""}
MEHDI'S TARGET CLIENT PROFILE (HIGH VALUE POSTS):
1. Early-stage or seed SaaS/AI startup founders grappling with architecture choices (Postgres vs NoSQL, serverless vs containers, modular monolith vs microservices).
2. Founders or lead engineers building AI agents, LLM integrations, or coping with high token burn, agent non-determinism, or reliability failures.
3. Founders venting or asking about dev agency quotes, unmaintainable codebases, technical debt, or seeking an experienced technical partner/CTO.
4. Engineering leaders sharing real-world software engineering trade-offs, database bottlenecks, or scaling roadblocks.

PRIORITIZE POSTS WITH ACTIVE ENGAGEMENT:
- Strongly prefer posts that have active peer discussion and engagement (>0 reactions and comments) over zero-engagement posts.
- High peer engagement indicates a lively founder discussion where Mehdi's authoritative CTO perspective will reach active founders and peers.

STRICT DISQUALIFICATION CRITERIA (IMMEDIATELY SCORE = 0):
- BOOK LAUNCHES, AMAZON LINKS, AUTHOR PROMOTIONS (e.g. "My book is live on Amazon", "Order your copy", self-published author plugs).
- COURSE, BOOTCAMP, WEBINAR, MASTERCLASS, OR EVENT SALES PITCHES.
- "COMMENT TO RECEIVE PDF / DM ME FOR LINK" OR NEWSLETTER LEAD MAGNETS.
- RECRUITING, HIRING, JOB OPENINGS, OR VACANCIES (NEVER SELECT JOB POSTS OR POSTS FROM RECRUITERS/HR).
- Sponsored / Advertisements / Promoted posts / Affiliate links.
- Work anniversaries, generic celebrations, "Excited to join" posts.
- Generic motivational quotes, listicles, or shallow engagement bait.
- Non-technical business topics (e.g. general sales tips, real estate, politics).

EVALUATION THRESHOLD:
- A post is only suitable if relevanceScore >= 75.
- If none of the candidates score >= 75 or all are disqualified, set selectedIndex to null.

Return a STRICT JSON object with this EXACT structure (valid JSON only, no markdown code block):
{
  "selectedIndex": 0, // integer index of best candidate, or null if none score >= 75
  "relevanceScore": 85, // integer 0 to 100
  "reason": "Clear explanation of why this post is an ideal architectural conversation for a fractional CTO"
}`;

  const userPrompt = `Review these candidates from the LinkedIn feed:\n${JSON.stringify(formattedCandidates, null, 2)}\n\nEvaluate them now.`;

  try {
    const rawJson = await executeUniversalLLMPrompt(systemPrompt, userPrompt, 0.2);
    const parsed = extractJsonObject<{
      selectedIndex: number | null;
      relevanceScore: number;
      reason: string;
    }>(rawJson);

    const validIndex =
      parsed.selectedIndex !== null &&
      parsed.selectedIndex !== undefined &&
      typeof parsed.selectedIndex === "number" &&
      parsed.selectedIndex >= 0 &&
      parsed.selectedIndex < candidates.length;

    const score = typeof parsed.relevanceScore === "number" ? parsed.relevanceScore : 0;
    const isSuitable = validIndex && score >= 75;

    const selectedPost = isSuitable ? candidates[parsed.selectedIndex!] : null;
    const decision: "ENGAGE" | "SKIP" = isSuitable && selectedPost ? "ENGAGE" : "SKIP";

    return {
      decision,
      selectedPost,
      selectedIndex: isSuitable ? parsed.selectedIndex : null,
      relevanceScore: score,
      reason: parsed.reason || "Evaluated by AI",
      isSuitable,
    };
  } catch (error: any) {
    console.error("[LinkedIn AI] Candidate evaluation error:", error);
    return {
      decision: "SKIP",
      selectedPost: null,
      selectedIndex: null,
      relevanceScore: 0,
      reason: `Evaluation failed: ${error.message || "Unknown error"}`,
      isSuitable: false,
    };
  }
}

/**
 * Stage 2: Generate Authoritative, Pure-Value CTO Comment (No Spam Links)
 */
export async function generateCTOComment(
  targetPost: LinkedInFeedCandidate,
): Promise<string> {
  const systemPrompt = `You are Mehdi Golzari, Fractional CTO & Senior Technical Partner for SaaS and AI founders.
You are writing a LinkedIn comment on a post in your feed.

YOUR OBJECTIVE:
Write a comment that is popular, approachable, and comforting to founders—something startup builders LOVE to hear, relate to, and immediately hit "Like" and reply to! 🚀

STYLE & TONE CRITERIA:
1. COMFORTABLE TO UNDERSTAND & SIMPLE:
   - Use simple, everyday conversational English (crisp, clear, easy to read).
   - AVOID dense, heavy academic jargon (do NOT use phrases like "runtime container", "definition control plane", "orchestrator state machines", or "downstream contract schema drift").
   - Keep sentences short, punchy, and crystal clear. Anyone skimming LinkedIn on mobile should get the insight in 3 seconds.

2. WHAT FOUNDERS & STARTUP TARGETS LOVE TO HEAR:
   - Founders love practical validation, empathy, and advice that saves them money, time, and headaches.
   - Speak directly to real founder realities: keeping tech simple, shipping MVPs faster, saving runway, avoiding costly rewrites, and not over-engineering before product-market fit.
   - Relatable founder truths: "The best architecture is the one that lets you ship without breaking", "Keep it dead simple until traction demands more", "Solve customer problems first, scale later".

3. ADD EMOJIS (2 TO 4 TASTEFUL EMOJIS):
   - Include 2 to 4 engaging, natural emojis (e.g. 🎯, 💡, 🚀, 👏, 🧠, ⚡, 🛠️, 💯) to make the comment visually pop and feel human, warm, and lively.

4. POPULAR VIBE INSTEAD OF HYPER-TECHNICAL:
   - Write like an experienced, charismatic CTO friend having coffee with a founder—NOT a compiler engineer writing an RFC spec.
   - Open with a warm, punchy hook (e.g. "Spot on! 🎯", "100% this. 👏", "Such an important reminder. 💡").
   - Share one crisp, golden rule of thumb or relatable trap.
   - Close with an encouraging, engaging punchline that invites peer interaction.

5. ZERO SPAM / NO PROMO:
   - NEVER pitch ("DM me", "Visit my site"), NO URLs, NO hashtags.
   - Your natural warmth, clarity, and authority will make founders check your profile.

LENGTH & FORMAT:
- 35 to 65 words max.
- Use 2 or 3 short paragraphs / lines so it's super easy to read on mobile.

Return ONLY the plain comment text ready to post on LinkedIn. Do not wrap in quotes.`;

  const userPrompt = `Author: ${targetPost.authorName} (${targetPost.authorHeadline})
Post Text:
"""
${targetPost.postText}
"""

Draft the friendly, popular, emoji-rich comment now:`;

  try {
    const commentText = await executeUniversalLLMPrompt(
      systemPrompt,
      userPrompt,
      0.6,
      false,
      "gemini-3.7-flash",
    );
    let cleanText = commentText.trim();
    if (cleanText.startsWith("{") && cleanText.endsWith("}")) {
      try {
        const parsed = extractJsonObject<{ comment?: string; text?: string }>(cleanText);
        cleanText = parsed.comment || parsed.text || cleanText;
      } catch (_) {}
    }
    return cleanText
      .replace(/^["']|["']$/g, "") // remove surrounding quotes if any
      .trim();
  } catch (error: any) {
    console.error("[LinkedIn AI] Comment generation error:", error);
    throw new Error(`Failed to generate CTO comment: ${error.message}`);
  }
}

export interface TrendingLinkedInQuery {
  query: string;
  sourceTrend: string;
  relevanceAngle: string;
}

const CURATED_FALLBACK_QUERIES: TrendingLinkedInQuery[] = [
  {
    query: "AI agents in production",
    sourceTrend: "Production challenges with agent reliability, hallucination cascades, and runaway API token costs.",
    relevanceAngle: "Founders need deterministic architectural guardrails, caching, and eval frameworks from an experienced Fractional CTO.",
  },
  {
    query: "SaaS tech stack lessons",
    sourceTrend: "Early-stage founders debating technology choices, database bottlenecks, and architectural trade-offs.",
    relevanceAngle: "Pragmatic CTO guidance prevents premature complexity and saves months of wasted engineering runway.",
  },
  {
    query: "scaling Postgres database",
    sourceTrend: "Startups encountering connection pooling limits, slow queries, and table partition hurdles under high load.",
    relevanceAngle: "Senior database indexing and architecture patterns prevent catastrophic outages during user spikes.",
  },
  {
    query: "modular monolith vs microservices",
    sourceTrend: "Growing industry backlash against premature distributed systems among seed-stage SaaS engineering teams.",
    relevanceAngle: "Guiding founders toward clean modular monoliths that maximize shipping velocity and minimize ops overhead.",
  },
  {
    query: "LLM latency production",
    sourceTrend: "Engineers struggling with streaming time-to-first-token, semantic caching, and asynchronous inference queues.",
    relevanceAngle: "Architectural optimization for real-time generative AI interfaces and responsive user experiences.",
  },
  {
    query: "technical cofounder SaaS",
    sourceTrend: "Solo founders and domain experts struggling to find technical co-founders to build investor-ready MVPs.",
    relevanceAngle: "Direct Fractional CTO engagement delivers immediate senior leadership without premature equity dilution.",
  },
];

/**
 * Stage 0: Discover Live Tech Trends via Google Search Grounding to Formulate LinkedIn Search Keywords
 */
export async function discoverTrendingLinkedInSearchQuery(): Promise<TrendingLinkedInQuery> {
  console.log("[LinkedIn AI] Scouting live tech trends via Google Search Grounding...");

  const systemPrompt = `You are an elite AI growth and technical intelligence agent for Mehdi Golzari (Fractional CTO & Senior Independent Technical Partner for SaaS and AI startup founders).
Your goal is to use real-time Google Search grounding to discover what early-stage founders, startup technical co-founders, and engineering leads are actively discussing, struggling with, or debating right now in the software engineering and startup tech ecosystem.

AREAS OF INTEREST (MUST BE PRACTICAL ENGINEERING & ARCHITECTURE):
- Real-world AI agent production failures, LLM orchestration, token cost blowouts, MCP (Model Context Protocol), local models, deterministic agent state machines.
- Early-stage SaaS architecture choices: Modular monolith vs microservices, Postgres (pgvector) vs specialized DBs, Supabase vs custom backend, Next.js / TanStack / Node.
- Founder technical debt, dev agency horror stories, preparing codebases for investor due diligence, MVP development speed vs maintainability.

STRICT QUERY FORMULATION RULES:
1. The search query MUST target practitioners and founders sharing real engineering challenges, NOT marketers, authors, or recruiters.
2. DO NOT formulate queries about books, courses, tutorials, certificates, news headlines, or general AI hype.
3. Formulate a short, punchy search phrase (2 to 4 words ONLY) that will surface founders actively posting about this topic on LinkedIn.
   - Excellent examples: "AI agents in production", "SaaS tech stack", "scaling Postgres", "modular monolith architecture", "LLM latency production".
   - CRITICAL: Do NOT include hashtags, quotes, or punctuation in the query.

Return a STRICT JSON object with this EXACT structure (valid JSON only, no markdown code block):
{
  "query": "2-4 word search phrase for LinkedIn",
  "sourceTrend": "Brief explanation of the trending debate or engineering dilemma discovered via Google Search",
  "relevanceAngle": "Why founders posting about this need a Fractional CTO / Senior Technical Partner"
}`;

  const userPrompt =
    "Perform a real-time Google search for current startup tech and AI engineering discussions. Return the trending LinkedIn search query in JSON.";

  try {
    const rawJson = await executeUniversalLLMPrompt(
      systemPrompt,
      userPrompt,
      0.7,
      true, // Enable Google Search Grounding!
      "gemini-3.7-flash",
    );

    const parsed = extractJsonObject<TrendingLinkedInQuery>(rawJson);

    if (parsed && parsed.query && typeof parsed.query === "string") {
      // Clean query: remove punctuation, quotes, hashtags, and limit to max 4 words
      let cleanQuery = parsed.query
        .replace(/[#"'`.,!?:;()]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const words = cleanQuery.split(" ");
      if (words.length > 5) {
        cleanQuery = words.slice(0, 4).join(" ");
      }

      return {
        query: cleanQuery,
        sourceTrend: parsed.sourceTrend || "Current tech discussion discovered via Google Search",
        relevanceAngle:
          parsed.relevanceAngle ||
          "High-value architectural discussion for early-stage startup founders",
      };
    }

    console.warn("[LinkedIn AI] Grounding returned invalid format, falling back to curated query.");
  } catch (error: any) {
    console.warn("[LinkedIn AI] Google Search grounding trend discovery failed:", error?.message || error);
  }

  // Fallback to random curated query if grounding fails or times out
  const fallback =
    CURATED_FALLBACK_QUERIES[Math.floor(Math.random() * CURATED_FALLBACK_QUERIES.length)];
  console.log(`[LinkedIn AI] Using curated fallback search query: "${fallback.query}"`);
  return fallback;
}

