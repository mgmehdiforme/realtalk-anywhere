/**
 * Shared Blog Types & Pillar Constants
 * Safe to import in both client-side React components and server-side functions.
 */

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

export interface BlogInventoryItem {
  slug: string;
  title: string;
  excerpt: string;
  category?: string;
  tags: string[];
  keywords: string[];
}

export interface GetBlogPostsOptions {
  status?: "published" | "draft" | "archived" | "all";
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
