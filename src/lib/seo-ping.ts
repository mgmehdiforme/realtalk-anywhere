/**
 * Search Engine Instant Indexing & Ping Service
 * Implements the IndexNow protocol (Bing, Yandex, Seznam, Naver) and Google sitemap pinging.
 */

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "8f7e2d9a1b4c6e0f";
export const DOMAIN = process.env.SITE_DOMAIN || "mehdigolzari.dev";
export const SITE_URL = process.env.SITE_URL || `https://${DOMAIN}`;

export interface PingResult {
  engine: string;
  status: "success" | "skipped" | "error";
  statusCode?: number;
  message?: string;
}

/**
 * Ping search engines immediately when a blog post is published or updated
 */
export async function pingSearchEngines(
  slugs: string | string[],
): Promise<{ success: boolean; results: PingResult[] }> {
  const slugList = Array.isArray(slugs) ? slugs : [slugs];
  if (slugList.length === 0) {
    return { success: true, results: [] };
  }

  const urlList = slugList.map((slug) =>
    slug.startsWith("http") ? slug : `${SITE_URL}/blog/${slug}`,
  );
  // Also include the blog index and sitemap
  urlList.push(`${SITE_URL}/blog`, `${SITE_URL}/sitemap.xml`);
  const uniqueUrls = Array.from(new Set(urlList));

  const results: PingResult[] = [];

  // 1. Submit to IndexNow API (Broadcaster endpoint notifies Bing, Yandex, Seznam, Naver simultaneously)
  try {
    const indexNowPayload = {
      host: DOMAIN,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: uniqueUrls,
    };

    const indexNowResponse = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "MehdiGolzari-AutonomousEngine/1.0",
      },
      body: JSON.stringify(indexNowPayload),
      signal: AbortSignal.timeout(8000), // 8s timeout guard
    });

    if (indexNowResponse.ok || indexNowResponse.status === 202) {
      results.push({
        engine: "IndexNow (Bing/Yandex/Seznam/Naver)",
        status: "success",
        statusCode: indexNowResponse.status,
        message: `Successfully notified ${uniqueUrls.length} URLs to IndexNow.`,
      });
      console.log(`[SEO PING] IndexNow responded: ${indexNowResponse.status} for ${uniqueUrls.length} URLs`);
    } else {
      const errText = await indexNowResponse.text().catch(() => "");
      results.push({
        engine: "IndexNow",
        status: "error",
        statusCode: indexNowResponse.status,
        message: `IndexNow responded with status ${indexNowResponse.status}: ${errText.substring(0, 150)}`,
      });
      console.warn(`[SEO PING WARNING] IndexNow HTTP ${indexNowResponse.status}: ${errText}`);
    }
  } catch (error: any) {
    results.push({
      engine: "IndexNow",
      status: "error",
      message: error.message || "Network error pinging IndexNow",
    });
    console.error("[SEO PING ERROR] IndexNow failed:", error.message);
  }

  // 2. Direct Bing IndexNow endpoint (as redundancy fallback)
  try {
    const bingPayload = {
      host: DOMAIN,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: uniqueUrls,
    };

    const bingResponse = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "MehdiGolzari-AutonomousEngine/1.0",
      },
      body: JSON.stringify(bingPayload),
      signal: AbortSignal.timeout(8000),
    });

    if (bingResponse.ok || bingResponse.status === 202) {
      results.push({
        engine: "Bing Direct IndexNow",
        status: "success",
        statusCode: bingResponse.status,
        message: `Bing direct accepted ${uniqueUrls.length} URLs.`,
      });
    }
  } catch (error: any) {
    // Non-critical redundancy failure
    console.warn("[SEO PING] Bing direct fallback error:", error.message);
  }

  // 3. Ping Google Sitemap Endpoint (Triggers Googlebot sitemap refresh)
  try {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

    const googleResponse = await fetch(googlePingUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MehdiGolzariBot/1.0; +https://mehdigolzari.dev)",
      },
      signal: AbortSignal.timeout(8000),
    });

    results.push({
      engine: "Google Sitemap Ping",
      status: googleResponse.ok ? "success" : "error",
      statusCode: googleResponse.status,
      message: googleResponse.ok
        ? "Google notified of sitemap update."
        : `Google ping returned status ${googleResponse.status}`,
    });
    console.log(`[SEO PING] Google sitemap ping status: ${googleResponse.status}`);
  } catch (error: any) {
    results.push({
      engine: "Google Sitemap Ping",
      status: "error",
      message: error.message || "Failed to ping Google sitemap",
    });
    console.warn("[SEO PING] Google ping error:", error.message);
  }

  return {
    success: results.some((r) => r.status === "success"),
    results,
  };
}
