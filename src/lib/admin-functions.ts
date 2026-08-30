import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getAdminSessionFromRequest, verifyAdminCredentials, createAdminSessionToken } from "./admin-auth";
import {
  getBlogPosts,
  getBlogPostById,
  saveBlogPost,
  deleteBlogPost,
  updateBlogPostStatus,
  type BlogPost,
} from "./db";
import { generateAutonomousBlogPost } from "./blog-generator";
import { generateCoverImage } from "./gemini";

/**
 * Admin Login Server Function
 */
export const adminLoginAction = createServerFn()
  .validator((d: { username: string; password: string }) => d)
  .handler(async ({ data }) => {
    const isValid = verifyAdminCredentials(data.username, data.password);
    if (!isValid) {
      return { success: false, error: "Invalid username or password" };
    }

    const token = createAdminSessionToken(data.username);
    return { success: true, token };
  });

/**
 * Admin Logout Server Function
 */
export const adminLogoutAction = createServerFn().handler(async () => {
  return { success: true };
});

/**
 * Fetch Full Blog State & Metrics for Admin Dashboard
 */
export const getAdminBlogState = createServerFn().handler(async () => {
  const request = getRequest();
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return {
      authenticated: false,
      user: null,
      posts: [],
      metrics: { total: 0, published: 0, drafts: 0, totalReadMinutes: 0 },
    };
  }

  const { posts } = await getBlogPosts({ status: "all" });

  const metrics = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    drafts: posts.filter((p) => p.status === "draft").length,
    totalReadMinutes: posts.reduce((acc, p) => acc + (p.readTimeMinutes || 5), 0),
  };

  return {
    authenticated: true,
    user: session,
    posts,
    metrics,
  };
});

/**
 * Trigger Autonomous Generation Pipeline from Admin Dashboard
 */
export const triggerAutonomousGenerationAction = createServerFn().handler(async () => {
  const request = getRequest();
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    throw new Error("Unauthorized admin access");
  }

  try {
    const result = await generateAutonomousBlogPost();
    return { success: true, post: result.post };
  } catch (error: any) {
    console.error("Admin manual trigger error:", error);
    return { success: false, error: error.message || "Failed to generate blog post" };
  }
});

/**
 * Update Blog Post Content or Metadata
 */
export const updateBlogPostAction = createServerFn()
  .validator((d: { id: string; updates: Partial<BlogPost> }) => d)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = getAdminSessionFromRequest(request);

    if (!session) {
      throw new Error("Unauthorized admin access");
    }

    const existing = await getBlogPostById(data.id);
    if (!existing) {
      throw new Error(`Post with ID ${data.id} not found`);
    }

    const updated = await saveBlogPost({
      ...existing,
      ...data.updates,
      id: data.id,
    });

    return { success: true, post: updated };
  });

/**
 * Delete a Blog Post
 */
export const deleteBlogPostAction = createServerFn()
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = getAdminSessionFromRequest(request);

    if (!session) {
      throw new Error("Unauthorized admin access");
    }

    const success = await deleteBlogPost(data.id);
    return { success };
  });

/**
 * Regenerate Cover Image for a Post
 */
export const regenerateCoverImageAction = createServerFn()
  .validator((d: { id: string; customPrompt?: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = getAdminSessionFromRequest(request);

    if (!session) {
      throw new Error("Unauthorized admin access");
    }

    const post = await getBlogPostById(data.id);
    if (!post) {
      throw new Error(`Post with ID ${data.id} not found`);
    }

    const primaryTag = post.tags[0] || "Architecture";
    const newCoverImage = await generateCoverImage(
      post.slug,
      post.title,
      primaryTag,
      data.customPrompt,
    );

    const updated = await saveBlogPost({
      ...post,
      coverImage: newCoverImage,
    });

    return { success: true, post: updated };
  });
