import fs from "fs/promises";
import path from "path";

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

export interface User {
  email: string;
  name: string;
  picture: string;
  createdAt: number;
}

export interface Blueprint {
  email: string;
  answers: Record<string, any>;
  submittedAt: string | null;
  reportPdfPath: string | null;
  reportData: any | null;
  unlockRequestedAt?: string | null;
  unlockLinkedInUrl?: string | null;
}

export const BLOG_PILLAR_CATEGORIES = [
  {
    id: "ai-engineering",
    name: "AI Engineering & Deterministic Systems",
    description: "Taming non-deterministic LLMs, structured state machines, multi-tenant vector databases, and enterprise AI safeguards.",
    themeKeywords: ["deterministic AI", "state machines", "LLM agents", "AI MVP", "token cost optimization", "LangGraph", "vector search"],
  },
  {
    id: "fractional-cto",
    name: "Fractional CTO & Technical Partnering",
    description: "Strategic engineering leadership, hiring technical co-founders vs fractional CTOs, equity structures, and developer team management.",
    themeKeywords: ["fractional CTO", "technical co-founder", "technical partner", "dev agency audit", "founder CTO relationship", "equity vesting"],
  },
  {
    id: "mvp-architecture",
    name: "MVP Architecture & Scale-Ready Stacks",
    description: "Building 0-to-1 production web apps, modular monoliths, PostgreSQL RLS multi-tenancy, and low-idle-cost cloud architectures.",
    themeKeywords: ["MVP architecture", "modular monolith", "PostgreSQL RLS", "multi-tenant SaaS", "serverless", "FastAPI", "Next.js/TanStack"],
  },
  {
    id: "due-diligence",
    name: "Code Audits & Seed Due Diligence",
    description: "Preparing early startup codebases for seed/Series A investment, evaluating agency deliverables, and fixing hidden technical debt.",
    themeKeywords: ["technical due diligence", "codebase audit", "agency trap", "investor review", "security audit", "tech debt"],
  },
  {
    id: "startup-economics",
    name: "Startup Dev Economics & Cloud Costs",
    description: "Slashing 80% off cloud and AI API bills, lean DevOps, serverless economics, and maximizing founder runway.",
    themeKeywords: ["cloud costs", "AI API burn rate", "serverless economics", "runway optimization", "lean DevOps", "infra budgeting"],
  },
] as const;

export type BlogPillarId = (typeof BLOG_PILLAR_CATEGORIES)[number]["id"];

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown formatted
  coverImage: string; // Path: /api/blog/asset?slug=<slug> or URL
  tags: string[];
  category?: BlogPillarId | string;
  readTimeMinutes: number;
  status: "published" | "draft" | "archived";
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl?: string;
  };
  sourceTrend?: string;
  relatedSlugs?: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: Record<string, User>;
  assessments: Record<string, Blueprint>;
  blogPosts?: Record<string, BlogPost>;
}

let isInitialized = false;

// Simple memory cache and read-write lock to prevent concurrent write corruption
let dbCache: DatabaseSchema = { users: {}, assessments: {}, blogPosts: {} };
let writeQueue: Promise<void> = Promise.resolve();

async function initDb() {
  if (isInitialized) return;

  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      const content = await fs.readFile(DB_PATH, "utf-8");
      dbCache = JSON.parse(content) as DatabaseSchema;
      // Ensure properties exist
      if (!dbCache.users) dbCache.users = {};
      if (!dbCache.assessments) dbCache.assessments = {};
      if (!dbCache.blogPosts) dbCache.blogPosts = {};
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(DB_PATH, JSON.stringify(dbCache, null, 2), "utf-8");
    }
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

/**
 * Persist cache to disk, queued to prevent overlapping writes
 */
async function saveToDisk(): Promise<void> {
  const performWrite = async () => {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(dbCache, null, 2), "utf-8");
    } catch (error) {
      console.error("Database write failure:", error);
    }
  };

  writeQueue = writeQueue.then(performWrite);
  return writeQueue;
}

export async function getUser(email: string): Promise<User | null> {
  await initDb();
  return dbCache.users[email.toLowerCase()] || null;
}

export async function saveUser(user: Omit<User, "createdAt">): Promise<User> {
  await initDb();
  const emailKey = user.email.toLowerCase();
  const existingUser = dbCache.users[emailKey];

  const updatedUser: User = {
    ...user,
    email: emailKey,
    createdAt: existingUser ? existingUser.createdAt : Date.now(),
  };

  dbCache.users[emailKey] = updatedUser;
  await saveToDisk();
  return updatedUser;
}

export async function getBlueprint(email: string): Promise<Blueprint | null> {
  await initDb();
  return dbCache.assessments[email.toLowerCase()] || null;
}

