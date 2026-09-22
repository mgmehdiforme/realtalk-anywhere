/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BRANDED DARK-MODE OPENGRAPH & BLOG HERO SVG GENERATOR (1200x630px)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapTextToSvgLines(text: string, maxCharsPerLine = 34, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

export function wrapTextToSvg(text: string, maxCharsPerLine = 38): string {
  const lines = wrapTextToSvgLines(text, maxCharsPerLine, 2);
  return lines
    .map(
      (line, i) =>
        `<tspan x="0" dy="${i === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`,
    )
    .join("");
}

export interface BrandedOgOptions {
  title: string;
  categoryTag?: string;
  readTimeMinutes?: number;
  type?: "post" | "home" | "blog" | "blueprint";
  subtitle?: string;
}

/**
 * Builds a high-resolution, branded 1200x630 SVG optimized for OpenGraph card previews
 */
export function buildBrandedOgSvg(options: BrandedOgOptions): string {
  const type = options.type || "post";
  let title = options.title || "Technical Architecture & Systems Engineering";
  let tag = (options.categoryTag || "Architecture").toUpperCase().replace(/-/g, " ");
  let subtitle = options.subtitle || "Senior Independent Technical Partner for SaaS & AI Founders";

  if (type === "home") {
    title = "Senior Independent Technical Partner & Fractional CTO";
    tag = "MEHDIGOLZARI.DEV";
    subtitle = "Zero-to-One SaaS MVP, Deterministic AI Systems & High-Scale Cloud Architecture";
  } else if (type === "blog") {
    title = "Architectural Deep-Dives, AI Engineering & Systems Strategy";
    tag = "TECHNICAL BLOG";
    subtitle = "Battle-tested insights for founders: modular monoliths, multi-agent pipelines & scaling";
  } else if (type === "blueprint") {
    title = "Go-to-Launch Architecture Blueprint™";
    tag = "SYSTEMS ARCHITECTURE";
    subtitle = "Interactive founder scoping engine: stack trade-offs, cost modeling & delivery roadmaps";
  }

  const cleanTitle = escapeXml(title);
  const cleanTag = escapeXml(tag);
  const cleanSubtitle = escapeXml(subtitle);
  const readTime = options.readTimeMinutes ? `${options.readTimeMinutes} min read` : "Architecture Guide";

  // Dynamic font sizing and line wrapping based on title length
  const lines = wrapTextToSvgLines(title, title.length > 60 ? 32 : 28, 3);
  const fontSize = lines.length >= 3 ? 42 : lines.length === 2 ? 48 : 56;
  const lineHeight = fontSize + 12;

  const titleTspans = lines
    .map(
      (line, i) =>
        `<tspan x="80" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Radial Gradients -->
    <radialGradient id="ogBg" cx="50%" cy="35%" r="75%" fx="25%" fy="15%">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="55%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#05070d" />
    </radialGradient>

    <!-- Neon Glow Orbs -->
    <radialGradient id="neonOrbCyan" cx="15%" cy="15%" r="45%">
      <stop offset="0%" stop-color="#00ffb2" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#00ffb2" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="neonOrbViolet" cx="85%" cy="85%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>

    <!-- Card Border Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ffb2" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#6366f1" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.15" />
    </linearGradient>

    <!-- Architectural Grid Pattern -->
    <pattern id="archGrid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255, 255, 255, 0.035)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background Base Canvas -->
  <rect width="1200" height="630" fill="url(#ogBg)" />
  <rect width="1200" height="630" fill="url(#archGrid)" />

  <!-- Ambient Glow Layers -->
  <rect width="1200" height="630" fill="url(#neonOrbCyan)" />
  <rect width="1200" height="630" fill="url(#neonOrbViolet)" />

  <!-- Premium Frame Border -->
  <rect x="36" y="36" width="1128" height="558" rx="28" stroke="url(#borderGrad)" stroke-width="1.75" fill="none" />

  <!-- Top Header Row -->
  <g transform="translate(80, 85)">
    <!-- Brand Monogram -->
    <rect width="40" height="40" rx="10" fill="#00ffb2" />
    <text x="20" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#05070d" text-anchor="middle">
      MG
    </text>

    <!-- Domain Title -->
    <text x="56" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
      MehdiGolzari<tspan fill="#00ffb2">.dev</tspan>
    </text>

    <!-- Top Badge / Category Pill -->
    <g transform="translate(740, 4)">
      <rect width="${Math.max(cleanTag.length * 9.5 + 32, 140)}" height="32" rx="16" fill="rgba(0, 255, 178, 0.12)" stroke="rgba(0, 255, 178, 0.45)" stroke-width="1" />
      <text x="16" y="21" font-family="ui-monospace, monospace" font-size="11" font-weight="700" fill="#00ffb2" letter-spacing="1">
        ${cleanTag}
      </text>
    </g>
  </g>

  <!-- Title Area -->
  <g transform="translate(0, 210)">
    <text font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff" letter-spacing="-1">
      ${titleTspans}
    </text>
  </g>

  <!-- Subtitle Area -->
  <g transform="translate(80, 435)">
    <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400" fill="#94a3b8" letter-spacing="-0.2">
      ${cleanSubtitle}
    </text>
  </g>

  <!-- Divider Rule -->
  <line x1="80" y1="480" x2="1120" y2="480" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />

  <!-- Bottom Metadata Row -->
  <g transform="translate(80, 525)">
    <!-- Author Identity -->
    <circle cx="16" cy="12" r="16" fill="#1e293b" stroke="rgba(0, 255, 178, 0.4)" stroke-width="1" />
    <text x="16" y="17" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#00ffb2" text-anchor="middle">MG</text>

    <text x="44" y="11" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#f8fafc">
      Mehdi Golzari
    </text>
    <text x="44" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#64748b">
      Senior Independent Technical Partner &amp; Fractional CTO
    </text>

    <!-- Reading Time & Framework Signature -->
    <g transform="translate(730, 0)">
      <rect width="130" height="28" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <text x="65" y="18" font-family="ui-monospace, monospace" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="middle">
        ⏱ ${readTime}
      </text>

      <text x="210" y="19" font-family="ui-monospace, monospace" font-size="12" font-weight="600" fill="#00ffb2">
        Founder-to-Launch™
      </text>
    </g>
  </g>
</svg>`.trim();
}

/**
 * Backwards compatibility helper for existing callers
 */
export function buildBrandedBlogHeroSvg(
  _slug: string,
  title: string,
  categoryTag = "Architecture",
): string {
  return buildBrandedOgSvg({
    title,
    categoryTag,
    type: "post",
  });
}
