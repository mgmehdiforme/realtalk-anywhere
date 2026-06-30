import fs from "fs";
import path from "path";

// Shim __dirname globally for PDFKit standard fonts compatibility in ESM environment
if (typeof globalThis.__dirname === "undefined") {
  (globalThis as any).__dirname = path.resolve(process.cwd(), "node_modules/pdfkit/js");
}

import PDFDocument from "pdfkit";
import { QwenAnalysisResult } from "./qwen";

const REPORTS_DIR = path.resolve(process.cwd(), "data/reports");

/**
 * Generates a beautiful PDF report based on blueprint answers and Qwen analysis.
 * Returns the absolute path to the generated PDF.
 */
export function generateBlueprintPdf(
  email: string,
  answers: Record<string, any>,
  analysis: QwenAnalysisResult
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure directory exists
      if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
      }

      const fileName = `${encodeURIComponent(email.toLowerCase().replace(/[^a-z0-9]/g, "_"))}.pdf`;
      const filePath = path.join(REPORTS_DIR, fileName);
      
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true, // Allows us to do page numbers at the end
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Define color variables (based on MehdiGolzari.dev's palette)
      const primaryColor = "#6366f1"; // Indigo/Neon violet
      const secondaryColor = "#a855f7"; // Magenta/Purple
      const darkColor = "#1e1b4b"; // Deep dark navy
      const textColor = "#334155"; // Slate-700
      const lightBgColor = "#f8fafc"; // Slate-50
      const borderCardColor = "#e2e8f0"; // Slate-200

      // ==========================================
      // 1. COVER PAGE
      // ==========================================
      // Blueprint border/sketches theme decoration
      doc.rect(40, 40, 515, 762).strokeColor(primaryColor).lineWidth(1.5).stroke();
      doc.rect(45, 45, 505, 752).strokeColor("#e0e7ff").lineWidth(0.5).stroke();

      // Brand Logo
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor(primaryColor)
        .text("MehdiGolzari", 70, 80, { continued: true })
        .fillColor(darkColor)
        .text(".dev");

      // Title
      doc
        .font("Helvetica-Bold")
        .fontSize(36)
        .fillColor(darkColor)
        .text("Go-to-Launch", 70, 240)
        .fillColor(primaryColor)
        .text("Blueprint™")
        .moveDown(0.2);

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor(textColor)
        .text("Your personalized execution blueprint for launching faster,", { lineGap: 3 })
        .text("with fewer risks and greater confidence.");

      // Metadata block
      const metaY = 480;
      doc
        .rect(70, metaY, 455, 140)
        .fill(lightBgColor)
        .strokeColor(borderCardColor)
        .stroke();

      doc
        .fillColor(darkColor)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("PREPARED EXCLUSIVELY FOR:", 90, metaY + 20)
        .moveDown(0.8);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(textColor)
        .text("Founder: ", 90, metaY + 45, { continued: true })
        .font("Helvetica")
        .text(`${answers.founderName || "N/A"}`)
        .font("Helvetica-Bold")
        .text("Startup Name: ", 90, metaY + 65, { continued: true })
        .font("Helvetica")
        .text(`${answers.startupName || "N/A"}`)
        .font("Helvetica-Bold")
        .text("Generation Date: ", 90, metaY + 85, { continued: true })
        .font("Helvetica")
        .text(`${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);

      // Confidential label
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#ef4444")
        .text("CONFIDENTIAL", 70, 710, { characterSpacing: 2 });

      // Start new page for the report details
      doc.addPage();

      // Helper function to check page boundaries and add page if needed
      const ensureSpace = (heightNeeded: number) => {
        if (doc.y + heightNeeded > doc.page.height - 65) {
          doc.addPage();
        }
      };

      const drawHeader = (sectionTitle: string) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .fillColor(darkColor)
          .text(sectionTitle)
          .moveDown(0.3);
      };

      // Header on every content page
      const pageHeader = () => {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(primaryColor)
          .text("Go-to-Launch Blueprint™", 50, 30, { continued: true })
          .fillColor("#94a3b8")
          .font("Helvetica")
          .text(`  |  Prepared for ${answers.startupName || "N/A"}`, { align: "left" })
          .moveDown(0.5);
        doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, 42).lineTo(545, 42).stroke();
        doc.y = 55;
      };

      // Set pageHeader for subsequent pages
      doc.on("pageAdded", () => {
        pageHeader();
      });

      // Initialize first content page header
      pageHeader();

      // ==========================================
      // SECTION 1: EXECUTIVE SUMMARY
      // ==========================================
      ensureSpace(120);
      drawHeader("Executive Summary");
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(textColor)
        .text(analysis.executiveSummary, { align: "justify", lineGap: 2.5 })
        .moveDown(1.5);

      // ==========================================
      // SECTION 2: RECOMMENDED FOUNDER-TO-LAUNCH PHASE
      // ==========================================
      ensureSpace(110);
      drawHeader("Recommended Founder-to-Launch Phase");
      const recY = doc.y;
      doc
        .rect(50, recY, 495, 75)
        .fill("#e0e7ff")
        .strokeColor("#a5b4fc")
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(primaryColor)
        .text(`${analysis.recommendedPhase.toUpperCase()}™ Phase`, 65, recY + 12, { continued: true })
        .fillColor(textColor)
        .font("Helvetica")
        .fontSize(9)
        .text(`  (${analysis.currentStage})`);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(textColor)
        .text(analysis.recommendedPhaseReasoning, 65, recY + 32, { width: 465, lineGap: 1.5 });

      doc.y = recY + 90;

      // ==========================================
      // SECTION 3: FOUNDER STRENGTHS
      // ==========================================
      let strengthsHeight = 15;
      analysis.founderStrengths.forEach((strength) => {
        doc.font("Helvetica").fontSize(9.5);
        const itemHeight = doc.heightOfString(strength, { width: 440, lineGap: 2 });
        strengthsHeight += itemHeight + 10;
      });

      ensureSpace(strengthsHeight + 45);
      drawHeader("Founder Strengths");
      const strengthsY = doc.y;
      doc
        .rect(50, strengthsY, 495, strengthsHeight)
        .fill("#f0fdf4")
        .strokeColor("#bbf7d0")
        .stroke();

      let currentStrengthY = strengthsY + 10;
      analysis.founderStrengths.forEach((strength) => {
        doc.font("Helvetica").fontSize(9.5);
        const itemHeight = doc.heightOfString(strength, { width: 440, lineGap: 2 });
        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor("#16a34a")
          .text("✓ ", 65, currentStrengthY);

        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor(textColor)
          .text(strength, 80, currentStrengthY, { width: 440, lineGap: 2 });

        currentStrengthY += itemHeight + 10;
      });
      doc.y = strengthsY + strengthsHeight + 15;

      // ==========================================
      // SECTION 4: BIGGEST OPPORTUNITIES
      // ==========================================
      ensureSpace(130);
      drawHeader("Biggest Opportunities");
      analysis.biggestOpportunities.forEach((opp) => {
        ensureSpace(45);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(primaryColor)
          .text(opp.title)
          .font("Helvetica")
          .fontSize(9)
          .fillColor(textColor)
          .text(opp.description, { lineGap: 1.5 })
          .moveDown(0.6);
      });
      doc.moveDown(0.6);

      // ==========================================
      // SECTION 5: WHAT COULD SLOW YOU DOWN
      // ==========================================
      ensureSpace(130);
      drawHeader("What Could Slow You Down");
      analysis.whatCouldSlowYouDown.forEach((item) => {
        ensureSpace(65);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#ea580c")
          .text(item.risk)
          .font("Helvetica-Oblique")
          .fontSize(9)
          .fillColor(textColor)
          .text("Business Impact: ", { continued: true })
          .font("Helvetica")
          .text(item.businessImpact, { lineGap: 1.5 })
          .font("Helvetica-Oblique")
          .text("Technical Impact: ", { continued: true })
          .font("Helvetica")
          .text(item.technicalImpact, { lineGap: 1.5 })
          .moveDown(0.8);
      });
      doc.moveDown(0.4);

      // ==========================================
      // SECTION 6: TECHNICAL PARTNERSHIP INSIGHTS
      // ==========================================
      ensureSpace(120);
      drawHeader("Technical Partnership Insights");
      let stepNum = 1;
      analysis.ifThisWereMyStartup.forEach((point) => {
        ensureSpace(45);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(primaryColor)
          .text(`${stepNum}. `, { continued: true })
          .font("Helvetica")
          .fontSize(9)
          .fillColor(textColor)
          .text(point, { lineGap: 1.5 })
          .moveDown(0.5);
        stepNum++;
      });
      doc.moveDown(0.6);

      // ==========================================
      // SECTION 7: ENGINEERING STRATEGY
      // ==========================================
      ensureSpace(120);
      drawHeader("Engineering Strategy");
      analysis.engineeringStrategy.forEach((strat) => {
        ensureSpace(60);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(darkColor)
          .text(strat.area)
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(secondaryColor)
          .text("Recommendation: ", { continued: true })
          .font("Helvetica")
          .fillColor(textColor)
          .text(strat.recommendation)
          .font("Helvetica-Oblique")
          .text("Why: ", { continued: true })
          .font("Helvetica")
          .text(strat.why, { lineGap: 1.5 })
          .moveDown(0.8);
      });
      doc.moveDown(0.4);

      // ==========================================
      // SECTION 8: FASTEST PATH TO LAUNCH
      // ==========================================
      ensureSpace(120);
      drawHeader("Fastest Path to Launch");
      analysis.fastestPathToLaunch.forEach((point) => {
        ensureSpace(35);
        doc
          .font("Helvetica-Bold")
          .fillColor(primaryColor)
          .text("• ", { continued: true })
          .font("Helvetica")
          .fontSize(9)
          .fillColor(textColor)
          .text(point, { lineGap: 1.5 })
          .moveDown(0.5);
      });
      doc.moveDown(0.8);

      // ==========================================
      // SECTION 9: POTENTIAL TIME SAVINGS
      // ==========================================
      ensureSpace(70);
      drawHeader("Potential Time Savings");
      const savingsY = doc.y;
      doc
        .rect(50, savingsY, 495, 55)
        .fill("#fafaf9")
        .strokeColor("#e7e5e4")
        .stroke();

      doc
        .font("Helvetica-Oblique")
        .fontSize(8.5)
        .fillColor("#57534e")
        .text(
          "Resolving the recommendations in this blueprint before development begins could reduce unnecessary engineering effort by several weeks. Validating assumptions early is significantly less expensive than rebuilding after launch. Founders using this blueprint typically save 30-40% of standard MVP timelines.",
          65,
          savingsY + 12,
          { width: 465, align: "center", lineGap: 2 }
        );

      doc.y = savingsY + 70;
      doc.moveDown(1);

      // ==========================================
      // SECTION 10: RECOMMENDED NEXT ACTIONS
      // ==========================================
      ensureSpace(150);
      drawHeader("Recommended Next Actions");
      const drawCtaY = doc.y;
      doc
        .rect(50, drawCtaY, 495, 125)
        .fill(darkColor)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#ffffff")
        .text("Continue Your Go-to-Launch Journey", 65, drawCtaY + 12);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#e2e8f0")
        .text("Your Blueprint is the beginning—not the final answer. During a Discovery Session, we will review it together, challenge key assumptions, refine your MVP scope, and build a practical launch plan. The objective is to help you launch with greater confidence—in weeks, not months.", 65, drawCtaY + 28, { width: 465, lineGap: 1.5 });

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#34d399")
        .text("✓ Refine MVP Scope   ✓ Challenge Key Assumptions   ✓ Reduce Execution Risk   ✓ Build Practical Plan", 65, drawCtaY + 80);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#f472b6")
        .text("Review Your Blueprint Together at: MehdiGolzari.dev", 65, drawCtaY + 102);

      doc.y = drawCtaY + 135;

      // Global Footer (Page numbers, excluding Cover Page)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        if (i === 0) continue; // Skip cover page footer
        doc
          .fillColor("#94a3b8")
          .font("Helvetica")
          .fontSize(8)
          .text(
            `Page ${i + 1} of ${range.count}`,
            50,
            doc.page.height - 40,
            { align: "center", width: doc.page.width - 100 }
          );
      }

      doc.end();

      writeStream.on("finish", () => {
        resolve(filePath);
      });

      writeStream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}
