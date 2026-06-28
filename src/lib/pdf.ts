import fs from "fs";
import path from "path";
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

      // Executive Summary
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(darkColor)
        .text("Executive Summary")
        .moveDown(0.5);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(textColor)
        .text(analysis.executiveSummary, { align: "justify", lineGap: 3 })
        .moveDown(1.5);

      // Phase Recommendation
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(darkColor)
        .text("Framework Placement & Next Step")
        .moveDown(0.5);

      const recY = doc.y;
      doc
        .rect(50, recY, 495, 80)
        .fill("#e0e7ff") // Indigo 100 bg
        .strokeColor("#a5b4fc") // Indigo 300 border
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(primaryColor)
        .text(`Recommended Phase: ${analysis.recommendedPhase.toUpperCase()}™`, 65, recY + 15);

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(textColor)
        .text(analysis.recommendedPhaseReasoning, 65, recY + 35, { width: 465, lineGap: 2 });

      doc.y = recY + 95;

      // Key Insights
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(darkColor)
        .text("AI-Powered Insights")
        .moveDown(0.5);

      analysis.insights.forEach((insight) => {
        const insightY = doc.y;
        
        // Render Category Heading
        doc
          .font("Helvetica-Bold")
          .fontSize(10.5)
          .fillColor(darkColor)
          .text(insight.category)
          .moveDown(0.2);

        doc
          .font("Helvetica-Oblique")
          .fontSize(9.5)
          .fillColor(textColor)
          .text(`Observation: `, { continued: true })
          .font("Helvetica")
          .text(insight.observation, { lineGap: 2 })
          .moveDown(0.2);

        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor(primaryColor)
          .text(`Recommendation: `, { continued: true })
          .font("Helvetica")
          .fillColor(textColor)
          .text(insight.tip, { lineGap: 2 })
          .moveDown(0.8);
      });

      // AI Recommendations Placeholder Section
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(darkColor)
        .text("Detailed Technical Recommendations")
        .moveDown(0.5);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(secondaryColor)
        .text("AI Recommendations:")
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(textColor)
        .text("Available in the next version after your Discovery Call.", { oblique: true })
        .moveDown(2);

      // Book Discovery Call CTA Footer Banner
      const ctaY = doc.y;
      // If we are too close to the bottom, start a new page
      if (ctaY > 700) {
        doc.addPage();
      }
      
      const drawCtaY = doc.y;
      doc
        .rect(50, drawCtaY, 495, 70)
        .fill(darkColor)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#ffffff")
        .text("Ready to discuss your product?", 65, drawCtaY + 15);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#e2e8f0")
        .text("Book a Discovery Call and we will review this assessment together in detail.", 65, drawCtaY + 32);

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(primaryColor)
        .text("Go to: MehdiGolzari.dev", 65, drawCtaY + 47);

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
