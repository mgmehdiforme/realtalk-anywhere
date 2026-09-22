import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import type { BlogPost } from "./db";
import { getPillarById } from "./pillar-config";

// Shim __dirname globally for PDFKit standard fonts compatibility in ESM environment
if (typeof globalThis.__dirname === "undefined") {
  (globalThis as any).__dirname = path.resolve(process.cwd(), "node_modules/pdfkit/js");
}

const BRIEFS_DIR = path.resolve(process.cwd(), "data/blog-assets/briefs");

export interface GeneratedBriefResult {
  filePath: string;
  fileName: string;
}

/**
 * Generates or retrieves a cached 2-page Executive Architecture Brief PDF for any article
 */
export async function getOrGenerateArticleBriefPdf(post: BlogPost): Promise<GeneratedBriefResult> {
  const cleanSlug = post.slug.replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `${cleanSlug}-executive-architecture-brief.pdf`;
  const filePath = path.join(BRIEFS_DIR, fileName);

  if (!fs.existsSync(BRIEFS_DIR)) {
    fs.mkdirSync(BRIEFS_DIR, { recursive: true });
  }

  // Check disk cache first (0ms overhead for repeat requests)
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 1000) {
      return { filePath, fileName };
    }
  }

  // Build the PDF
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        bufferPages: true,
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Color Tokens
      const brandPrimary = "#4f46e5"; // Indigo 600
      const brandCyan = "#0284c7"; // Sky 600
      const brandDark = "#0f172a"; // Slate 900
      const textPrimary = "#1e293b"; // Slate 800
      const textSecondary = "#64748b"; // Slate 500
      const cardBg = "#f8fafc"; // Slate 50
      const cardBorder = "#e2e8f0"; // Slate 200

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 90; // 505.28

      const pillar = getPillarById(post.category || "");
      const pillarTitle = pillar?.title || "Systems & Software Architecture";

      // ───────────────────────────────────────────────────────────────────────
      // PAGE 1: STRATEGIC OVERVIEW & CORE ARCHITECTURAL DIRECTIVES
      // ───────────────────────────────────────────────────────────────────────

      // Top Header Border Accent Line
      doc.rect(45, 38, contentWidth, 3).fill(brandPrimary);

      // Header Brand & Monogram Bar
      doc.rect(45, 48, contentWidth, 38).fill(cardBg).strokeColor(cardBorder).lineWidth(0.75).stroke();

      // Monogram circle
      doc.circle(68, 67, 12).fill(brandPrimary);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text("MG", 61, 62);

      // Brand Title
      doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(12).text("MehdiGolzari.dev", 88, 57);
      doc.fillColor(textSecondary).font("Helvetica").fontSize(8).text("Senior Independent Technical Partner & Fractional CTO", 88, 71);

      // Document Type Tag
      doc.rect(pageWidth - 215, 55, 160, 24).fill("#ede9fe").strokeColor("#c4b5fd").lineWidth(0.5).stroke();
      doc.fillColor(brandPrimary).font("Helvetica-Bold").fontSize(7.5).text("EXECUTIVE ARCHITECTURE BRIEF", pageWidth - 210, 63, {
        width: 150,
        align: "center",
      });

      // Article Title & Metadata Box
      let curY = 98;
      doc.rect(45, curY, contentWidth, 90).fill("#ffffff").strokeColor(cardBorder).lineWidth(1).stroke();

      // Category Pill
      doc.rect(58, curY + 12, 160, 16).fill("#f1f5f9").strokeColor("#cbd5e1").lineWidth(0.5).stroke();
      doc.fillColor(brandCyan).font("Helvetica-Bold").fontSize(7.5).text(pillarTitle.toUpperCase(), 62, curY + 16, { width: 152, align: "center" });

      // Verification Code & Date
      const dateStr = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const refCode = `MGD-ARCH-${cleanSlug.slice(0, 8).toUpperCase()}`;

      doc.fillColor(textSecondary).font("Helvetica").fontSize(7.5).text(`REF: ${refCode}  ·  Published: ${dateStr}`, pageWidth - 250, curY + 16, { align: "right", width: 195 });

      // Title
      doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(15).text(post.title, 58, curY + 36, { width: contentWidth - 26, lineGap: 2 });

      // Sub-meta
      const readMinutes = post.readTimeMinutes || 6;
      doc.fillColor(textSecondary).font("Helvetica").fontSize(8).text(`Read Time: ~${readMinutes} min   ·   Target Audience: Early-Stage & Venture-Backed Founders, CTOs`, 58, curY + 74);

      // Section 1: Executive Problem Statement
      curY = 200;
      doc.rect(45, curY, contentWidth, 76).fill(cardBg).strokeColor(cardBorder).lineWidth(0.75).stroke();
      doc.rect(45, curY, 4, 76).fill(brandCyan);

      doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(9.5).text("1. EXECUTIVE CONTEXT & STRATEGIC PROBLEM", 58, curY + 10);
      doc.fillColor(textPrimary).font("Helvetica").fontSize(8.5).text(
        post.excerpt ||
          "Navigating early product development requires balancing high-velocity shipping with structural discipline. Making premature architectural bets creates technical debt that slows feature velocity and risks costly rewrites.",
        58,
        curY + 26,
        { width: contentWidth - 26, lineGap: 2.5 }
      );

      // Section 2: Non-Negotiable Architectural Rules
      curY = 288;
      doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(11).text("2. NON-NEGOTIABLE ARCHITECTURAL DIRECTIVES", 45, curY);
      doc.fillColor(textSecondary).font("Helvetica").fontSize(8).text("Battle-tested engineering standards to enforce across repository boundaries and developer sprints:", 45, curY + 14);

      const rules = pillar?.manifestoRules && pillar.manifestoRules.length >= 4
        ? pillar.manifestoRules.slice(0, 4)
        : [
            {
              title: "Modular Monolith Before Microservices",
              description: "Never introduce distributed microservices until single compute runtimes cannot sustain throughput or multiple autonomous teams require separated release cadences.",
            },
            {
              title: "Database Isolation at the Engine Level",
              description: "Enforce multi-tenant boundaries via PostgreSQL Row-Level Security policies rather than relying on error-prone application-layer query filters.",
            },
            {
              title: "In-Memory Decoupled Domain Events",
              description: "Leverage typed in-process event dispatchers for domain separation. Delay external queue brokers until multi-node background workers are mandatory.",
            },
            {
              title: "Strict Directory Module Encapsulation",
              description: "Prohibit cross-domain internal imports. Expose strictly defined public module contracts via index.ts and validate with linting rules.",
            },
          ];

      let ruleY = curY + 30;
      rules.forEach((rule, idx) => {
        const boxHeight = 78;
        doc.rect(45, ruleY, contentWidth, boxHeight).fill("#ffffff").strokeColor(cardBorder).lineWidth(0.75).stroke();

        // Rule Number Badge
        doc.rect(55, ruleY + 10, 20, 20).fill("#e0e7ff").strokeColor(brandPrimary).lineWidth(0.5).stroke();
        doc.fillColor(brandPrimary).font("Helvetica-Bold").fontSize(10).text(String(idx + 1), 55, ruleY + 14, { width: 20, align: "center" });

        // Rule Title
        doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(9.5).text(rule.title, 84, ruleY + 12, { width: contentWidth - 95 });

        // Rule Description
        doc.fillColor(textPrimary).font("Helvetica").fontSize(8).text(rule.description, 84, ruleY + 28, {
          width: contentWidth - 95,
          lineGap: 2,
        });

        ruleY += boxHeight + 8;
      });

      // Page 1 Footer Note
      doc.fillColor(textSecondary).font("Helvetica-Oblique").fontSize(7.5).text(
        "Confidential Executive Briefing · Prepared by MehdiGolzari.dev · Page 1 of 2",
        45,
        doc.page.height - 35,
        { width: contentWidth, align: "center" }
      );

      // ───────────────────────────────────────────────────────────────────────
      // PAGE 2: EXECUTION CHECKLIST, FAQ DIGEST & ADVISORY NEXT STEPS
      // ───────────────────────────────────────────────────────────────────────
      doc.addPage();

      // Top Accent Line
      doc.rect(45, 38, contentWidth, 3).fill(brandPrimary);

      // Page 2 Mini Header
      doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(10).text("MehdiGolzari.dev", 45, 48);
      doc.fillColor(textSecondary).font("Helvetica").fontSize(8).text(`Executive Architecture Brief  ·  ${cleanSlug}`, 145, 50);
      doc.rect(45, 62, contentWidth, 0.5).fill(cardBorder);

      // Section 3: Founder Pre-Launch / Pre-Development Due Diligence Checklist
      curY = 72;
      doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(11).text("3. FOUNDER PRE-DEVELOPMENT DUE DILIGENCE CHECKLIST", 45, curY);
      doc.fillColor(textSecondary).font("Helvetica").fontSize(8).text("Verify these technical prerequisites with your engineering team or external dev agency:", 45, curY + 14);

      const checklistItems = [
        "1. Domain Boundaries: Clear directory isolation with no circular inter-module dependencies.",
        "2. Tenancy Security: Multi-tenant data segregation enforced with Postgres RLS or schema-level isolation.",
        "3. CI/CD Guardrails: Automated regression test suites and type-checkers blocking broken builds.",
        "4. Unit Economics: Cloud hosting and LLM API cost projections modeled for 10x current traffic.",
        "5. Investor Readiness: Infrastructure diagrams, repository documentation, and clean licensing for seed diligence.",
      ];

      let checkY = curY + 28;
      checklistItems.forEach((item) => {
        doc.rect(45, checkY, contentWidth, 24).fill(cardBg).strokeColor(cardBorder).lineWidth(0.5).stroke();
        // Checkbox box
        doc.rect(55, checkY + 6, 12, 12).fill("#ffffff").strokeColor(brandPrimary).lineWidth(1).stroke();
        doc.fillColor(textPrimary).font("Helvetica").fontSize(8).text(item, 76, checkY + 7, { width: contentWidth - 85 });
        checkY += 28;
      });

      // Section 4: Key Founder Architecture FAQs
      curY = checkY + 6;
      doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(11).text("4. ARCHITECTURAL DECISION DIGEST (FAQ)", 45, curY);

      const faqsToUse = Array.isArray(post.faqs) && post.faqs.length >= 2
        ? post.faqs.slice(0, 2)
        : [
            {
              question: "When should a startup transition from an MVP monolith to microservices?",
              answer:
                "Only when single-database compute saturation cannot be solved with read replicas, or when multiple separate dev teams require independent deployment pipelines.",
            },
            {
              question: "How can early-stage founders prevent runaway cloud and AI API costs?",
              answer:
                "Leverage aggressive prompt caching, eliminate idle server infrastructure by adopting managed container runtimes, and enforce strict token timeouts.",
            },
          ];

      let faqY = curY + 18;
      faqsToUse.forEach((faq) => {
        const boxH = 58;
        doc.rect(45, faqY, contentWidth, boxH).fill("#ffffff").strokeColor(cardBorder).lineWidth(0.5).stroke();
        doc.fillColor(brandPrimary).font("Helvetica-Bold").fontSize(8.5).text(`Q: ${faq.question}`, 55, faqY + 8, { width: contentWidth - 20 });
        doc.fillColor(textPrimary).font("Helvetica").fontSize(7.5).text(`A: ${faq.answer}`, 55, faqY + 24, { width: contentWidth - 20, lineGap: 1.5 });
        faqY += boxH + 8;
      });

      // Section 5: Architecture Triage & Consultation Advisory Box
      curY = faqY + 6;
      const ctaHeight = 115;
      doc.rect(45, curY, contentWidth, ctaHeight).fill("#0f172a").strokeColor(brandPrimary).lineWidth(1.5).stroke();

      // CTA Top Accent Pill
      doc.rect(pageWidth - 225, curY + 12, 170, 18).fill("#312e81").strokeColor(brandPrimary).lineWidth(0.5).stroke();
      doc.fillColor("#a5b4fc").font("Helvetica-Bold").fontSize(7.5).text("DIRECT FOUNDER ADVISORY", pageWidth - 220, curY + 16, { width: 160, align: "center" });

      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("Review Your Architecture in a 30-Min Triage Call", 60, curY + 14);

      doc.fillColor("#cbd5e1").font("Helvetica").fontSize(8).text(
        "Stop guessing on technology choices and agency deliverables. In a 30-minute Architecture Triage call, we will review your data models, evaluate technical debt, and ensure your system is architected to scale without costly rewrites.",
        60,
        curY + 36,
        { width: contentWidth - 30, lineGap: 2 }
      );

      // Contact options inside CTA
      doc.rect(60, curY + 74, 210, 26).fill(brandPrimary);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5).text("Book Architecture Triage at: MehdiGolzari.dev/contact", 60, curY + 82, { width: 210, align: "center" });

      doc.rect(285, curY + 74, 205, 26).fill("#1e293b").strokeColor("#334155").lineWidth(0.5).stroke();
      doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(8).text("Direct WhatsApp: +90 501 939 0465", 285, curY + 82, { width: 205, align: "center" });

      // Page 2 Global Footer
      doc.fillColor(textSecondary).font("Helvetica-Oblique").fontSize(7.5).text(
        "Confidential Executive Briefing · Copyright © Mehdi Golzari · https://mehdigolzari.dev · Page 2 of 2",
        45,
        doc.page.height - 35,
        { width: contentWidth, align: "center" }
      );

      doc.end();

      writeStream.on("finish", () => {
        resolve({ filePath, fileName });
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}
