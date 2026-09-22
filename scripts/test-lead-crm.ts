import {
  saveArticleLead,
  getAllArticleLeads,
  deleteArticleLead,
  getBlogPosts,
} from "../src/lib/db";
import { getOrGenerateArticleBriefPdf } from "../src/lib/article-pdf-generator";
import fs from "fs";

async function runLeadCrmDiagnostics() {
  console.log("=== ARTICLE LEAD MAGNET & PDF GENERATOR DIAGNOSTICS ===");

  // 1. Fetch posts
  const { posts } = await getBlogPosts({ status: "published" });
  console.log(`Found ${posts.length} published posts in database`);

  if (posts.length === 0) {
    console.error("No published posts found to test!");
    return;
  }

  // 2. Test PDF Generation on the first 2 posts
  const samplePosts = posts.slice(0, 2);
  for (const post of samplePosts) {
    console.log(`\nTesting PDF Generation for post: "${post.title}" (slug: ${post.slug})...`);
    const brief = await getOrGenerateArticleBriefPdf(post);
    console.log(`- Brief Result File: ${brief.fileName}`);
    console.log(`- File Path: ${brief.filePath}`);

    const exists = fs.existsSync(brief.filePath);
    if (!exists) {
      throw new Error(`PDF file does not exist at ${brief.filePath}`);
    }

    const stats = fs.statSync(brief.filePath);
    console.log(`- PDF Size: ${stats.size} bytes`);

    // Verify PDF header magic bytes
    const fd = fs.openSync(brief.filePath, "r");
    const headerBuf = Buffer.alloc(4);
    fs.readSync(fd, headerBuf, 0, 4, 0);
    fs.closeSync(fd);
    const magic = headerBuf.toString("utf-8");
    console.log(`- Magic Bytes: "${magic}"`);
    if (magic !== "%PDF") {
      throw new Error(`Invalid PDF header: "${magic}"`);
    }
  }

  // 3. Test Lead Persistence
  console.log("\nTesting Lead Persistence in db.json...");
  const initialLeads = await getAllArticleLeads();
  console.log(`- Initial leads count: ${initialLeads.length}`);

  const testEmail = `test-founder-${Date.now()}@hypergrowth.ai`;
  const savedLead = await saveArticleLead({
    email: testEmail,
    name: "Alex Vance",
    role: "Founder / CEO",
    articleSlug: samplePosts[0].slug,
    articleTitle: samplePosts[0].title,
    pillar: samplePosts[0].category,
    source: "brief_modal",
  });

  console.log(`- Saved Test Lead: ID=${savedLead.id}, Email=${savedLead.email}, Role=${savedLead.role}`);

  const updatedLeads = await getAllArticleLeads();
  console.log(`- Updated leads count: ${updatedLeads.length}`);
  const foundLead = updatedLeads.find((l) => l.id === savedLead.id);
  if (!foundLead) {
    throw new Error(`Could not find newly saved lead with ID ${savedLead.id}`);
  }
  console.log("✓ Lead persisted and retrieved successfully from database!");

  // 4. Test Lead CSV Export formatting
  const headers = ["ID", "Email", "Name", "Role", "Article Title", "Article Slug", "Pillar", "Source", "Date"];
  const rows = updatedLeads.map((l) => [
    l.id,
    `"${l.email.replace(/"/g, '""')}"`,
    `"${(l.name || "").replace(/"/g, '""')}"`,
    `"${(l.role || "").replace(/"/g, '""')}"`,
    `"${(l.articleTitle || "").replace(/"/g, '""')}"`,
    `"${l.articleSlug}"`,
    `"${l.pillar || ""}"`,
    `"${l.source || ""}"`,
    `"${l.createdAt}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  console.log(`- Generated CSV Export (${csv.split("\n").length} lines, ${csv.length} bytes)`);

  // 5. Clean up test lead
  console.log("\nCleaning up test lead...");
  const deleted = await deleteArticleLead(savedLead.id);
  console.log(`- Lead deletion result: ${deleted}`);

  const finalLeads = await getAllArticleLeads();
  console.log(`- Final leads count after cleanup: ${finalLeads.length}`);
  if (finalLeads.some((l) => l.id === savedLead.id)) {
    throw new Error("Test lead was not properly deleted!");
  }

  console.log("\n=== ALL LEAD CRM & PDF TESTS PASSED SUCCESSFULLY! ===");
}

runLeadCrmDiagnostics().catch((err) => {
  console.error("DIAGNOSTIC FAILURE:", err);
  process.exit(1);
});
