import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import os from "os";

const OUTPUT_FILE = path.resolve(process.cwd(), "linkedin-session.json");

// Default Windows Chrome User Data directory
const CHROME_USER_DATA = path.join(
  os.homedir(),
  "AppData",
  "Local",
  "Google",
  "Chrome",
  "User Data",
);

async function checkCDPPort(url = "http://127.0.0.1:9222"): Promise<boolean> {
  try {
    const res = await fetch(`${url}/json/version`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("\n=======================================================");
  console.log("   LINKEDIN CURRENT BROWSER SESSION EXTRACTOR");
  console.log("=======================================================\n");

  // MODE 1: Check if running Chrome has Remote Debugging Port (9222) open
  const isCDPAvailable = await checkCDPPort();

  if (isCDPAvailable) {
    console.log("[Mode 1] Detected running Google Chrome with Remote Debugging (port 9222)!");
    console.log("Connecting directly to your active browser...");

    try {
      const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
      const defaultContext = browser.contexts()[0];

      if (!defaultContext) {
        throw new Error("No browser context found on CDP connection.");
      }

      console.log("Extracting storage state from active Chrome...");
      const state = await defaultContext.storageState();

      const authCookie = state.cookies.find((c) => c.name === "li_at");
      if (!authCookie) {
        console.warn("WARNING: 'li_at' cookie not found in active browser. Make sure you are logged into LinkedIn.");
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        accountInfo: {
          name: "LinkedIn User (Current Chrome)",
          headline: "Active Browser Session",
        },
        ...state,
      };

      await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), "utf-8");

      console.log("\n=======================================================");
      console.log("  SUCCESS! LinkedIn session captured from your Chrome!");
      console.log("=======================================================");
      console.log(`Saved session to: ${OUTPUT_FILE}`);
      console.log(`Cookies count:    ${state.cookies.length}`);
      console.log("\nYou can now upload this file to http://localhost:3000/admin/linkedin\n");

      await browser.close();
      process.exit(0);
    } catch (cdpErr: any) {
      console.warn("CDP connection failed:", cdpErr.message);
    }
  }

  // MODE 2: Chrome is already running without debug port
  console.log("Your daily Google Chrome is currently open without a remote debugging port.");
  console.log("Because Chrome locks its active profile while open, you have 2 instant solutions:\n");

  console.log("-------------------------------------------------------------------------");
  console.log("⭐ SOLUTION A (1-CLICK & FASTEST — ZERO RE-LOGIN):");
  console.log("Use our pre-built local Chrome Extension (takes 10 seconds):");
  console.log("-------------------------------------------------------------------------");
  console.log("1. In your Google Chrome, open: chrome://extensions");
  console.log("2. Turn ON 'Developer mode' (toggle in the top-right corner).");
  console.log("3. Click 'Load unpacked' (top-left button).");
  console.log(`4. Select this folder from your project:`);
  console.log(`   ${path.resolve(process.cwd(), "extensions/linkedin-session-exporter")}`);
  console.log("5. Click the extension icon in your Chrome toolbar -> Click 'Export'!");
  console.log(`6. It immediately downloads 'linkedin-session.json' from your logged-in session!\n`);

  console.log("-------------------------------------------------------------------------");
  console.log("⭐ SOLUTION B (LAUNCH CURRENT CHROME WITH DEBUGGING):");
  console.log("-------------------------------------------------------------------------");
  console.log("Close Chrome completely, then run Chrome with the debugging port flag:");
  console.log(`& "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222`);
  console.log("Then re-run: npm run linkedin:login\n");

  console.log("-------------------------------------------------------------------------");
  console.log("⭐ SOLUTION C (LAUNCH DEDICATED LOGIN WINDOW):");
  console.log("-------------------------------------------------------------------------");
  console.log("Press [Y] if you prefer opening a dedicated Chrome window to log in once:");

  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question("Open dedicated Chrome window now? [y/N]: ", async (answer) => {
    rl.close();
    if (answer.trim().toLowerCase() !== "y") {
      console.log("\nAborted. Recommended: Use Solution A (Chrome Extension) in extensions/linkedin-session-exporter");
      process.exit(0);
    }

    const PROFILE_DIR = path.resolve(process.cwd(), ".linkedin-profile-cache");
    await fs.mkdir(PROFILE_DIR, { recursive: true });

    console.log("\nLaunching Chrome with channel: 'chrome'...");
    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel: "chrome",
      headless: false,
      viewport: { width: 1280, height: 800 },
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-infobars",
      ],
    });

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    console.log("Navigating to LinkedIn...");
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

    console.log("Please complete login in the opened Chrome window...");

    let loggedIn = false;
    const interval = setInterval(async () => {
      try {
        if (page.url().includes("/feed")) {
          loggedIn = true;
        }
      } catch (_) {}
    }, 1500);

    while (!loggedIn) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    clearInterval(interval);
    await page.waitForTimeout(2000);

    const state = await context.storageState();
    const payload = {
      exportedAt: new Date().toISOString(),
      accountInfo: {
        name: "LinkedIn User",
        headline: "Active Browser Session",
      },
      ...state,
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), "utf-8");
    console.log(`\nSUCCESS! Saved session to: ${OUTPUT_FILE}`);
    await context.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Extraction error:", err);
  process.exit(1);
});
