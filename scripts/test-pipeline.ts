import { generateAutonomousBlogPost } from "../src/lib/blog-generator";

async function main() {
  console.log("Starting full autonomous pipeline validation...");
  try {
    const result = await generateAutonomousBlogPost((step) => {
      console.log(`[Stage ${step.stage}] ${step.name}: ${step.description}`);
    });
    console.log("✅ Pipeline run completed successfully!");
    console.log("Generated post title:", result.post.title);
    console.log("Post slug:", result.post.slug);
    console.log("Cover image URL:", result.post.coverImage);
    console.log("Published status:", result.post.status);
    console.log("Word count estimate / read time:", result.post.readTimeMinutes, "min");
  } catch (err: any) {
    console.error("❌ Pipeline validation error:", err);
    process.exit(1);
  }
}

main();
