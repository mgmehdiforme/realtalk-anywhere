import { getBlogPosts } from "../src/lib/db";
import { getOrGenerateArticleBriefPdf } from "../src/lib/article-pdf-generator";

import fs from "fs";

async function testPdf() {
  console.log("=== Testing Article Executive Brief PDF Generation ===");
  const { posts } = await getBlogPosts({ status: "published", limit: 1 });
  if (posts.length === 0) {
    console.error("No published posts found to test");
    return;
  }

  const post = posts[0];
  console.log(`Generating brief for: "${post.title}" (${post.slug})...`);
  const result = await getOrGenerateArticleBriefPdf(post);

  console.log("Generated brief result:", result);
  if (fs.existsSync(result.filePath)) {
    const stats = fs.statSync(result.filePath);
    console.log(`PDF successfully created at ${result.filePath} (${stats.size} bytes)`);

    // Verify PDF header magic bytes '%PDF'
    const fd = fs.openSync(result.filePath, "r");
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    console.log("PDF Magic bytes:", buffer.toString("utf-8"));
    if (buffer.toString("utf-8") === "%PDF") {
      console.log("✓ Valid PDF binary format confirmed!");
    } else {
      console.error("✗ Invalid PDF header!");
    }
  } else {
    console.error("PDF file does not exist on disk!");
  }
}

testPdf().catch(console.error);