export async function saveBlueprint(
  email: string,
  answers: Record<string, any>,
): Promise<Blueprint> {
  await initDb();
  const emailKey = email.toLowerCase();
  const existing = dbCache.assessments[emailKey];

  if (existing && existing.submittedAt) {
    throw new Error("Blueprint has already been submitted and cannot be modified.");
  }

  const updated: Blueprint = {
    email: emailKey,
    answers: {
      ...(existing?.answers || {}),
      ...answers,
    },
    submittedAt: existing ? existing.submittedAt : null,
    reportPdfPath: existing ? existing.reportPdfPath : null,
    reportData: existing ? existing.reportData : null,
    unlockRequestedAt: existing ? existing.unlockRequestedAt : null,
    unlockLinkedInUrl: existing ? existing.unlockLinkedInUrl : null,
  };

  dbCache.assessments[emailKey] = updated;
  await saveToDisk();
  return updated;
}

export async function submitBlueprint(
  email: string,
  reportPdfPath: string,
  reportData: any,
): Promise<Blueprint> {
  await initDb();
  const emailKey = email.toLowerCase();
  const existing = dbCache.assessments[emailKey];

  if (!existing) {
    throw new Error("No blueprint answers found to submit.");
  }

  if (existing.submittedAt) {
    throw new Error("Blueprint has already been submitted.");
  }

  const updated: Blueprint = {
    ...existing,
    submittedAt: new Date().toISOString(),
    reportPdfPath,
    reportData,
  };

  dbCache.assessments[emailKey] = updated;
  await saveToDisk();
  return updated;
}

export async function requestUnlock(email: string, linkedinUrl: string): Promise<Blueprint> {
  await initDb();
  const emailKey = email.toLowerCase();
  const existing = dbCache.assessments[emailKey];
  if (!existing) {
    throw new Error("No blueprint found to unlock.");
  }

  const updated: Blueprint = {
    ...existing,
    unlockRequestedAt: new Date().toISOString(),
    unlockLinkedInUrl: linkedinUrl,
  };

  dbCache.assessments[emailKey] = updated;
  await saveToDisk();
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG POSTS CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface GetBlogPostsOptions {
  status?: "published" | "draft" | "archived" | "all";
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getBlogPosts(options?: GetBlogPostsOptions): Promise<{
  posts: BlogPost[];
  total: number;
}> {
  await initDb();
  if (!dbCache.blogPosts) dbCache.blogPosts = {};

  let posts = Object.values(dbCache.blogPosts);

  // Filter by status (default to "published" unless specified or "all")
  const statusFilter = options?.status ?? "published";
  if (statusFilter !== "all") {
    posts = posts.filter((p) => p.status === statusFilter);
  }

  // Filter by tag
  if (options?.tag) {
    const targetTag = options.tag.toLowerCase();
    posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === targetTag));
  }

  // Filter by search keyword
  if (options?.search) {
    const q = options.search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Sort by publishedAt or createdAt descending (newest first)
  posts.sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  const total = posts.length;

  if (options?.offset) {
    posts = posts.slice(options.offset);
  }

  if (options?.limit) {
    posts = posts.slice(0, options.limit);
  }

  return { posts, total };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  await initDb();
  if (!dbCache.blogPosts) dbCache.blogPosts = {};
  const cleanSlug = slug.toLowerCase().trim();
  const post = Object.values(dbCache.blogPosts).find((p) => p.slug.toLowerCase() === cleanSlug);
  return post || null;
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  await initDb();
  if (!dbCache.blogPosts) dbCache.blogPosts = {};
  return dbCache.blogPosts[id] || null;
}

export async function saveBlogPost(
  postInput: Omit<BlogPost, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<BlogPost> {
  await initDb();
  if (!dbCache.blogPosts) dbCache.blogPosts = {};

  const now = new Date().toISOString();
  const id = postInput.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const existing = dbCache.blogPosts[id];

  const post: BlogPost = {
    ...postInput,
    id,
    slug: postInput.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-"),
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    publishedAt:
      postInput.status === "published"
        ? postInput.publishedAt || existing?.publishedAt || now
        : postInput.publishedAt || existing?.publishedAt || "",
  };

  dbCache.blogPosts[id] = post;
  await saveToDisk();
  return post;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  await initDb();
  if (!dbCache.blogPosts || !dbCache.blogPosts[id]) {
    return false;
  }
  delete dbCache.blogPosts[id];
  await saveToDisk();
  return true;
}

export async function updateBlogPostStatus(
  id: string,
  status: BlogPost["status"],
): Promise<BlogPost> {
  await initDb();
  if (!dbCache.blogPosts || !dbCache.blogPosts[id]) {
    throw new Error(`BlogPost with ID ${id} not found.`);
  }

  const existing = dbCache.blogPosts[id];
  const now = new Date().toISOString();

  const updated: BlogPost = {
    ...existing,
    status,
    updatedAt: now,
    publishedAt: status === "published" && !existing.publishedAt ? now : existing.publishedAt,
  };

  dbCache.blogPosts[id] = updated;
  await saveToDisk();
  return updated;
}

export async function getAllPublishedSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  await initDb();
  if (!dbCache.blogPosts) dbCache.blogPosts = {};
  return Object.values(dbCache.blogPosts)
    .filter((p) => p.status === "published")
    .map((p) => ({
      slug: p.slug,
      updatedAt: p.updatedAt || p.publishedAt || new Date().toISOString(),
    }));
}

export interface BlogInventorySummary {
  articles: Array<{
    title: string;
    slug: string;
    url: string;
    excerpt: string;
    category: string;
    tags: string[];
    keywords: string[];
  }>;
  conversionPages: Array<{
    title: string;
    url: string;
    intent: string;
  }>;
}

export async function getBlogInventorySummary(): Promise<BlogInventorySummary> {
  await initDb();
  if (!dbCache.blogPosts) dbCache.blogPosts = {};

  const published = Object.values(dbCache.blogPosts)
    .filter((p) => p.status === "published")
    .map((p) => ({
      title: p.title,
      slug: p.slug,
      url: `/blog/${p.slug}`,
      excerpt: p.excerpt,
      category: p.category || "ai-engineering",
      tags: p.tags || [],
      keywords: p.seo?.keywords || [],
    }));

  const conversionPages = [
    {
      title: "Founder-to-Launch Framework™ (Go-to-Launch Blueprint)",
      url: "/blueprint",
      intent: "Scoping, boundary validation, and architecture blueprint generator for non-technical & early-stage founders to prepare their MVP before coding.",
    },
    {
      title: "Fractional CTO & Technical Partner Advisory",
      url: "/offers/fractional-cto",
      intent: "Hands-on senior technical partner & fractional CTO advisory for founders seeking a technical co-founder to lead their MVP.",
    },
    {
      title: "Technical Due Diligence & Codebase Audits",
      url: "/offers/technical-due-diligence",
      intent: "Deep codebase audits to uncover agency traps, eliminate tech debt, and prepare startups for seed/Series A investor due diligence.",
    },
    {
      title: "About Mehdi Golzari",
      url: "/about",
      intent: "Mehdi's background, senior engineering leadership experience, and track record building scalable production SaaS systems.",
    },
    {
      title: "Direct Founder Discovery Call",
      url: "/contact",
      intent: "Direct consultation and booking a call with Mehdi Golzari.",
    },
  ];

  return { articles: published, conversionPages };
}

export function computeStringSimilarity(a: string, b: string): number {
  const cleanA = a
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const cleanB = b
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!cleanA.length || !cleanB.length) return 0;

  const setA = new Set(cleanA);
  const setB = new Set(cleanB);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = new Set([...cleanA, ...cleanB]).size;
  return union === 0 ? 0 : intersection / union;
}

