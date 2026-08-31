import { pingSearchEngines, INDEXNOW_KEY, DOMAIN, SITE_URL } from "../src/lib/seo-ping";
import { getBlogPosts } from "../src/lib/db";

async function runSeoDiagnostics() {
  console.log("=== SEO PRODUCTION READINESS DIAGNOSTICS ===");

  // 1. Check constants
  console.log(`- Domain: ${DOMAIN}`);
  console.log(`- Site URL: ${SITE_URL}`);
  console.log(`- IndexNow Key: ${INDEXNOW_KEY}`);

  // 2. Query blog database
  const { posts, total } = await getBlogPosts({ status: "published" });
  console.log(`- Found ${total} published posts in database for sitemap & RSS`);

  if (posts.length > 0) {
    const firstPost = posts[0];
    console.log(`  Sample Post: "${firstPost.title}" (slug: ${firstPost.slug})`);
  }

  // 3. Test ping logic (using fake slug or real test slug)
  console.log("\nTesting search engine ping invocation...");
  try {
    const pingRes = await pingSearchEngines("deterministic-state-machines-reliable-ai-agents");
    console.log("Ping Execution Succeeded without throwing:", pingRes.success);
    console.log("Results Summary:", JSON.stringify(pingRes.results, null, 2));
  } catch (err: any) {
    console.error("Ping Execution Failed with error:", err.message);
  }

  console.log("\n=== ALL SEO DIAGNOSTIC CHECKS COMPLETED ===");
}

runSeoDiagnostics().catch(console.error);
