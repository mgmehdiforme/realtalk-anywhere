import { getBlogPosts, saveBlogPost, type BlogPost } from "./db";
import {
  performDeepTopicResearch,
  generateBlogPostContent,
  generateCoverImage,
  type ResearchTopicResult,
  type GeneratedArticleResult,
} from "./gemini";

export interface PipelineProgressCallback {
  (step: {
    stage: 1 | 2 | 3 | 4;
    name: string;
    description: string;
    data?: any;
  }): void;
}

export interface AutonomousGenerationResult {
  success: boolean;
  post: BlogPost;
  research: ResearchTopicResult;
  article: GeneratedArticleResult;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4-STAGE AUTONOMOUS BLOG GENERATION PIPELINE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function generateAutonomousBlogPost(
  onProgress?: PipelineProgressCallback,
): Promise<AutonomousGenerationResult> {
  console.log("=== STARTING AUTONOMOUS 4-STAGE BLOG ENGINE ===");

  // 1. Fetch existing posts to avoid topic duplication
  const { posts: existingPosts } = await getBlogPosts({ status: "all" });
  const existingSlugsAndTitles = existingPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
  }));

  // ──────────────── STAGE 1: DEEP RESEARCH & TOPIC SCOUTING ────────────────
  console.log("Stage 1/4: Deep Research & Topic Selection...");
  onProgress?.({
    stage: 1,
    name: "Deep Trend Research",
    description: "Scanning HackerNews, Substack & Medium trends for CTO architectural topics...",
  });

  const researchResult = await performDeepTopicResearch(existingSlugsAndTitles);
  console.log(`Stage 1 Complete: Selected Topic "${researchResult.selectedTopic}"`);

  // ──────────────── STAGE 2: CTO CONTENT & SEO DRAFTING ────────────────
  console.log("Stage 2/4: Generating CTO-Level Markdown & SEO Metadata...");
  onProgress?.({
    stage: 2,
    name: "Technical Content Drafting",
    description: `Drafting comprehensive architecture article for "${researchResult.suggestedTitle}"...`,
    data: { topic: researchResult.selectedTopic },
  });

  const articleResult = await generateBlogPostContent(researchResult);
  console.log(`Stage 2 Complete: Generated ${articleResult.contentMarkdown.length} chars of Markdown`);

  // ──────────────── STAGE 3: COVER HERO GENERATION ────────────────
  console.log("Stage 3/4: Generating Branded Dark-Mode Cover Hero...");
  onProgress?.({
    stage: 3,
    name: "Hero Asset Generation",
    description: "Creating high-resolution 1200x630 branded cover graphic...",
    data: { slug: articleResult.slug },
  });

  const primaryTag = articleResult.tags[0] || "Architecture";
  const coverImageUrl = await generateCoverImage(
    articleResult.slug,
    articleResult.title,
    primaryTag,
    articleResult.imagePrompt,
  );
  console.log(`Stage 3 Complete: Cover image generated at ${coverImageUrl}`);

  // ──────────────── STAGE 4: PERSISTENCE & PUBLICATION ────────────────
  console.log("Stage 4/4: Persisting Article to Database...");
  onProgress?.({
    stage: 4,
    name: "Publishing & Indexing",
    description: "Writing record to database and indexing for SSR...",
    data: { slug: articleResult.slug },
  });

  const publishedPost = await saveBlogPost({
    slug: articleResult.slug,
    title: articleResult.title,
    excerpt: articleResult.excerpt,
    content: articleResult.contentMarkdown,
    coverImage: coverImageUrl,
    tags: articleResult.tags,
    readTimeMinutes: articleResult.readTimeMinutes,
    status: "published",
    seo: {
      metaTitle: `${articleResult.title} | MehdiGolzari.dev`,
      metaDescription: articleResult.excerpt,
      keywords: articleResult.targetKeywords,
      canonicalUrl: `https://mehdigolzari.dev/blog/${articleResult.slug}`,
    },
    sourceTrend: researchResult.sourceTrend,
    publishedAt: new Date().toISOString(),
  });

  console.log(`=== PIPELINE COMPLETE: Published Post "${publishedPost.title}" (/blog/${publishedPost.slug}) ===`);

  return {
    success: true,
    post: publishedPost,
    research: researchResult,
    article: articleResult,
  };
}
