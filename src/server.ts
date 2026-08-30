import "./lib/error-capture";
import fs from "fs/promises";
import path from "path";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { verifyCronSecret } from "./lib/admin-auth";
import { generateAutonomousBlogPost } from "./lib/blog-generator";
import { getAllPublishedSlugs } from "./lib/db";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Handle static Blog Assets (/api/blog/asset?slug=...)
 */
async function handleBlogAssetRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/blog/asset")) return null;

  const slug = url.searchParams.get("slug") || url.searchParams.get("file");
  if (!slug) {
    return new Response("Missing slug parameter", { status: 400 });
  }

  const cleanSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
  const assetsDir = path.resolve(process.cwd(), "data/blog-assets");

  // Try SVG first, then WEBP, then PNG
  const extensions = [".svg", ".webp", ".png"];
  for (const ext of extensions) {
    const filePath = path.join(assetsDir, `${cleanSlug}${ext}`);
    try {
      const buffer = await fs.readFile(filePath);
      const mimeType =
        ext === ".svg"
          ? "image/svg+xml"
          : ext === ".webp"
            ? "image/webp"
            : "image/png";

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      // Continue to next extension
    }
  }

  return new Response("Asset not found", { status: 404 });
}

/**
 * Handle Cloud Scheduler Autonomous Cron Endpoint (/api/blog/cron-generate)
 */
async function handleCronGenerateRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/blog/cron-generate") return null;

  if (request.method !== "POST" && request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyCronSecret(request)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid or missing CRON_SECRET" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const result = await generateAutonomousBlogPost();
    return new Response(
      JSON.stringify({
        success: true,
        message: "Autonomous article generated and published successfully",
        post: {
          id: result.post.id,
          title: result.post.title,
          slug: result.post.slug,
          publishedAt: result.post.publishedAt,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Autonomous Cron Execution Failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Pipeline execution failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Handle Dynamic Sitemap XML (/sitemap.xml)
 */
async function handleSitemapRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/sitemap.xml") return null;

  try {
    const baseUrl = "https://mehdigolzari.dev";
    const publishedPosts = await getAllPublishedSlugs();
    const today = new Date().toISOString().split("T")[0];

    const staticRoutes = [
      { path: "", priority: "1.0", changefreq: "daily" },
      { path: "/blog", priority: "0.9", changefreq: "daily" },
      { path: "/blueprint", priority: "0.9", changefreq: "weekly" },
      { path: "/services", priority: "0.8", changefreq: "weekly" },
      { path: "/founder-to-launch-framework", priority: "0.8", changefreq: "weekly" },
      { path: "/about", priority: "0.7", changefreq: "monthly" },
      { path: "/resume", priority: "0.7", changefreq: "monthly" },
      { path: "/contact", priority: "0.7", changefreq: "monthly" },
    ];

    const staticUrls = staticRoutes
      .map(
        (r) => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
      )
      .join("\n");

    const blogUrls = publishedPosts
      .map(
        (p) => `  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${(p.updatedAt || today).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
      )
      .join("\n");

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${blogUrls}
</urlset>`.trim();

    return new Response(sitemapXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Failed to generate sitemap", { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // 1. Check Blog Asset Endpoint
      const assetResponse = await handleBlogAssetRequest(request);
      if (assetResponse) return assetResponse;

      // 2. Check Autonomous Cron Endpoint
      const cronResponse = await handleCronGenerateRequest(request);
      if (cronResponse) return cronResponse;

      // 3. Check Sitemap XML
      const sitemapResponse = await handleSitemapRequest(request);
      if (sitemapResponse) return sitemapResponse;

      // 4. Delegate to TanStack Start SSR
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
