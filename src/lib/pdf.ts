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
 * Generates a beautiful PDF report based on assessment answers and Qwen analysis.
 * Returns the absolute path to the generated PDF.
 */
export function generateAssessmentPdf(
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

      // Title & Header Brand
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor(primaryColor)
        .text("MehdiGolzari", { continued: true })
        .fillColor(darkColor)
        .text(".dev")
        .moveDown(0.2);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(secondaryColor)
        .text("FOUNDER FIT ASSESSMENT™ REPORT", { characterSpacing: 1.5 })
        .moveDown(1.5);

      // Metadata Box
      const metaY = doc.y;
      doc
        .rect(50, metaY, 495, 75)
        .fill(lightBgColor)
        .strokeColor(borderCardColor)
        .stroke();

      doc
        .fillColor(darkColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("FOUNDER PROFILE", 65, metaY + 12)
        .font("Helvetica")
        .fontSize(9)
        .fillColor(textColor)
        .text(`Founder Name: ${answers.founderName || "N/A"}`)
        .text(`Role: ${answers.founderRole || "N/A"}`)
        .text(`LinkedIn: ${answers.linkedinUrl || "N/A"}`);

      doc
        .fillColor(darkColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("STARTUP INFO", 310, metaY + 12)
        .font("Helvetica")
        .fontSize(9)
        .fillColor(textColor)
        .text(`Startup Name: ${answers.startupName || "N/A"}`)
        .text(`Target Audience: ${answers.targetAudience || "N/A"}`)
        .text(`Stage: ${answers.fundingStage || "N/A"}`);

      doc.y = metaY + 90; // reset cursor below metadata

      // Helper function to check page boundaries and add page if needed
      const ensureSpace = (heightNeeded: number) => {
        if (doc.y + heightNeeded > doc.page.height - 65) {
          doc.addPage();
        }
      };

      // 1. Executive Summary
      ensureSpace(120);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(darkColor)
        .text("Executive Summary")
        .moveDown(0.3);

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(textColor)
        .text(analysis.executiveSummary, { align: "justify", lineGap: 2.5 })
        .moveDown(1.2);

      // 2. Phase Recommendation Banner
      ensureSpace(95);
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
        .text(`Recommended Phase: ${analysis.recommendedPhase.toUpperCase()}™`, 65, recY + 12);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(textColor)
        .text(analysis.recommendedPhaseReasoning, 65, recY + 30, { width: 465, lineGap: 1.5 });

      doc.y = recY + 90;

      // 3. Founder Strengths
      ensureSpace(120);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(darkColor)
        .text("Founder Strengths")
        .moveDown(0.4);

      const strengthsY = doc.y;
      const strengthsHeight = 15 + (analysis.founderStrengths.length * 18);
      doc
        .rect(50, strengthsY, 495, strengthsHeight)
        .fill("#f0fdf4")
        .strokeColor("#bbf7d0")
        .stroke();

      let strengthTextY = strengthsY + 10;
      analysis.founderStrengths.forEach((strength) => {
        doc
          .font("Helvetica-Bold")
          .fillColor("#16a34a")
          .text("✓ ", 65, strengthTextY)
          .font("Helvetica")
          .fillColor(textColor)
          .text(strength, 80, strengthTextY, { width: 450 });
        strengthTextY += 18;
      });

      doc.y = strengthsY + strengthsHeight + 15;

      // 4. Biggest Opportunities
      ensureSpace(130);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(darkColor)
        .text("Biggest Opportunities")
        .moveDown(0.4);

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

      // 5. What Could Slow You Down (Risks)
      ensureSpace(130);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(darkColor)
        .text("What Could Slow You Down")
        .moveDown(0.4);

      analysis.whatCouldSlowYouDown.forEach((item) => {
        ensureSpace(65);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#ea580c") // Orange text
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

      // 6. If This Were My Startup
      ensureSpace(120);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(darkColor)
        .text("If This Were My Startup")
        .moveDown(0.4);

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

      // 7. Engineering Strategy
      ensureSpace(120);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(darkColor)
        .text("Engineering Strategy")
        .moveDown(0.4);

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

      // 8. Fastest Path to Launch
      ensureSpace(120);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(darkColor)
        .text("Fastest Path to Launch")
        .moveDown(0.4);

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

      // 9. Potential Time Savings Callout
      ensureSpace(70);
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
          "Resolving the recommendations in this report before development begins could reduce unnecessary engineering effort by several weeks. Validating assumptions early is significantly less expensive than rebuilding after launch.",
          65,
          savingsY + 12,
          { width: 465, align: "center", lineGap: 2 }
        );

      doc.y = savingsY + 70;

      // 10. Book Discovery Call CTA Footer Banner
      ensureSpace(150);
      const drawCtaY = doc.y;
      doc
        .rect(50, drawCtaY, 495, 125)
        .fill(darkColor)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#ffffff")
        .text("Continue Your Founder-to-Launch Journey", 65, drawCtaY + 12);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#e2e8f0")
        .text("This report is intentionally the beginning—not the conclusion. A Discovery Session builds on these findings to refine MVP scope, prioritize value, and design the fastest path to launch. Whether we decide to work together or not, you will leave with a practical roadmap.", 65, drawCtaY + 28, { width: 465, lineGap: 1.5 });

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#34d399")
        .text("✓ Refine MVP Scope   ✓ Challenge Key Assumptions   ✓ Identify Risks Early   ✓ Design Launch Path", 65, drawCtaY + 80);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#f472b6")
        .text("Book Your Discovery Session at: MehdiGolzari.dev", 65, drawCtaY + 102);

      doc.y = drawCtaY + 135;

      // Global Footer (Page numbers)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
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