export async function checkContentDuplicate(
  title: string,
  slug: string,
): Promise<{ isDuplicate: boolean; similarPost?: BlogPost; similarityScore: number }> {
  await initDb();
  if (!dbCache.blogPosts) return { isDuplicate: false, similarityScore: 0 };

  const published = Object.values(dbCache.blogPosts).filter((p) => p.status === "published");

  for (const post of published) {
    // Exact slug match
    if (post.slug.toLowerCase() === slug.toLowerCase()) {
      return { isDuplicate: true, similarPost: post, similarityScore: 1.0 };
    }

    // Title token overlap
    const score = computeStringSimilarity(post.title, title);
    if (score >= 0.5) {
      return { isDuplicate: true, similarPost: post, similarityScore: score };
    }
  }

  return { isDuplicate: false, similarityScore: 0 };
}

export async function getRelatedBlogPosts(
  currentSlug: string,
  limit: number = 3,
): Promise<BlogPost[]> {
  await initDb();
  if (!dbCache.blogPosts) return [];

  const allPosts = Object.values(dbCache.blogPosts).filter(
    (p) => p.status === "published" && p.slug !== currentSlug,
  );
  if (allPosts.length === 0) return [];

  const current = Object.values(dbCache.blogPosts).find((p) => p.slug === currentSlug);
  if (!current) return allPosts.slice(0, limit);

  const currentTags = new Set((current.tags || []).map((t) => t.toLowerCase()));
  const currentCategory = current.category || "ai-engineering";

  const scored = allPosts.map((post) => {
    let score = 0;
    // Same category gets 3 points
    if (post.category && post.category === currentCategory) {
      score += 3;
    }
    // Shared tags get 2 points each
    for (const tag of post.tags || []) {
      if (currentTags.has(tag.toLowerCase())) {
        score += 2;
      }
    }
    return { post, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((item) => item.post);
}
