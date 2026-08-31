import "./lib/error-capture";
import fs from "fs/promises";
import path from "path";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { verifyCronSecret } from "./lib/admin-auth";
import { generateAutonomousBlogPost } from "./lib/blog-generator";
import { getAllPublishedSlugs, getBlogPostBySlug, getBlogPosts } from "./lib/db";
import { pingSearchEngines, INDEXNOW_KEY } from "./lib/seo-ping";

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

  // 1. Try reading existing asset from GCS-mounted directory
  const extensions = [".svg", ".webp", ".png"];
  for (const ext of extensions) {
    const filePath = path.join(assetsDir, `${cleanSlug}${ext}`);
    try {
      if (ext === ".svg") {
        const svgContent = await fs.readFile(filePath, "utf-8");
        return new Response(svgContent, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      } else {
        const buffer = await fs.readFile(filePath);
        const mimeType = ext === ".webp" ? "image/webp" : "image/png";
        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    } catch {
      // Continue to next extension or fallback
    }
  }

  // 2. Dynamic Fallback: If asset file is not on disk, synthesize branded SVG immediately
  try {
    const post = await getBlogPostBySlug(cleanSlug);
    const title =
      post?.title ||
      cleanSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    const tag = post?.tags?.[0] || "Architecture";

    const { buildBrandedBlogHeroSvg } = await import("./lib/svg-generator");
    const generatedSvg = buildBrandedBlogHeroSvg(cleanSlug, title, tag);

    // Save to persistent GCS storage in background
    fs.mkdir(assetsDir, { recursive: true })
      .then(() => fs.writeFile(path.join(assetsDir, `${cleanSlug}.svg`), generatedSvg, "utf-8"))
      .catch((err) => console.error("Failed to cache generated SVG asset to GCS mount:", err));

    return new Response(generatedSvg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("Failed to generate fallback blog asset:", err);
    return new Response("Asset not found", { status: 404 });
  }
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Handle Robots.txt (/robots.txt)
 */
async function handleRobotsRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/robots.txt") return null;

  const robotsContent = `# Robots.txt for MehdiGolzari.dev
# Generated for technical search optimization and crawler governance

User-agent: *
Allow: /
Allow: /blog
Allow: /blog/*
Allow: /blueprint
Allow: /services
Allow: /founder-to-launch-framework
Allow: /about
Allow: /resume
Allow: /contact
Allow: /assets/
Allow: /api/blog/asset
Disallow: /admin
Disallow: /admin/*
Disallow: /auth
Disallow: /auth/*
Disallow: /api/cron/*

# Standard Search Crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: DuckDuckBot
Allow: /

# AI Retrieval & Organic Discovery Bots
User-agent: GPTBot
Allow: /
Allow: /blog/*

User-agent: PerplexityBot
Allow: /
Allow: /blog/*

User-agent: ClaudeBot
Allow: /
Allow: /blog/*

# Authoritative XML Sitemap
Sitemap: https://mehdigolzari.dev/sitemap.xml
`;

  return new Response(robotsContent.trim(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

/**
 * Handle IndexNow Verification Key Endpoint (/<key>.txt, /indexnow.txt, /api/indexnow-key)
 */
async function handleIndexNowKeyRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (
    url.pathname === `/${INDEXNOW_KEY}.txt` ||
    url.pathname === "/indexnow.txt" ||
    url.pathname === "/api/indexnow-key"
  ) {
    return new Response(INDEXNOW_KEY, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
  return null;
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

    // Trigger instant search engine indexing pings in the background
    pingSearchEngines(result.post.slug).catch((err) =>
      console.warn("[SEO PING BACKGROUND ERROR]", err),
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Autonomous article generated, published, and submitted for indexing",
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

function resolveCoverUrl(baseUrl: string, coverImage?: string, slug?: string): string {
  const rawCover = coverImage || (slug ? `/api/blog/asset?slug=${slug}` : "/avatar.webp");
  if (rawCover.startsWith("http://") || rawCover.startsWith("https://")) {
    return rawCover;
  }
  return `${baseUrl}${rawCover.startsWith("/") ? rawCover : `/${rawCover}`}`;
}

/**
 * Handle Dynamic Sitemap XML (/sitemap.xml) with Image Sitemap Extensions
 */
async function handleSitemapRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/sitemap.xml") return null;

  try {
    const baseUrl = "https://mehdigolzari.dev";
    const { posts } = await getBlogPosts({ status: "published" });
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

    const blogUrls = (posts || [])
      .map((p) => {
        const postDate = (p.updatedAt || p.publishedAt || today).split("T")[0];
        const coverUrl = resolveCoverUrl(baseUrl, p.coverImage, p.slug);

        return `  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${escapeXml(coverUrl)}</image:loc>
      <image:title>${escapeXml(p.title)}</image:title>
      <image:caption>${escapeXml(p.excerpt || p.title)}</image:caption>
    </image:image>
  </url>`;
      })
      .join("\n");

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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

/**
 * Handle Dynamic RSS / Atom Feed (/rss.xml, /feed.xml) with Rich Content & CDATA
 */
async function handleRssFeedRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/rss.xml" && url.pathname !== "/feed.xml") return null;

  try {
    const baseUrl = "https://mehdigolzari.dev";
    const { posts } = await getBlogPosts({ status: "published", limit: 30 });

    const items = (posts || [])
      .map((p) => {
        const postUrl = `${baseUrl}/blog/${p.slug}`;
        const pubDate = new Date(p.publishedAt || p.createdAt || Date.now()).toUTCString();
        const coverUrl = resolveCoverUrl(baseUrl, p.coverImage, p.slug);

        return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${p.excerpt}]]></description>
      <content:encoded><![CDATA[<p>${p.excerpt}</p><p><a href="${postUrl}">Read complete technical guide &rarr;</a></p>]]></content:encoded>
      <enclosure url="${coverUrl}" type="image/svg+xml" length="1024"/>
      <pubDate>${pubDate}</pubDate>
      <author>mehdi@mehdigolzari.dev (Mehdi Golzari)</author>
      ${(p.tags || []).map((t) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`;
      })
      .join("\n");

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Mehdi Golzari | Technical Partner &amp; Fractional CTO Architectural Insights</title>
    <link>${baseUrl}/blog</link>
    <description>Pragmatic software architecture, deterministic AI systems, and 0-to-1 MVP roadmaps for startup founders.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`.trim();

    return new Response(rssXml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new Response("Failed to generate RSS feed", { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // 1. Check Blog Asset Endpoint
      const assetResponse = await handleBlogAssetRequest(request);
      if (assetResponse) return assetResponse;

      // 2. Check Robots.txt
      const robotsResponse = await handleRobotsRequest(request);
      if (robotsResponse) return robotsResponse;

      // 3. Check IndexNow Key Verification
      const indexNowResponse = await handleIndexNowKeyRequest(request);
      if (indexNowResponse) return indexNowResponse;

      // 4. Check Autonomous Cron Endpoint
      const cronResponse = await handleCronGenerateRequest(request);
      if (cronResponse) return cronResponse;

      // 5. Check Sitemap XML
      const sitemapResponse = await handleSitemapRequest(request);
      if (sitemapResponse) return sitemapResponse;

      // 6. Check RSS Feed
      const rssResponse = await handleRssFeedRequest(request);
      if (rssResponse) return rssResponse;

      // 7. Delegate to TanStack Start SSR
      const handler = await getServerEntry();
      let response = await handler.fetch(request, env, ctx);
      response = await normalizeCatastrophicSsrResponse(response);

      // Attach high-performance caching headers for static assets
      if (response.status === 200) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        const isImmutable =
          pathname.startsWith("/assets/") ||
          pathname.endsWith(".js") ||
          pathname.endsWith(".css") ||
          pathname.endsWith(".woff2") ||
          pathname.endsWith(".woff");

        const isPublicMedia =
          pathname === "/avatar.png" ||
          pathname === "/avatar.webp" ||
          pathname === "/favicon.ico" ||
          pathname === "/demo.mp4" ||
          pathname === "/robots.txt" ||
          pathname === `/${INDEXNOW_KEY}.txt` ||
          pathname.endsWith(".pdf") ||
          pathname.startsWith("/api/blog/asset");

        if (isImmutable) {
          response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        } else if (isPublicMedia) {
          response.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        }
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
