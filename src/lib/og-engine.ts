import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { buildBrandedOgSvg, type BrandedOgOptions } from "./svg-generator";

export interface OgRenderResult {
  buffer: Buffer | Uint8Array;
  mimeType: string;
  format: "png" | "webp" | "svg";
}

/**
 * High-performance OpenGraph rasterization engine with disk/GCS persistence
 */
export async function getOrGenerateOgImage(
  cacheKey: string,
  options: BrandedOgOptions,
  format: "png" | "webp" | "svg" = "png",
): Promise<OgRenderResult> {
  const cleanKey = cacheKey.replace(/[^a-zA-Z0-9-_]/g, "") || "default";
  const assetsDir = path.resolve(process.cwd(), "data/blog-assets");
  const extension = format === "webp" ? "webp" : format === "svg" ? "svg" : "png";
  const filePath = path.join(assetsDir, `og-${cleanKey}.${extension}`);
  const mimeType =
    format === "webp"
      ? "image/webp"
      : format === "svg"
        ? "image/svg+xml; charset=utf-8"
        : "image/png";

  // 1. Try serving existing cached file from disk
  try {
    const cachedBuffer = await fs.readFile(filePath);
    if (cachedBuffer && cachedBuffer.length > 500) {
      return {
        buffer: cachedBuffer,
        mimeType,
        format,
      };
    }
  } catch {
    // Disk cache miss, generate on the fly
  }

  // 2. Generate vector SVG canvas
  const svgString = buildBrandedOgSvg(options);

  if (format === "svg") {
    const svgBuffer = Buffer.from(svgString, "utf-8");
    fs.mkdir(assetsDir, { recursive: true })
      .then(() => fs.writeFile(filePath, svgBuffer))
      .catch((err) => console.error(`[OG Engine] Failed to write SVG cache:`, err));

    return {
      buffer: svgBuffer,
      mimeType: "image/svg+xml; charset=utf-8",
      format: "svg",
    };
  }

  // 3. Rasterize vector SVG into crisp PNG or WebP via sharp
  try {
    let outputBuffer: Buffer;

    if (format === "webp") {
      outputBuffer = await sharp(Buffer.from(svgString))
        .resize(1200, 630)
        .webp({ quality: 90 })
        .toBuffer();
    } else {
      outputBuffer = await sharp(Buffer.from(svgString))
        .resize(1200, 630)
        .png({
          quality: 90,
          compressionLevel: 8,
          adaptiveFiltering: true,
        })
        .toBuffer();
    }

    // 4. Persist to cache directory in background
    fs.mkdir(assetsDir, { recursive: true })
      .then(() => fs.writeFile(filePath, outputBuffer))
      .catch((err) => console.error(`[OG Engine] Failed to write raster cache:`, err));

    return {
      buffer: outputBuffer,
      mimeType,
      format,
    };
  } catch (rasterError) {
    console.error(`[OG Engine] Sharp rasterization error for key ${cleanKey}:`, rasterError);

    // Fallback: return SVG buffer directly so crawler never gets a 500
    return {
      buffer: Buffer.from(svgString, "utf-8"),
      mimeType: "image/svg+xml; charset=utf-8",
      format: "svg",
    };
  }
}
