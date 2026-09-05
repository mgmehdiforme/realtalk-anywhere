import path from "path";
import fs from "fs";
import os from "os";
import child_process from "child_process";
import type { BrowserContext, Page, Locator } from "playwright";
import {
  getLinkedInConfig,
  saveLinkedInSession,
  addLinkedInEngagementLog,
  extractAndFormatLinkedInCookies,
  type LinkedInEngagementLog,
} from "./db";
import {
  evaluateFeedCandidates,
  generateCTOComment,
  discoverTrendingLinkedInSearchQuery,
  type LinkedInFeedCandidate,
  type TrendingLinkedInQuery,
} from "./linkedin-ai";

export interface LinkedInRunResult {
  success: boolean;
  status: "published" | "skipped" | "dry-run" | "failed";
  reason?: string;
  comment?: string;
  targetPost?: LinkedInFeedCandidate;
  log?: LinkedInEngagementLog;
  error?: string;
}

/**
 * Fallback topic when AI search grounding is initializing
 */
const DEFAULT_FALLBACK_TOPIC = "AI agents in production";

/**
 * Human-like typing simulator with variable delays and natural micro-pauses.
 * Handles full Unicode code points and emojis natively to prevent UTF-16 surrogate splitting (which causes ).
 */
async function humanType(page: Page, text: string) {
  // Focus into editor and clear existing placeholder/text
  await page.keyboard.press("ControlOrMeta+A").catch(() => {});
  await page.keyboard.press("Backspace").catch(() => {});
  await page.waitForTimeout(300);

  // Array.from splits by full Unicode code points, preserving 4-byte surrogate pairs for emojis
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // Check if character is an emoji or surrogate pair (code point > 0xFFFF or emoji unicode category)
    const codePoint = char.codePointAt(0) ?? 0;
    const isEmoji =
      codePoint > 0xffff ||
      /\p{Extended_Pictographic}|\p{Emoji}/u.test(char);

    if (isEmoji) {
      // Use insertText for emojis to guarantee native UTF-8 character preservation without keycode corruption
      await page.keyboard.insertText(char);
      await page.waitForTimeout(Math.floor(Math.random() * 80) + 40);
    } else if (char === "\n") {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(Math.floor(Math.random() * 200) + 150);
    } else {
      await page.keyboard.type(char, { delay: Math.floor(Math.random() * 35) + 20 });
    }

    // Micro-pauses at sentence endings for natural human cadence
    if (char === "." || char === "!" || char === "?") {
      await page.waitForTimeout(Math.floor(Math.random() * 350) + 200);
    } else if (char === ",") {
      await page.waitForTimeout(Math.floor(Math.random() * 150) + 80);
    }
  }
}

/**
 * Normalizes a LinkedIn post URL by stripping tracking params, UTM tags, and trailing slashes.
 */
function normalizeLinkedInPostUrl(url?: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `https://www.linkedin.com${pathname}`.toLowerCase();
  } catch {
    return url.split("?")[0].replace(/\/+$/, "").toLowerCase();
  }
}

/**
 * Extracts the numeric activity/post ID from a LinkedIn URL or URN.
 * e.g. "urn:li:activity:7234567890" -> "7234567890"
 * e.g. "https://www.linkedin.com/feed/update/urn:li:activity:7234567890/" -> "7234567890"
 * e.g. "https://www.linkedin.com/posts/vijay-r_the-agent-definition-control-plane-activity-7234567890-xyz" -> "7234567890"
 */
function extractPostNumericId(str?: string): string {
  if (!str) return "";
  const match = str.match(/(?:activity|share|ugcPost)[:-](\d{16,22})/i) || str.match(/\b(\d{18,20})\b/);
  return match ? match[1] : "";
}

/**
 * Creates a text fingerprint from author name and opening words of post text.
 */
function createPostTextFingerprint(authorName?: string, postText?: string): string {
  const cleanAuthor = (authorName || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
  const cleanText = (postText || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
  return `${cleanAuthor}:${cleanText}`;
}

/**
 * Comprehensive check against past engaged posts in log history.
 * Checks numeric post ID, normalized URL, and author/text fingerprint.
 */
function isPostAlreadyEngaged(
  candidate: {
    postUrl?: string;
    activityUrn?: string;
    authorName?: string;
    postText?: string;
  },
  logs: LinkedInEngagementLog[] = [],
): { alreadyEngaged: boolean; matchedLog?: LinkedInEngagementLog; reason?: string } {
  const candidateNumericId =
    extractPostNumericId(candidate.activityUrn) ||
    extractPostNumericId(candidate.postUrl);
  const candidateNormUrl = normalizeLinkedInPostUrl(candidate.postUrl);
  const candidateFingerprint = createPostTextFingerprint(candidate.authorName, candidate.postText);

  // 1. Check historical engagement logs (both published and dry-run)
  for (const log of logs) {
    if (log.status !== "published" && log.status !== "dry-run") {
      continue;
    }

    const logNumericId = extractPostNumericId(log.postUrl);
    if (candidateNumericId && logNumericId && candidateNumericId === logNumericId) {
      return {
        alreadyEngaged: true,
        matchedLog: log,
        reason: `Matched post numeric ID ${candidateNumericId} (previously logged for "${log.authorName}")`,
      };
    }

    const logNormUrl = normalizeLinkedInPostUrl(log.postUrl);
    if (
      candidateNormUrl &&
      logNormUrl &&
      !candidateNormUrl.includes("/search/") &&
      candidateNormUrl === logNormUrl
    ) {
      return {
        alreadyEngaged: true,
        matchedLog: log,
        reason: `Matched normalized post URL (${candidateNormUrl})`,
      };
    }

    const logFingerprint = createPostTextFingerprint(log.authorName, log.postSnippet);
    if (
      candidate.authorName &&
      log.authorName &&
      candidate.authorName.toLowerCase().trim() === log.authorName.toLowerCase().trim() &&
      candidateFingerprint.slice(0, 30) === logFingerprint.slice(0, 30)
    ) {
      return {
        alreadyEngaged: true,
        matchedLog: log,
        reason: `Matched author "${candidate.authorName}" and post content fingerprint`,
      };
    }
  }

  // 2. Blacklist protection for posts that were engaged in previous test sessions
  const lowerAuthor = (candidate.authorName || "").toLowerCase();
  const lowerText = (candidate.postText || "").toLowerCase();
  if (
    lowerAuthor.includes("vijay r") ||
    lowerText.includes("twenty-five agents") ||
    lowerText.includes("the agent definition control plane")
  ) {
    return {
      alreadyEngaged: true,
      reason: `Matched previously engaged post by Vijay R. ("Twenty-five agents...")`,
    };
  }

  return { alreadyEngaged: false };
}

/**
 * Attempts automated password login fallback when LinkedIn prompts for credentials/password on an authwall or checkpoint.
 */
async function attemptAutomatedLogin(
  page: Page,
  context: BrowserContext,
): Promise<{ success: boolean; reason?: string }> {
  try {
    const initialUrl = page.url();
    console.log(`[LinkedIn Runner] Checking for password login prompt on authwall/checkpoint (current URL: ${initialUrl})...`);

    // 1. Check if LinkedIn Fastrack checkpoint (#fastrack-div) is present
    const fastrackLocator = page.locator("#fastrack-div, form[action*='floe-profile-submit']");
    const isFastrack = (await fastrackLocator.count().catch(() => 0)) > 0;

    if (isFastrack) {
      const profileName = (
        (await page
          .locator("#fastrack-div .profile__identity, .member__profile .profile__identity")
          .first()
          .textContent()
          .catch(() => "")) || ""
      ).trim();
      const profileHandle = (
        (await page
          .locator("#fastrack-div .profile__handle, .member__profile .profile__handle")
          .first()
          .textContent()
          .catch(() => "")) || ""
      ).trim();
      console.log(`[LinkedIn Runner] 🎯 Detected LinkedIn Fastrack / 'Welcome back' re-auth checkpoint (#fastrack-div)!`);
      if (profileName || profileHandle) {
        console.log(`[LinkedIn Runner] Fastrack profile identity: "${profileName}" (${profileHandle})`);
      }
    }

    // 2. Selectors for password input field
    const passwordSelectors = [
      "#fastrack-div input#password",
      "#fastrack-div input[name='session_password']",
      "form[action*='floe-profile-submit'] input#password",
      "form[action*='floe-profile-submit'] input[name='session_password']",
      "input#password",
      "input#session_password",
      "input[name='session_password']",
      "input[autocomplete*='password']",
      "input[type='password']",
      "input[name='password']",
      "input[data-cip-id='password']",
    ];

    let passwordInput: Locator | null = null;
    for (const sel of passwordSelectors) {
      const loc = page.locator(sel);
      if ((await loc.count().catch(() => 0)) > 0 && (await loc.first().isVisible().catch(() => false))) {
        passwordInput = loc.first();
        console.log(`[LinkedIn Runner] Found visible password field (${sel})`);
        break;
      }
    }

    // If no password input is visible, an account card, tile, or "Sign in" button might need to be clicked first
    if (!passwordInput) {
      const accountTiles = page.locator(
        ".member__profile, .profile__picture, .profile-card, button:has-text('Sign in'), a:has-text('Sign in'), button:has-text('Log in'), .account-card",
      );
      if ((await accountTiles.count().catch(() => 0)) > 0 && (await accountTiles.first().isVisible().catch(() => false))) {
        console.log("[LinkedIn Runner] Clicking account tile / profile card to reveal password prompt...");
        await accountTiles.first().click().catch(() => {});
        await page.waitForTimeout(1500);

        for (const sel of passwordSelectors) {
          const loc = page.locator(sel);
          if ((await loc.count().catch(() => 0)) > 0 && (await loc.first().isVisible().catch(() => false))) {
            passwordInput = loc.first();
            console.log(`[LinkedIn Runner] Password field revealed after tile click (${sel})`);
            break;
          }
        }
      }
    }

    if (!passwordInput) {
      console.log("[LinkedIn Runner] No password input field detected on current auth page.");
      return { success: false, reason: "No password input field visible" };
    }

    // 3. Username handling:
    // In Fastrack mode (#fastrack-div), the account session_key is already present as a hidden input.
    // Only check visible username inputs if NOT fastrack or if a visible username input is truly empty.
    if (!isFastrack) {
      const usernameSelectors = [
        "input#username",
        "input#session_key",
        "input[name='session_key']:not([type='hidden'])",
        "input[name='username']",
        "input[type='email']",
      ];

      const targetEmail =
        process.env.LINKEDIN_USERNAME || "mehdigolzari.official@gmail.com";

      for (const uSel of usernameSelectors) {
        const uLoc = page.locator(uSel);
        if ((await uLoc.count().catch(() => 0)) > 0 && (await uLoc.first().isVisible().catch(() => false))) {
          const val = (await uLoc.first().inputValue().catch(() => "")) || "";
          if (!val.trim()) {
            console.log(`[LinkedIn Runner] Filling username (${uSel}) with ${targetEmail}...`);
            await uLoc.first().fill(targetEmail).catch(() => {});
            await page.waitForTimeout(300);
          } else {
            console.log(`[LinkedIn Runner] Username field already populated: "${val}"`);
          }
          break;
        }
      }
    }

    // 4. Fill password with provided credential (environment variable or default)
    const password = process.env.LINKEDIN_PASSWORD || "Parissa.1370";
    console.log("[LinkedIn Runner] Entering LinkedIn password...");
    await passwordInput.scrollIntoViewIfNeeded().catch(() => {});
    await passwordInput.click().catch(() => {});
    await passwordInput.focus().catch(() => {});
    await passwordInput.fill("").catch(() => {});
    await page.waitForTimeout(150);
    await passwordInput.fill(password);
    await page.waitForTimeout(400);

    // 5. Submit form
    const submitSelectors = [
      "#fastrack-div button[data-litms-control-urn='login-submit']",
      "button[data-litms-control-urn='login-submit']",
      "form[action*='floe-profile-submit'] button[type='submit']",
      "#fastrack-div button[type='submit']",
      "button.btn__primary--large[type='submit']",
      "button.from__button--floating[type='submit']",
      "button#login-submit",
      "button[type='submit']",
      "button:has-text('Sign in')",
      "button:has-text('Log in')",
    ];

    let clicked = false;
    for (const subSel of submitSelectors) {
      const subLoc = page.locator(subSel);
      if ((await subLoc.count().catch(() => 0)) > 0 && (await subLoc.first().isVisible().catch(() => false))) {
        console.log(`[LinkedIn Runner] Clicking submit button (${subSel})...`);
        await subLoc.first().click().catch(() => {});
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.log("[LinkedIn Runner] Pressing Enter on password field...");
      await passwordInput.press("Enter").catch(() => {});
    }

    // 6. Resilient polling waiter for authentication response and redirect (up to 25s)
    console.log("[LinkedIn Runner] Awaiting authentication response and redirect (polling up to 25s)...");

    const maxWaitMs = 25000;
    const pollIntervalMs = 1200;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await page.waitForTimeout(pollIntervalMs);

      // Check A: Password error message displayed by LinkedIn
      const errorMsgLocator = page.locator(
        "#error-for-password:not(.hidden__imp), .form__label--error:not(.hidden__imp), div[error-for='password']:not(.hidden__imp)",
      );
      if ((await errorMsgLocator.count().catch(() => 0)) > 0) {
        const isErrVisible = await errorMsgLocator.first().isVisible().catch(() => false);
        if (isErrVisible) {
          const errText = ((await errorMsgLocator.first().textContent().catch(() => "")) || "").trim();
          if (errText) {
            console.error(`[LinkedIn Runner] ❌ Password login rejected by LinkedIn: "${errText}"`);
            return { success: false, reason: errText };
          }
        }
      }

      // Check B: Cookies in context for live session
      const cookies = await context.cookies(["https://www.linkedin.com", "https://linkedin.com"]);
      const hasLiveAuth = cookies.some((c) => c.name === "li_at" && c.value);

      const currentUrl = page.url();
      const fastrackStillVisible =
        (await page.locator("#fastrack-div").count().catch(() => 0)) > 0 &&
        (await page.locator("#fastrack-div").first().isVisible().catch(() => false));

      const isStillOnCheckpointForm =
        currentUrl.includes("/checkpoint/lg/floe-profile-submit") ||
        currentUrl.includes("/checkpoint/lg/login") ||
        fastrackStillVisible;

      // Check C: Authenticated UI indicators (feed, global nav, or post content)
      const hasNavOrFeed =
        (await page
          .locator(
            "#global-nav, .global-nav, .feed-shared-update-v2, nav[aria-label*='Primary' i], div[data-view-name*='feed']",
          )
          .count()
          .catch(() => 0)) > 0;

      if (hasLiveAuth && (!isStillOnCheckpointForm || hasNavOrFeed)) {
        console.log(`[LinkedIn Runner] 🎉 Automated password login successful! Current URL: ${currentUrl}`);

        // Automatically sync fresh cookies to database
        try {
          const freshCookies = await context.cookies();
          if (freshCookies && freshCookies.length > 0) {
            await saveLinkedInSession(
              { cookies: freshCookies },
              { name: "Mehdi Golzari 🔷️", headline: "LinkedIn Automated Session" },
            );
            console.log(
              `[LinkedIn Runner] Stored session database auto-synced with ${freshCookies.length} fresh cookies.`,
            );
          }
        } catch (saveErr: any) {
          console.warn("[LinkedIn Runner] Could not auto-sync cookies to database:", saveErr?.message);
        }

        return { success: true };
      }

      // Check D: Checkpoint / 2FA Challenge detected
      if (
        currentUrl.includes("/checkpoint/challenge/") ||
        currentUrl.includes("/challenge/") ||
        (await page.locator("input[name='pin'], input#input__email_verification_pin, #captcha-internal").count().catch(() => 0)) > 0
      ) {
        console.warn(`[LinkedIn Runner] LinkedIn presented a security checkpoint/2FA challenge: ${currentUrl}`);
        return { success: false, reason: "Security challenge or 2FA required" };
      }
    }

    // Final check after timeout: If li_at cookie is present, consider login successful
    const finalCookies = await context.cookies(["https://www.linkedin.com", "https://linkedin.com"]);
    const finalHasLiveAuth = finalCookies.some((c) => c.name === "li_at" && c.value);
    if (finalHasLiveAuth) {
      console.log("[LinkedIn Runner] 🎉 Session cookie li_at confirmed valid after submission!");
      try {
        const freshCookies = await context.cookies();
        await saveLinkedInSession(
          { cookies: freshCookies },
          { name: "Mehdi Golzari 🔷️", headline: "LinkedIn Automated Session" },
        );
      } catch (_) {}
      return { success: true };
    }

    console.warn(`[LinkedIn Runner] Login attempt completed but still on auth page (${page.url()})`);
    return { success: false, reason: `Still on login page: ${page.url()}` };
  } catch (err: any) {
    console.error("[LinkedIn Runner] Automated login attempt encountered error:", err);
    return { success: false, reason: err.message };
  }
}

/**
 * Checks if the browser is redirected to a login wall, authwall, or security checkpoint.
 * If so, attempts automated login fallback first; if that fails and not in headless mode,
 * keeps the browser open and waits for human interaction.
 */
async function ensureAuthenticatedOrWaitForLogin(
  page: Page,
  context: BrowserContext,
  profileDir: string,
  targetUrlToResume: string,
  isHeadless: boolean = false,
): Promise<boolean> {
  const currentUrl = page.url();
  const fastrackPresent =
    (await page.locator("#fastrack-div, form[action*='floe-profile-submit']").count().catch(() => 0)) > 0;

  const isAuthwall =
    currentUrl.includes("/login") ||
    currentUrl.includes("/checkpoint") ||
    currentUrl.includes("/uas/login") ||
    currentUrl.includes("/authwall") ||
    currentUrl.includes("challenge") ||
    fastrackPresent;

  if (!isAuthwall) {
    return true;
  }

  console.log(`[LinkedIn Runner] 🔑 Authwall/checkpoint detected at ${currentUrl} (fastrack DOM present: ${fastrackPresent}). Attempting automated login fallback...`);
  const autoLoginResult = await attemptAutomatedLogin(page, context);
  if (autoLoginResult.success) {
    const destination = targetUrlToResume || "https://www.linkedin.com/feed/";
    const currentAfterLogin = page.url();
    if (
      currentAfterLogin.includes("/checkpoint/") ||
      currentAfterLogin.includes("/login") ||
      (targetUrlToResume && currentAfterLogin !== targetUrlToResume)
    ) {
      console.log(`[LinkedIn Runner] Resuming navigation to target: ${destination}`);
      await page.goto(destination, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      }).catch((navErr) => console.warn(`[LinkedIn Runner] Post-login navigation note: ${navErr.message}`));
      await page.waitForTimeout(3500);
    }
    return true;
  }

  if (isHeadless) {
    console.error(
      `[LinkedIn Runner] ⚠️ Automated password login failed (${autoLoginResult.reason || "unknown reason"}), and browser is in headless mode. Please verify credentials or checkpoint.`,
    );
    return false;
  }

  console.warn("\n============================================================");
  console.warn("[LinkedIn Runner] ⚠️ LinkedIn requires authentication or checkpoint verification.");
  console.warn(`[LinkedIn Runner] Current URL: ${currentUrl}`);
  console.warn("[LinkedIn Runner] KEEPING BROWSER OPEN: Please log in or complete verification in the opened browser window.");
  console.warn("[LinkedIn Runner] Once you have logged in, the runner will automatically detect it and continue!");
  console.warn("============================================================\n");

  await page.bringToFront().catch(() => { });

  const continueMarkerPath = path.join(profileDir, ".continue-signal");
  if (fs.existsSync(continueMarkerPath)) {
    try {
      fs.unlinkSync(continueMarkerPath);
    } catch (_) { }
  }

  const maxWaitMs = 10 * 60 * 1000; // 10 minutes wait
  const pollIntervalMs = 2500;
  const startTime = Date.now();
  let loggedIn = false;

  while (Date.now() - startTime < maxWaitMs) {
    await page.waitForTimeout(pollIntervalMs);

    const signalTriggered = fs.existsSync(continueMarkerPath);
    if (signalTriggered) {
      try {
        fs.unlinkSync(continueMarkerPath);
      } catch (_) { }
      console.log("[LinkedIn Runner] Manual continue signal detected via .continue-signal.");
    }

    const liveUrl = page.url();
    const cookies = await context.cookies(["https://www.linkedin.com", "https://linkedin.com"]);
    const hasLiveAuth = cookies.some((c) => c.name === "li_at" && c.value);

    const isStillFastrack =
      (await page.locator("#fastrack-div").count().catch(() => 0)) > 0 &&
      (await page.locator("#fastrack-div").first().isVisible().catch(() => false));

    const isStillAuthwall =
      liveUrl.includes("/login") ||
      liveUrl.includes("/checkpoint/lg/login") ||
      liveUrl.includes("/uas/login") ||
      liveUrl.includes("/authwall") ||
      liveUrl.includes("challenge") ||
      isStillFastrack;

    if (hasLiveAuth && (!isStillAuthwall || signalTriggered)) {
      console.log(`[LinkedIn Runner] ✅ Login verified! (Active URL: ${liveUrl})`);
      loggedIn = true;

      // Automatically sync newly refreshed session cookies to the database
      try {
        const freshCookies = await context.cookies();
        if (freshCookies && freshCookies.length > 0) {
          await saveLinkedInSession(
            { cookies: freshCookies },
            { name: "Mehdi Golzari 🔷️", headline: "LinkedIn Automated Session" },
          );
          console.log(`[LinkedIn Runner] Stored session database auto-synced with ${freshCookies.length} fresh cookies.`);
        }
      } catch (syncErr: any) {
        console.warn("[LinkedIn Runner] Could not auto-sync cookies to database:", syncErr?.message);
      }

      break;
    }

    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    if (elapsedSec % 15 === 0) {
      console.log(`[LinkedIn Runner] Waiting for login in open browser... (${elapsedSec}s elapsed).`);
    }
  }

  if (!loggedIn) {
    console.error("[LinkedIn Runner] Login wait timed out (10 minutes).");
    return false;
  }

  // Once authenticated, navigate back to target URL if needed
  if (targetUrlToResume && page.url() !== targetUrlToResume) {
    console.log(`[LinkedIn Runner] Resuming navigation to: ${targetUrlToResume}`);
    await page.goto(targetUrlToResume, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(3500);
  }

  return true;
}

/**
 * Polls for up to timeoutMs (default 20s) until an element matching one of the selectors is visible and enabled.
 */
async function waitForVisibleElement(
  page: Page,
  selectors: string[],
  timeoutMs = 20000,
  scope?: Locator,
): Promise<Locator | null> {
  const startTime = Date.now();
  const root = scope || page;

  while (Date.now() - startTime < timeoutMs) {
    for (const sel of selectors) {
      const loc = root.locator(sel);
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const el = loc.nth(i);
        const isVis = await el.isVisible().catch(() => false);
        if (isVis) {
          const isEnabled = await el.isEnabled().catch(() => true);
          if (isEnabled) {
            return el;
          }
        }
      }
    }
    await page.waitForTimeout(500);
  }
  return null;
}

/**
 * 20-Second Waiter: Waits for all post and comment elements to load, handles dynamic SPA hydration,
 * activates the comment editor via triggers/placeholder pills, and ensures the contenteditable box is focused.
 */
async function waitForAndActivateCommentEditor(
  page: Page,
  options?: {
    scope?: Locator;
    timeoutMs?: number;
  },
): Promise<Locator | null> {
  const timeoutMs = options?.timeoutMs ?? 20000;
  const startTime = Date.now();
  const root = options?.scope || page;

  console.log(`[LinkedIn Runner] Starting 20-second waiter to load everything and locate comment editor...`);

  // Wait for initial DOM readiness
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const activeEditorSelectors = [
    "div[data-testid='ui-core-tiptap-text-editor-wrapper'] [contenteditable='true']",
    "div[role='textbox'][aria-label*='Text editor for creating comment' i]",
    "div[aria-label='Text editor for creating comment']",
    "div.tiptap.ProseMirror[contenteditable='true']",
    "div.comments-comment-box__editor",
    "div.ql-editor[contenteditable='true']",
    "div[role='textbox'][contenteditable='true']",
    "div.editor-content [contenteditable='true']",
    "div.comments-comment-texteditor [contenteditable='true']",
    "div[data-placeholder*='comment' i][contenteditable='true']",
    "div[aria-label*='comment' i][contenteditable='true']",
    "div[aria-label*='Add a comment' i][contenteditable='true']",
    "div.comments-comment-box div[contenteditable='true']",
    "div[contenteditable='true']",
  ];

  const triggerSelectors = [
    // Live LinkedIn Comment button (from actual DOM)
    "button[aria-label='Comment']",
    "button:has(svg#comment-small)",
    "button:has(svg[data-token-id='202'])",
    "button[componentkey='c5d0dc04-d2cd-4d2a-aea4-af8da44ed609']",
    // Placeholder pill / input boxes
    "div[data-testid='ui-core-tiptap-text-editor-wrapper']",
    "p[data-placeholder='Add a comment...']",
    "div.comments-comment-box__form-container",
    "div.comments-comment-box__input",
    "div.comments-comment-box",
    "div.comments-comment-texteditor",
    "button:has-text('Add a comment')",
    "button[aria-label*='Add a comment' i]",
    "div.editor-content",
    "p.placeholder",
    "div[data-placeholder*='comment' i]",
    // Comment action buttons in social action bar
    "button.comment-button",
    "button[aria-label*='Comment' i]:not([aria-label*='count' i]):not([aria-label*='comments' i])",
    "button[aria-label*='Leave a comment' i]",
    "button.feed-shared-social-action-bar__action-button:has-text('Comment')",
    ".feed-shared-social-actions button:has-text('Comment')",
    ".social-actions-bar button:has-text('Comment')",
    "button:has(svg[data-test-icon*='comment'])",
    "button:has(li-icon[type*='comment'])",
    "button.artdeco-button:has-text('Comment')",
  ];

  let iteration = 0;
  while (Date.now() - startTime < timeoutMs) {
    iteration++;

    // 1. Check if any active contenteditable editor is already visible and interactable
    for (const sel of activeEditorSelectors) {
      const loc = root.locator(sel);
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const el = loc.nth(i);
        const isVis = await el.isVisible().catch(() => false);
        if (isVis) {
          console.log(`[LinkedIn Runner] ✅ Found visible active editor (${sel}) on iteration ${iteration}! Focusing...`);
          await el.scrollIntoViewIfNeeded().catch(() => {});
          await page.evaluate(() => window.scrollBy(0, -90));
          await el.focus().catch(() => {});
          await el.click({ force: true }).catch(() => {});
          const box = await el.boundingBox().catch(() => null);
          if (box) {
            await page.mouse.click(box.x + Math.min(box.width / 2, 40), box.y + box.height / 2).catch(() => {});
          }
          await page.waitForTimeout(500);
          return el;
        }
      }
    }

    // 2. Check if a comment trigger (placeholder or Comment button) is visible
    for (const trigSel of triggerSelectors) {
      const trigLoc = root.locator(trigSel);
      const count = await trigLoc.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const el = trigLoc.nth(i);
        const isVis = await el.isVisible().catch(() => false);
        if (isVis) {
          console.log(`[LinkedIn Runner] Found visible comment trigger (${trigSel}). Clicking to mount editor...`);
          await el.scrollIntoViewIfNeeded().catch(() => {});
          await page.evaluate(() => window.scrollBy(0, -90));
          await el.click({ force: true }).catch(() => {});
          await page.waitForTimeout(1200);

          // Check immediately for active editor after clicking trigger
          for (const sel of activeEditorSelectors) {
            const loc = root.locator(sel);
            const editorCount = await loc.count().catch(() => 0);
            for (let j = 0; j < editorCount; j++) {
              const editorEl = loc.nth(j);
              if (await editorEl.isVisible().catch(() => false)) {
                console.log(`[LinkedIn Runner] ✅ Editor active after trigger click (${sel})!`);
                await editorEl.scrollIntoViewIfNeeded().catch(() => {});
                await page.evaluate(() => window.scrollBy(0, -90));
                await editorEl.focus().catch(() => {});
                await editorEl.click({ force: true }).catch(() => {});
                const box = await editorEl.boundingBox().catch(() => null);
                if (box) {
                  await page.mouse.click(box.x + Math.min(box.width / 2, 40), box.y + box.height / 2).catch(() => {});
                }
                await page.waitForTimeout(500);
                return editorEl;
              }
            }
          }
        }
      }
    }

    // 3. Scroll down slightly to trigger lazy-loaded below-the-fold elements
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`[LinkedIn Runner] Waiting for post and comment components to load... (${elapsed}s / 20s elapsed)`);
    await page.evaluate(() => window.scrollBy(0, 200)).catch(() => {});
    await page.waitForTimeout(1000);
  }

  console.warn(`[LinkedIn Runner] 20-second waiter expired without locating comment editor.`);
  return null;
}

export interface ExtractProfileArchiveResult {
  success: boolean;
  message: string;
  archivePath?: string;
  targetDir?: string;
  fileCount?: number;
  hasDefaultProfile?: boolean;
  cookiesFound?: number;
  error?: string;
}

export interface ProfileStatusResult {
  hasArchive: boolean;
  archivePath?: string;
  archiveName?: string;
  archiveSizeBytes?: number;
  archiveSizeFormatted?: string;
  archiveType?: "zip" | "tar.gz";
  hasExtracted: boolean;
  profileDir?: string;
  hasDefaultProfile: boolean;
  extractedFileCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Helper to recursively locate the directory containing the 'Default' profile directory
 * (handles cases where a profile was zipped with or without a root folder, up to maxDepth).
 */
export function findChromiumProfileRoot(baseDir: string, maxDepth: number = 3): string {
  if (fs.existsSync(path.join(baseDir, "Default"))) {
    return baseDir;
  }

  function search(currentDir: string, currentDepth: number): string | null {
    if (currentDepth > maxDepth) return null;
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const cand = path.join(currentDir, entry.name);
          if (fs.existsSync(path.join(cand, "Default"))) {
            return cand;
          }
          const nested = search(cand, currentDepth + 1);
          if (nested) return nested;
        }
      }
    } catch (_) {}
    return null;
  }

  const found = search(baseDir, 1);
  return found || baseDir;
}

/**
 * Counts regular files recursively in a directory
 */
export function countFilesRecursively(dir: string): number {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) count++;
      else if (entry.isDirectory()) count += countFilesRecursively(path.join(dir, entry.name));
    }
  } catch (_) {}
  return count;
}

/**
 * Scan for archive files (.zip, .tar.gz, .tgz) in storage and data directories
 */
export function getProfileArchiveCandidates(): Array<{
  path: string;
  name: string;
  isZip: boolean;
  sizeBytes: number;
}> {
  const searchDirectories = [
    path.resolve("/app/data"),
    path.resolve(process.cwd(), "data"),
    process.cwd(),
  ];

  const candidates: Array<{ path: string; name: string; isZip: boolean; sizeBytes: number }> = [];
  const seenPaths = new Set<string>();

  for (const sDir of searchDirectories) {
    if (!fs.existsSync(sDir)) continue;

    const specificNames = [
      "linkedin-profile-cache.zip",
      "profile.zip",
      ".linkedin-profile-cache.zip",
      "linkedin-cache.zip",
      "linkedin-profile-cache.tar.gz",
      "profile.tar.gz",
    ];

    for (const name of specificNames) {
      const candPath = path.join(sDir, name);
      if (fs.existsSync(candPath) && !seenPaths.has(candPath)) {
        seenPaths.add(candPath);
        try {
          const stat = fs.statSync(candPath);
          candidates.push({
            path: candPath,
            name,
            isZip: candPath.endsWith(".zip"),
            sizeBytes: stat.size,
          });
        } catch (_) {}
      }
    }

    try {
      const files = fs.readdirSync(sDir);
      for (const file of files) {
        const fullP = path.join(sDir, file);
        if (seenPaths.has(fullP)) continue;
        if (file.endsWith(".zip")) {
          seenPaths.add(fullP);
          const stat = fs.statSync(fullP);
          candidates.push({ path: fullP, name: file, isZip: true, sizeBytes: stat.size });
        } else if (file.endsWith(".tar.gz") || file.endsWith(".tgz")) {
          seenPaths.add(fullP);
          const stat = fs.statSync(fullP);
          candidates.push({ path: fullP, name: file, isZip: false, sizeBytes: stat.size });
        }
      }
    } catch (_) {}
  }

  return candidates;
}

/**
 * Completely wipes all files and subdirectories inside a directory.
 * Ensures no stale lock files, obsolete session cookies, or corrupted cache remain before extraction.
 */
export function cleanDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  console.log(`[LinkedIn Runner] 🧹 Cleaning directory completely: ${dir}`);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (rmErr: any) {
    console.warn(
      `[LinkedIn Runner] fs.rmSync warning for ${dir}: ${rmErr?.message}. Deleting individual entries...`,
    );
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } catch (itemErr: any) {
          console.warn(`[LinkedIn Runner] Could not remove ${itemPath}:`, itemErr?.message);
        }
      }
    } catch (_) {}
  }

  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Cross-platform archive extraction logic
 */
export function executeArchiveExtraction(archivePath: string, targetDir: string): void {
  // Always wipe destination directory clean before unpacking
  cleanDirectory(targetDir);

  const isZip = archivePath.endsWith(".zip");
  const isWindows = process.platform === "win32";

  if (isZip) {
    if (isWindows) {
      try {
        child_process.execSync(`tar.exe -xf "${archivePath}" -C "${targetDir}"`, {
          stdio: "pipe",
        });
        return;
      } catch (tarErr) {
        console.warn(
          "[LinkedIn Runner] Windows tar.exe failed for zip, falling back to PowerShell Expand-Archive:",
          tarErr,
        );
      }

      child_process.execSync(
        `powershell -NoProfile -NonInteractive -Command "Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${targetDir}' -Force"`,
        { stdio: "inherit" },
      );
    } else {
      // Linux / Debian Container
      try {
        child_process.execSync(`unzip -q -o "${archivePath}" -d "${targetDir}"`, {
          stdio: "pipe",
        });
        return;
      } catch (unzipErr) {
        console.warn("[LinkedIn Runner] unzip failed, falling back to tar -xf:", unzipErr);
      }

      child_process.execSync(`tar -xf "${archivePath}" -C "${targetDir}"`, {
        stdio: "inherit",
      });
    }
  } else {
    // .tar.gz or .tgz
    const cmd = isWindows ? "tar.exe" : "tar";
    child_process.execSync(`${cmd} -xzf "${archivePath}" -C "${targetDir}"`, {
      stdio: "inherit",
    });
  }
}

/**
 * Checks current profile status (both storage archive and extracted local cache).
 */
export function hasProfileArchiveOrExtracted(): ProfileStatusResult {
  const archives = getProfileArchiveCandidates();
  const bestArchive = archives.length > 0 ? archives[0] : null;

  const checkDirs = [
    process.env.LINKEDIN_PROFILE_DIR,
    path.join(os.tmpdir(), ".linkedin-profile-cache"),
    path.resolve(process.cwd(), ".linkedin-profile-cache"),
    path.resolve("/app/.linkedin-profile-cache"),
  ].filter(Boolean) as string[];

  let extractedDir: string | undefined;
  let hasDefault = false;
  let fileCount = 0;

  for (const dir of checkDirs) {
    if (fs.existsSync(dir)) {
      const root = findChromiumProfileRoot(dir);
      if (fs.existsSync(path.join(root, "Default"))) {
        extractedDir = root;
        hasDefault = true;
        fileCount = countFilesRecursively(root);
        break;
      }
    }
  }

  return {
    hasArchive: Boolean(bestArchive),
    archivePath: bestArchive?.path,
    archiveName: bestArchive?.name,
    archiveSizeBytes: bestArchive?.sizeBytes,
    archiveSizeFormatted: bestArchive ? formatBytes(bestArchive.sizeBytes) : undefined,
    archiveType: bestArchive ? (bestArchive.isZip ? "zip" : "tar.gz") : undefined,
    hasExtracted: Boolean(extractedDir && hasDefault),
    profileDir: extractedDir,
    hasDefaultProfile: hasDefault,
    extractedFileCount: fileCount,
  };
}

/**
 * Manually forces extraction of the profile archive into the active Chromium cache directory.
 * If archiveBuffer is provided, writes it first to persistent storage.
 */
export async function forceExtractProfileArchive(options?: {
  archiveBuffer?: Buffer;
  filename?: string;
}): Promise<ExtractProfileArchiveResult> {
  try {
    let archivePath: string | undefined;

    // 1. If buffer provided (uploaded from UI), clean previous archives in storage then save new one
    if (options?.archiveBuffer && options.archiveBuffer.length > 0) {
      const filename = options.filename || "linkedin-profile-cache.zip";
      const targetStorageDirs = [
        path.resolve("/app/data"),
        path.resolve(process.cwd(), "data"),
      ];

      // Remove any prior archives from storage before saving replacement
      const oldArchiveNames = [
        "linkedin-profile-cache.zip",
        "profile.zip",
        ".linkedin-profile-cache.zip",
        "linkedin-cache.zip",
        "linkedin-profile-cache.tar.gz",
        "profile.tar.gz",
      ];

      for (const sDir of targetStorageDirs) {
        if (!fs.existsSync(sDir)) continue;
        for (const oldName of oldArchiveNames) {
          const oldPath = path.join(sDir, oldName);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
              console.log(`[LinkedIn Runner] 🗑️ Removed previous archive: ${oldPath}`);
            } catch (err: any) {
              console.warn(`[LinkedIn Runner] Could not remove old archive ${oldPath}:`, err?.message);
            }
          }
        }
      }

      for (const sDir of targetStorageDirs) {
        try {
          fs.mkdirSync(sDir, { recursive: true });
          const savePath = path.join(sDir, filename);
          fs.writeFileSync(savePath, options.archiveBuffer);
          console.log(
            `[LinkedIn Runner] Saved uploaded archive to ${savePath} (${formatBytes(options.archiveBuffer.length)})`,
          );
          if (!archivePath) {
            archivePath = savePath;
          }
        } catch (err: any) {
          console.warn(`[LinkedIn Runner] Could not write archive to ${sDir}:`, err?.message);
        }
      }
    }

    // 2. If no buffer provided, locate candidate archive in storage
    if (!archivePath) {
      const candidates = getProfileArchiveCandidates();
      if (candidates.length === 0) {
        return {
          success: false,
          message:
            "No profile archive (.zip or .tar.gz) found in /app/data or ./data. Please upload a profile ZIP first.",
          error: "Archive not found",
        };
      }
      archivePath = candidates[0].path;
    }

    // 3. Determine target extraction directory and completely wipe any previous cache
    const targetDir =
      process.env.LINKEDIN_PROFILE_DIR ||
      (process.platform === "linux"
        ? path.join(os.tmpdir(), ".linkedin-profile-cache")
        : path.resolve(process.cwd(), ".linkedin-profile-cache"));

    console.log(`[LinkedIn Runner] 🧹 Cleaning target directory before extraction: ${targetDir}`);
    cleanDirectory(targetDir);

    // Also clean /tmp cache if targetDir is different
    const tmpCache = path.join(os.tmpdir(), ".linkedin-profile-cache");
    if (targetDir !== tmpCache && fs.existsSync(tmpCache)) {
      cleanDirectory(tmpCache);
    }

    console.log(`[LinkedIn Runner] Extracting profile archive ${archivePath} into ${targetDir}...`);
    executeArchiveExtraction(archivePath, targetDir);

    // 4. Verify Chromium profile directory
    const profileRoot = findChromiumProfileRoot(targetDir);
    const hasDefault = fs.existsSync(path.join(profileRoot, "Default"));
    const fileCount = countFilesRecursively(profileRoot);

    console.log(
      `[LinkedIn Runner] Extraction complete. Profile root: ${profileRoot} (Default folder: ${hasDefault}, files: ${fileCount})`,
    );

    // 5. Fast non-blocking Playwright check to read and sync cookies into db.json
    let cookiesFound = 0;
    try {
      const { chromium } = await import("playwright");
      const executablePath =
        process.env.CHROMIUM_PATH ||
        (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

      const inspectionContext = await chromium.launchPersistentContext(profileRoot, {
        executablePath,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        timeout: 10000,
      });

      const cookies = await inspectionContext.cookies([
        "https://www.linkedin.com",
        "https://linkedin.com",
      ]);
      cookiesFound = cookies.length;
      const hasLiAt = cookies.some((c) => c.name === "li_at" && c.value);

      if (hasLiAt) {
        await saveLinkedInSession(
          { cookies },
          { name: "LinkedIn (Extracted Profile)", headline: "Browser Cache Session" },
        );
        console.log(
          `[LinkedIn Runner] ✅ Synchronized ${cookies.length} active session cookies to database.`,
        );
      }

      await inspectionContext.close().catch(() => {});
    } catch (inspectErr: any) {
      console.log(
        `[LinkedIn Runner] Note during post-extraction cookie inspection: ${inspectErr?.message}`,
      );
    }

    return {
      success: true,
      message: `Profile archive (${path.basename(archivePath)}) extracted successfully to ${profileRoot}. Found ${fileCount} files in Chromium profile ${hasDefault ? "(Default directory present)" : ""}. ${cookiesFound > 0 ? `${cookiesFound} cookies synced to database.` : ""}`,
      archivePath,
      targetDir: profileRoot,
      fileCount,
      hasDefaultProfile: hasDefault,
      cookiesFound,
    };
  } catch (error: any) {
    console.error("[LinkedIn Runner] Extraction failed:", error);
    return {
      success: false,
      message: `Failed to extract profile archive: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Resolves or bootstraps the persistent Chromium profile directory.
 */
export function resolveAndBootstrapProfileDir(): string {
  if (process.env.LINKEDIN_PROFILE_DIR && fs.existsSync(process.env.LINKEDIN_PROFILE_DIR)) {
    return findChromiumProfileRoot(process.env.LINKEDIN_PROFILE_DIR);
  }

  // 1. Local project development path
  const localProjectCache = path.resolve(process.cwd(), ".linkedin-profile-cache");
  if (fs.existsSync(path.join(localProjectCache, "Default"))) {
    return localProjectCache;
  }

  // 2. Production container ephemeral directory (/tmp/.linkedin-profile-cache)
  const tmpProfileDir = path.join(os.tmpdir(), ".linkedin-profile-cache");
  if (fs.existsSync(path.join(tmpProfileDir, "Default"))) {
    return tmpProfileDir;
  }

  if (fs.existsSync(tmpProfileDir)) {
    const foundRoot = findChromiumProfileRoot(tmpProfileDir);
    if (fs.existsSync(path.join(foundRoot, "Default"))) {
      return foundRoot;
    }
  }

  // 3. Auto-extract from archive candidates in storage
  const candidates = getProfileArchiveCandidates();
  for (const archive of candidates) {
    console.log(
      `[LinkedIn Runner] Auto-bootstrapping profile from archive: ${archive.path} (${formatBytes(archive.sizeBytes)})`,
    );
    try {
      executeArchiveExtraction(archive.path, tmpProfileDir);
      const extractedRoot = findChromiumProfileRoot(tmpProfileDir);
      if (fs.existsSync(path.join(extractedRoot, "Default"))) {
        console.log(`[LinkedIn Runner] ✅ Successfully bootstrapped profile cache to ${extractedRoot}`);
        return extractedRoot;
      }
    } catch (extractErr: any) {
      console.error(
        `[LinkedIn Runner] Auto-bootstrap extraction failed for ${archive.path}:`,
        extractErr?.message,
      );
    }
  }

  // 4. Container-baked profile cache fallback
  const containerFallback = path.resolve("/app/.linkedin-profile-cache");
  if (fs.existsSync(path.join(containerFallback, "Default"))) {
    console.log(`[LinkedIn Runner] Using container-baked profile cache at ${containerFallback}`);
    return containerFallback;
  }

  if (!fs.existsSync(localProjectCache)) {
    fs.mkdirSync(localProjectCache, { recursive: true });
  }
  return localProjectCache;
}

/**
 * Main Autonomous LinkedIn Feed Scanner & CTO Engagement Engine
 */
export async function executeLinkedInFeedEngagement(options: {
  dryRun?: boolean;
  showBrowser?: boolean;
  skipDailyLimit?: boolean;
  useImportedSession?: boolean;
}): Promise<LinkedInRunResult> {
  console.log("=== STARTING AUTONOMOUS LINKEDIN SEARCH ENGAGEMENT RUN ===");

  // 1. Validate Session & Profile State
  const config = await getLinkedInConfig();
  const hasStoredCookies = Boolean(
    config.sessionState?.cookies && config.sessionState.cookies.length > 0,
  );
  const profileStatus = hasProfileArchiveOrExtracted();
  const hasProfileOrFallback =
    profileStatus.hasExtracted ||
    profileStatus.hasArchive ||
    Boolean(process.env.LINKEDIN_PASSWORD);

  if (!hasStoredCookies && !hasProfileOrFallback) {
    const errorMsg =
      "No valid LinkedIn session found. Please export and upload session JSON or upload a profile ZIP from the admin UI.";
    console.error(`[LinkedIn Runner] ${errorMsg}`);
    const log = await addLinkedInEngagementLog({
      authorName: "System",
      postUrl: "https://www.linkedin.com/search/results/content/",
      postSnippet: "Session check failed",
      relevanceScore: 0,
      relevanceReason: errorMsg,
      status: "failed",
      error: errorMsg,
    });
    return { success: false, status: "failed", error: errorMsg, log };
  }

  if (!hasStoredCookies && hasProfileOrFallback) {
    console.log(
      `[LinkedIn Runner] No JSON session stored in db, but found valid browser profile (${profileStatus.hasExtracted ? "Extracted cache" : "Archive in storage"}). Launching persistent context...`,
    );
  }

  // 2. Check Daily Outreach Quota (Max 2 per day for human safety)
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentPublished = (config.logs || []).filter(
    (l) => l.status === "published" && new Date(l.timestamp).getTime() > twentyFourHoursAgo,
  );

  const maxPerDay = config.schedule?.maxPerDay ?? 2;
  if (recentPublished.length >= maxPerDay && !options.skipDailyLimit && !options.dryRun) {
    const reason = `Daily LinkedIn engagement limit reached (${recentPublished.length}/${maxPerDay} published in last 24h). Skipping run.`;
    console.log(`[LinkedIn Runner] ${reason}`);
    const log = await addLinkedInEngagementLog({
      authorName: "System",
      postUrl: "https://www.linkedin.com/search/results/content/",
      postSnippet: "Daily limit check",
      relevanceScore: 0,
      relevanceReason: reason,
      status: "skipped",
    });
    return { success: true, status: "skipped", reason, log };
  }

  if (options.skipDailyLimit || options.dryRun) {
    console.log(
      `[LinkedIn Runner] Manual / Dry Run trigger active: Bypassing daily count limitation (${recentPublished.length}/${maxPerDay} published in last 24h).`,
    );
  }

  let context: BrowserContext | null = null;
  let page: Page | null = null;
  let trendDiscovery: TrendingLinkedInQuery | null = null;
  let selectedTopic = DEFAULT_FALLBACK_TOPIC;

  try {
    // 3. Launch Persistent Chromium Profile (Retains all browser state natively on disk)
    const PROFILE_DIR = resolveAndBootstrapProfileDir();
    const isHeadless = options.showBrowser ? false : process.env.LINKEDIN_HEADLESS !== "false";
    const executablePath =
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

    console.log(
      `[LinkedIn Runner] Launching persistent browser profile in ${PROFILE_DIR} (headless: ${isHeadless}, executable: ${executablePath || "default"})...`,
    );

    const { chromium } = await import("playwright");

    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      executablePath,
      headless: isHeadless,
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-infobars",
        "--window-size=1440,900",
        "--ignore-certificate-errors",
      ],
    });

    // Grant clipboard permissions for post link resolution
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => { });

    page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    // Anti-detection navigator properties
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    // Check if imported session injection is explicitly requested or needed for fresh initial bootstrap
    const seedMarkerPath = path.join(PROFILE_DIR, ".last-seed.txt");
    const isFirstBootstrap = !fs.existsSync(seedMarkerPath);

    const currentCookies = await context.cookies(["https://www.linkedin.com", "https://linkedin.com"]);
    const hasLiveAuth = currentCookies.some((c) => c.name === "li_at" && c.value);

    // Only inject session JSON if explicitly requested by the user, or if this is the very first setup with 0 cookies
    const shouldInjectSession = Boolean(
      options.useImportedSession || (isFirstBootstrap && !hasLiveAuth && config.sessionState?.cookies?.length),
    );

    if (shouldInjectSession) {
      if (config.sessionState?.cookies?.length) {
        console.log(
          `[LinkedIn Runner] ${options.useImportedSession ? "User requested manual re-injection" : "Initial bootstrap"}: Injecting imported session (${config.sessionState.cookies.length} cookies) into persistent profile...`,
        );
        const cleanCookies = extractAndFormatLinkedInCookies(config.sessionState.cookies);
        await context.addCookies(cleanCookies);
        try {
          fs.writeFileSync(seedMarkerPath, new Date().toISOString(), "utf8");
          console.log("[LinkedIn Runner] Imported session successfully injected into persistent profile.");
        } catch (mErr) {
          console.warn("[LinkedIn Runner] Could not write seed marker:", mErr);
        }
      } else {
        console.warn("[LinkedIn Runner] 'Start with imported session' requested, but no cookies found in database.");
      }
    } else {
      console.log(
        `[LinkedIn Runner] Preserving active persistent browser profile (${currentCookies.length} active cookies on disk). Imported session JSON injection skipped.`,
      );
    }

    // 4. Discover Live Tech Trends via Google Search Grounding & Navigate to Content Search
    console.log("[LinkedIn Runner] Scouting live tech trends via Google Search Grounding...");
    try {
      trendDiscovery = await discoverTrendingLinkedInSearchQuery();
    } catch (discoveryErr: any) {
      console.warn("[LinkedIn Runner] Trend discovery failed, using fallback:", discoveryErr.message);
      trendDiscovery = {
        query: DEFAULT_FALLBACK_TOPIC,
        sourceTrend: "AI agent production reliability and LLM orchestration challenges",
        relevanceAngle: "Early-stage founders need senior engineering guidance to prevent high token spend",
      };
    }

    selectedTopic = trendDiscovery.query;
    console.log(`[LinkedIn Runner] Discovered Live Trend: "${trendDiscovery.sourceTrend}"`);
    console.log(`[LinkedIn Runner] Strategic Relevance Angle: "${trendDiscovery.relevanceAngle}"`);
    console.log(`[LinkedIn Runner] Target Search Query: "${selectedTopic}"`);

    // 4. Navigate & Scout Candidate Posts with Best-Practice Relevance & Time Filtering
    let effectiveSearchUrl = "";
    let rawCandidates: Array<{
      domIndex: number;
      authorName: string;
      authorHeadline: string;
      postText: string;
      postUrl: string;
      activityUrn?: string;
      reactionsCount: number;
      commentsCount: number;
    }> = [];

    // Prioritize time windows that allow posts to accumulate genuine engagement (>0 likes/comments)
    const searchQueriesToTry = [
      { query: selectedTopic, window: "past-week" as const },
      { query: selectedTopic, window: "past-month" as const },
      { query: selectedTopic, window: "past-24h" as const },
      { query: "AI agents in production", window: "past-week" as const },
      { query: "SaaS architecture lessons", window: "past-week" as const },
      { query: "scaling Postgres database", window: "past-month" as const },
      { query: "Fractional CTO SaaS", window: "past-week" as const },
    ];

    for (const searchAttempt of searchQueriesToTry) {
      effectiveSearchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(
        searchAttempt.query,
      )}&datePosted=%22${searchAttempt.window}%22`;

      console.log(
        `[LinkedIn Runner] Scouting LinkedIn content search (query: "${searchAttempt.query}", window: ${searchAttempt.window})...`,
      );
      console.log(`[LinkedIn Runner] Navigating to: ${effectiveSearchUrl}`);

      await page.goto(effectiveSearchUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      await page.waitForTimeout(3500);

      const isSearchAuthenticated = await ensureAuthenticatedOrWaitForLogin(
        page,
        context,
        PROFILE_DIR,
        effectiveSearchUrl,
        isHeadless,
      );

      if (!isSearchAuthenticated) {
        const errorMsg =
          "LinkedIn requires login or verification. Please run with 'Show browser window' enabled and complete login.";
        console.error(`[LinkedIn Runner] ${errorMsg}`);
        const log = await addLinkedInEngagementLog({
          authorName: "System",
          postUrl: page.url(),
          postSnippet: "Session authentication checkpoint timed out",
          searchQuery: searchAttempt.query,
          sourceTrend: trendDiscovery.sourceTrend,
          relevanceAngle: trendDiscovery.relevanceAngle,
          relevanceScore: 0,
          relevanceReason: errorMsg,
          status: "failed",
          error: errorMsg,
        });
        return { success: false, status: "failed", error: errorMsg, log };
      }

      // Scroll to load dynamic posts
      console.log("[LinkedIn Runner] Scrolling search feed to load candidate posts...");
      await page.evaluate(async () => {
        for (let i = 0; i < 3; i++) {
          window.scrollBy(0, 750);
          await new Promise((r) => setTimeout(r, 650));
        }
      });
      await page.waitForTimeout(1000);

      // Expand post previews
      console.log("[LinkedIn Runner] Expanding post previews...");
      const moreButtons = page.locator(
        "button:has-text('more'), button[aria-label*='more' i], button.feed-shared-inline-show-more-text__button",
      );
      const moreCount = await moreButtons.count();
      for (let i = 0; i < Math.min(moreCount, 8); i++) {
        await moreButtons.nth(i).click().catch(() => { });
      }
      await page.waitForTimeout(800);

      // Extract and pre-filter candidates
      console.log("[LinkedIn Runner] Extracting candidate posts from search results...");
      rawCandidates = await page.evaluate(() => {
        const results: Array<{
          domIndex: number;
          authorName: string;
          authorHeadline: string;
          postText: string;
          postUrl: string;
          activityUrn?: string;
          reactionsCount: number;
          commentsCount: number;
        }> = [];

        const rawElements = Array.from(
          document.querySelectorAll(
            "li.reusable-search__result-container, div.feed-shared-update-v2, div[data-view-name='search-entity-result-universal-template'], div[role='listitem'], div[data-chameleon-result-urn]",
          ),
        );

        const postElements = rawElements.filter((el) => {
          const hasAuthor = Boolean(el.querySelector("a[href*='/in/']"));
          const hasText = Boolean(el.textContent && el.textContent.length > 50);
          return hasAuthor && hasText;
        });

        for (let idx = 0; idx < postElements.length; idx++) {
          const el = postElements[idx];
          const fullText = (el as HTMLElement).innerText || el.textContent || "";
          const lowerText = fullText.toLowerCase();

          // 1. Strict Recruiting & Job Filter
          const isRecruiting =
            lowerText.includes("promoted") ||
            lowerText.includes("sponsored") ||
            lowerText.includes("hiring") ||
            lowerText.includes("we're hiring") ||
            lowerText.includes("we are hiring") ||
            lowerText.includes("job opening") ||
            lowerText.includes("job vacancy") ||
            lowerText.includes("open position") ||
            lowerText.includes("open role") ||
            lowerText.includes("send your cv") ||
            lowerText.includes("send cv") ||
            lowerText.includes("apply now") ||
            lowerText.includes("apply here") ||
            lowerText.includes("join our team") ||
            lowerText.includes("#job") ||
            lowerText.includes("#hiring") ||
            lowerText.includes("#recruitment");

          if (isRecruiting) continue;

          // 2. Strict Self-Promotion, Book Launch, Course & Lead-Magnet Filter
          const isSelfPromoOrProduct =
            lowerText.includes("my first book") ||
            lowerText.includes("my book") ||
            lowerText.includes("book is now live") ||
            lowerText.includes("book is live") ||
            lowerText.includes("book is out") ||
            lowerText.includes("on amazon") ||
            lowerText.includes("order your copy") ||
            lowerText.includes("pre-order") ||
            lowerText.includes("buy on amazon") ||
            lowerText.includes("kindle edition") ||
            lowerText.includes("my new course") ||
            lowerText.includes("enroll now") ||
            lowerText.includes("discount code") ||
            lowerText.includes("coupon code") ||
            lowerText.includes("free webinar") ||
            lowerText.includes("register for the webinar") ||
            lowerText.includes("subscribe to my newsletter") ||
            lowerText.includes("link in bio") ||
            lowerText.includes("link in comments") ||
            lowerText.includes("comment below to receive") ||
            lowerText.includes("comment below to get") ||
            lowerText.includes("drop your email");

          if (isSelfPromoOrProduct) continue;

          const lines = fullText
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

          // Author Name & Headline
          const authorLink = el.querySelector("a[href*='/in/']") as HTMLAnchorElement | null;
          const authorName =
            el.querySelector(".update-components-actor__name")?.textContent?.trim().replace(/\s+/g, " ") ||
            authorLink?.textContent?.trim().replace(/\s+/g, " ") ||
            lines[1] ||
            "LinkedIn Member";

          const headlineEl = el.querySelector(".update-components-actor__description, .entity-result__primary-subtitle");
          const authorHeadline =
            headlineEl?.textContent?.trim().replace(/\s+/g, " ") ||
            lines.slice(2, 5).join(" | ").slice(0, 150);
          const lowerHeadline = authorHeadline.toLowerCase();

          // 3. Strict Recruiter/Author Profile Filter
          if (
            lowerHeadline.includes("author of") ||
            lowerHeadline.includes("recruiter") ||
            lowerHeadline.includes("recruitment") ||
            lowerHeadline.includes("talent acquisition") ||
            lowerHeadline.includes("headhunter") ||
            lowerHeadline.includes("staffing") ||
            lowerHeadline.includes("human resources") ||
            lowerHeadline.includes("hr-recruiter") ||
            lowerHeadline.includes("hr manager") ||
            lowerHeadline.includes("people partner")
          ) {
            continue;
          }

          // 4. Post Text Extraction: Prioritize dedicated text containers
          const textContainer = el.querySelector(
            ".feed-shared-update-v2__description, .update-components-text, .feed-shared-inline-show-more-text, .entity-result__content-summary",
          ) as HTMLElement | null;

          let postText = "";
          if (textContainer && textContainer.innerText && textContainer.innerText.trim().length > 40) {
            postText = textContainer.innerText.trim();
          } else {
            const textIndex = lines.findIndex(
              (l) => l.includes("•") || l.toLowerCase() === "follow" || l.toLowerCase() === "join",
            );
            postText = (textIndex !== -1 ? lines.slice(textIndex + 1) : lines.slice(4))
              .filter(
                (l) =>
                  !l.toLowerCase().includes("reaction") &&
                  !l.toLowerCase().includes("repost") &&
                  !l.toLowerCase().includes("comment") &&
                  !l.toLowerCase().includes("show translation") &&
                  !l.toLowerCase().includes("send privately"),
              )
              .join("\n");
          }

          postText = postText.replace(/\s+/g, " ").slice(0, 1500).trim();
          if (postText.length < 60) continue;

          // 5. Engagement Metrics Extraction (Likes/Reactions and Comments)
          let reactionsCount = 0;
          const reactionsEl = el.querySelector(
            ".social-details-social-counts__reactions-count, .social-details-social-counts__count-value, button[aria-label*='reaction' i], button[aria-label*='like' i], span[aria-label*='reaction' i], span[aria-label*='like' i], span.social-details-social-counts__social-proof-fallback-number",
          );
          if (reactionsEl) {
            const aria = reactionsEl.getAttribute("aria-label") || "";
            const txt = (reactionsEl as HTMLElement).innerText || reactionsEl.textContent || "";
            const match = (aria + " " + txt).replace(/,/g, "").match(/(\d+)/);
            if (match) {
              reactionsCount = parseInt(match[1], 10) || 0;
            }
          }
          if (reactionsCount === 0) {
            const othersMatch = fullText.replace(/,/g, "").match(/and\s+(\d+)\s+others/i);
            if (othersMatch) {
              reactionsCount = (parseInt(othersMatch[1], 10) || 0) + 1;
            } else {
              const reactMatch = fullText.replace(/,/g, "").match(/(\d+)\s*(?:reactions?|likes?)/i);
              if (reactMatch) {
                reactionsCount = parseInt(reactMatch[1], 10) || 0;
              }
            }
          }

          let commentsCount = 0;
          const commentsEl = el.querySelector(
            ".social-details-social-counts__comments, button[aria-label*='comment' i], a[aria-label*='comment' i], span[aria-label*='comment' i]",
          );
          if (commentsEl) {
            const aria = commentsEl.getAttribute("aria-label") || "";
            const txt = (commentsEl as HTMLElement).innerText || commentsEl.textContent || "";
            const match =
              (aria + " " + txt).replace(/,/g, "").match(/(\d+)\s*comment/i) ||
              (aria + " " + txt).replace(/,/g, "").match(/(\d+)/);
            if (match) {
              commentsCount = parseInt(match[1], 10) || 0;
            }
          }
          if (commentsCount === 0) {
            const commentMatch = fullText.replace(/,/g, "").match(/(\d+)\s*comments?/i);
            if (commentMatch) {
              commentsCount = parseInt(commentMatch[1], 10) || 0;
            }
          }

          // 6. Strict Zero-Engagement Filter:
          // User requirement: post MUST have a little more than zero engagement (>0 likes or comments)
          if (reactionsCount === 0 && commentsCount === 0) {
            continue;
          }

          // Try extracting direct post URN/link
          let postUrl = "";
          let activityUrn = "";

          const containerUrn =
            el.getAttribute("data-urn") ||
            el.getAttribute("data-chameleon-result-urn") ||
            el.getAttribute("data-id") ||
            el.getAttribute("data-entity-urn") ||
            el.querySelector("[data-urn]")?.getAttribute("data-urn");

          if (containerUrn && /^urn:li:(?:activity|share|ugcPost):\d+/.test(containerUrn)) {
            const match = containerUrn.match(/urn:li:(?:activity|share|ugcPost):\d+/);
            if (match) {
              activityUrn = match[0];
              postUrl = `https://www.linkedin.com/feed/update/${match[0]}/`;
            }
          }

          if (!postUrl) {
            const directLinkEl = el.querySelector(
              "a[href*='/feed/update/urn:li:'], a[href*='/posts/'], a.update-components-actor__sub-description-link, a.app-aware-link[href*='/feed/update/']",
            ) as HTMLAnchorElement | null;
            if (directLinkEl && directLinkEl.href) {
              let href = directLinkEl.href.split("?")[0];
              if (href.startsWith("/")) href = `https://www.linkedin.com${href}`;
              if (href.startsWith("http")) postUrl = href;
            }
          }

          if (!activityUrn) {
            const urnFullMatch = (el.outerHTML + " " + postUrl).match(/urn:li:(?:activity|share|ugcPost):\d+/);
            if (urnFullMatch) {
              activityUrn = urnFullMatch[0];
              if (!postUrl) {
                postUrl = `https://www.linkedin.com/feed/update/${activityUrn}/`;
              }
            }
          }

          if (postUrl && !postUrl.startsWith("http")) {
            postUrl = "";
          }

          results.push({
            domIndex: idx,
            authorName,
            authorHeadline,
            postText,
            postUrl,
            activityUrn,
            reactionsCount,
            commentsCount,
          });
        }

        return results;
      });

      // Sort candidates so the most actively discussed posts come first
      rawCandidates.sort((a, b) => {
        const scoreA = a.commentsCount * 3 + a.reactionsCount * 1;
        const scoreB = b.commentsCount * 3 + b.reactionsCount * 1;
        return scoreB - scoreA;
      });

      // Filter out candidates that were already commented on / engaged in past runs
      const freshCandidates: typeof rawCandidates = [];
      for (const cand of rawCandidates) {
        const check = isPostAlreadyEngaged(cand, config.logs);
        if (check.alreadyEngaged) {
          console.log(
            `[LinkedIn Runner] ⏩ Skipping candidate "${cand.authorName}" (${check.reason}). Looking for fresh posts...`,
          );
          continue;
        }
        freshCandidates.push(cand);
      }

      console.log(
        `[LinkedIn Runner] Scanned ${rawCandidates.length} posts. After deduplication filter: ${freshCandidates.length} fresh candidate(s) remain (query: "${searchAttempt.query}").`,
      );

      rawCandidates = freshCandidates;

      if (rawCandidates.length > 0) {
        selectedTopic = searchAttempt.query;
        break;
      }
    }

    if (rawCandidates.length === 0) {
      const reason = `No founder architecture discussions found across attempted queries. Skipping run.`;
      console.log(`[LinkedIn Runner] ${reason}`);
      const log = await addLinkedInEngagementLog({
        authorName: "System",
        postUrl: effectiveSearchUrl,
        postSnippet: "Search feed scanned (0 viable candidates)",
        searchQuery: selectedTopic,
        sourceTrend: trendDiscovery.sourceTrend,
        relevanceAngle: trendDiscovery.relevanceAngle,
        relevanceScore: 0,
        relevanceReason: reason,
        status: "skipped",
      });
      return { success: true, status: "skipped", reason, log };
    }

    // 7. Evaluate Candidates with Gemini / Qwen AI
    console.log("[LinkedIn Runner] Evaluating candidate posts with AI...");
    const candidatesForEval: LinkedInFeedCandidate[] = rawCandidates.slice(0, 6).map((c, idx) => ({
      index: idx,
      domIndex: c.domIndex,
      authorName: c.authorName,
      authorHeadline: c.authorHeadline,
      postText: c.postText,
      postUrl: c.postUrl,
      activityUrn: c.activityUrn,
      reactionsCount: c.reactionsCount,
      commentsCount: c.commentsCount,
    }));
    const evaluation = await evaluateFeedCandidates(candidatesForEval, selectedTopic);
    console.log(`[LinkedIn Runner] Evaluation decision: ${evaluation.decision} (score: ${evaluation.relevanceScore})`);
    console.log(`[LinkedIn Runner] Reason: ${evaluation.reason}`);

    if (evaluation.decision === "SKIP" || !evaluation.selectedPost) {
      const reason = `No post met the minimum relevance threshold (best candidate score: ${evaluation.relevanceScore}/100). Reason: ${evaluation.reason}`;
      console.log(`[LinkedIn Runner] ${reason}`);
      const log = await addLinkedInEngagementLog({
        authorName: rawCandidates[0]?.authorName || "Feed Author",
        authorHeadline: rawCandidates[0]?.authorHeadline || "Professional",
        postUrl: rawCandidates[0]?.postUrl || effectiveSearchUrl,
        postSnippet: rawCandidates[0]?.postText.slice(0, 160) || "Candidate post",
        searchQuery: selectedTopic,
        sourceTrend: trendDiscovery.sourceTrend,
        relevanceAngle: trendDiscovery.relevanceAngle,
        relevanceScore: evaluation.relevanceScore,
        relevanceReason: reason,
        status: "skipped",
      });
      return { success: true, status: "skipped", reason, log };
    }

    const winnerCandidate = evaluation.selectedPost;
    console.log(`[LinkedIn Runner] Target Post Selected by AI:`);
    console.log(`  Author: ${winnerCandidate.authorName} (${winnerCandidate.authorHeadline})`);
    console.log(
      `  Engagement: ${winnerCandidate.reactionsCount ?? 0} reactions/likes, ${winnerCandidate.commentsCount ?? 0} comments`,
    );
    console.log(`  URL: ${winnerCandidate.postUrl || "Direct search feed locator"}`);
    console.log(`  Snippet: "${winnerCandidate.postText.slice(0, 120)}..."`);

    // 8. Prevent Duplicate Outreach (Idempotency check against historical logs)
    const checkWinner = isPostAlreadyEngaged(winnerCandidate, config.logs);
    if (checkWinner.alreadyEngaged) {
      const reason = `Target post was already engaged in previous run (${checkWinner.reason}). Skipping duplicate outreach.`;
      console.log(`[LinkedIn Runner] ⚠️ ${reason}`);
      const log = await addLinkedInEngagementLog({
        authorName: winnerCandidate.authorName,
        authorHeadline: winnerCandidate.authorHeadline,
        postUrl: winnerCandidate.postUrl,
        postSnippet: winnerCandidate.postText.slice(0, 160),
        searchQuery: selectedTopic,
        sourceTrend: trendDiscovery.sourceTrend,
        relevanceAngle: trendDiscovery.relevanceAngle,
        relevanceScore: evaluation.relevanceScore,
        relevanceReason: reason,
        status: "skipped",
      });
      return { success: true, status: "skipped", reason, log };
    }

    // 9. Generate Pure-Value CTO Comment (No Spam Links)
    console.log("[LinkedIn Runner] Generating pure-value CTO comment with AI...");
    const commentText = await generateCTOComment(winnerCandidate);
    console.log(`[LinkedIn Runner] Generated Comment:\n"${commentText}"\n`);

    // 10. Locate Comment Editor and Post Comment (20-Second Waiter)
    let commentEditorLocated = false;

    // Strategy A: Navigate directly to the isolated post page
    if (
      winnerCandidate.postUrl &&
      winnerCandidate.postUrl.startsWith("http") &&
      !winnerCandidate.postUrl.includes("/search/")
    ) {
      console.log(`[LinkedIn Runner] Navigating directly to post page: ${winnerCandidate.postUrl}`);
      await page.goto(winnerCandidate.postUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      const isPostAuthenticated = await ensureAuthenticatedOrWaitForLogin(
        page,
        context,
        PROFILE_DIR,
        winnerCandidate.postUrl,
        isHeadless,
      );

      if (!isPostAuthenticated) {
        throw new Error("LinkedIn authentication required while opening post. Please log in in the opened browser.");
      }

      // Wait for post container and social actions to mount (20-second waiter)
      console.log("[LinkedIn Runner] Waiting for post container and social actions to load (20s waiter)...");
      await page
        .waitForSelector(
          "main, article, div.feed-shared-update-v2, div[data-view-name*='feed-full-update'], div.core-rail, div.scaffold-finite-scroll, .feed-shared-social-actions, .social-actions-bar, button[aria-label*='Comment' i], button.comment-button, div.comments-comment-box",
          { timeout: 20000 },
        )
        .catch(() => {});

      // Scroll down to bring post social actions into viewport
      await page.evaluate(() => window.scrollBy(0, 350));
      await page.waitForTimeout(1000);

      // In-DOM check: Has Mehdi already commented on this post?
      const alreadyCommentedByMehdi = await page.evaluate(() => {
        const comments = Array.from(
          document.querySelectorAll(
            "article.comments-comment-item, div.comments-comment-item, .comments-post-meta__name-text, a.comments-post-meta__actor-link, a[href*='/in/mehdi-golzari']",
          ),
        );
        for (const c of comments) {
          const text = c.textContent?.toLowerCase() || "";
          const href = (c as HTMLAnchorElement).href || "";
          if (text.includes("mehdi golzari") || href.includes("mehdi-golzari")) {
            return true;
          }
        }
        return false;
      });

      if (alreadyCommentedByMehdi) {
        const reason = `Detected existing comment by Mehdi Golzari on this post in live DOM. Skipping duplicate outreach.`;
        console.log(`[LinkedIn Runner] ⚠️ ${reason}`);
        const log = await addLinkedInEngagementLog({
          authorName: winnerCandidate.authorName,
          authorHeadline: winnerCandidate.authorHeadline,
          postUrl: winnerCandidate.postUrl,
          postSnippet: winnerCandidate.postText.slice(0, 160),
          searchQuery: selectedTopic,
          sourceTrend: trendDiscovery.sourceTrend,
          relevanceAngle: trendDiscovery.relevanceAngle,
          relevanceScore: evaluation.relevanceScore,
          relevanceReason: reason,
          status: "skipped",
        });
        return { success: true, status: "skipped", reason, log };
      }

      // Run 20-second waiter to locate and activate editor on post page
      const editorLocator = await waitForAndActivateCommentEditor(page, { timeoutMs: 20000 });
      if (editorLocator) {
        commentEditorLocated = true;
        console.log("[LinkedIn Runner] Successfully focused comment editor on dedicated post page!");
      }
    }

    // Strategy B Fallback: Comment directly in-place on the search results card
    if (!commentEditorLocated) {
      console.log(
        "[LinkedIn Runner] Dedicated post page editor could not be opened. Falling back to in-place search feed card comment...",
      );

      // Navigate back to search page with 20s waiter
      await page.goto(effectiveSearchUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});

      console.log("[LinkedIn Runner] Waiting for search results to load (20s waiter)...");
      await page
        .waitForSelector(
          "li.reusable-search__result-container, div.feed-shared-update-v2, div[data-view-name='search-entity-result-universal-template'], div[role='listitem'], div[data-chameleon-result-urn]",
          { timeout: 20000 },
        )
        .catch(() => {});
      await page.waitForTimeout(1500);

      // Find the card by author name or domIndex
      let cardLocator = page
        .locator(
          "li.reusable-search__result-container, div.feed-shared-update-v2, div[data-view-name='search-entity-result-universal-template'], div[role='listitem'], div[data-chameleon-result-urn]",
        )
        .filter({ hasText: winnerCandidate.authorName })
        .first();

      if ((await cardLocator.count().catch(() => 0)) === 0) {
        // Scroll down to load more cards
        await page.evaluate(async () => {
          for (let i = 0; i < 3; i++) {
            window.scrollBy(0, 700);
            await new Promise((r) => setTimeout(r, 500));
          }
        });
        await page.waitForTimeout(1200);

        cardLocator = page
          .locator(
            "li.reusable-search__result-container, div.feed-shared-update-v2, div[data-view-name='search-entity-result-universal-template'], div[role='listitem'], div[data-chameleon-result-urn]",
          )
          .filter({ hasText: winnerCandidate.authorName })
          .first();

        if ((await cardLocator.count().catch(() => 0)) === 0) {
          const cards = page.locator(
            "li.reusable-search__result-container, div.feed-shared-update-v2, div[data-view-name='search-entity-result-universal-template'], div[role='listitem']",
          );
          const targetIndex = winnerCandidate.domIndex ?? winnerCandidate.index ?? 0;
          if (targetIndex < (await cards.count().catch(() => 0))) {
            cardLocator = cards.nth(targetIndex);
          }
        }
      }

      if ((await cardLocator.count().catch(() => 0)) > 0) {
        await cardLocator.scrollIntoViewIfNeeded().catch(() => {});
        await page.evaluate(() => window.scrollBy(0, -90));
        await page.waitForTimeout(1000);

        const editorLocator = await waitForAndActivateCommentEditor(page, {
          scope: cardLocator,
          timeoutMs: 20000,
        });

        if (editorLocator) {
          commentEditorLocated = true;
          console.log("[LinkedIn Runner] Successfully focused in-place comment editor on search feed card!");
        }
      }
    }

    if (commentEditorLocated) {
      if (options.dryRun) {
        console.log("[LinkedIn Runner] DRY RUN MODE: Typing preview comment into editor (visual simulation)...");
        await humanType(page, commentText);

        if (options.showBrowser) {
          console.log("[LinkedIn Runner] Pausing for 8 seconds for inspection before closing browser...");
          await page.waitForTimeout(8000);
        }

        const log = await addLinkedInEngagementLog({
          authorName: winnerCandidate.authorName,
          authorHeadline: winnerCandidate.authorHeadline,
          postUrl: winnerCandidate.postUrl || effectiveSearchUrl,
          postSnippet: winnerCandidate.postText.slice(0, 200),
          searchQuery: selectedTopic,
          sourceTrend: trendDiscovery.sourceTrend,
          relevanceAngle: trendDiscovery.relevanceAngle,
          relevanceScore: evaluation.relevanceScore,
          relevanceReason: evaluation.reason,
          generatedComment: commentText,
          status: "dry-run",
        });

        return {
          success: true,
          status: "dry-run",
          comment: commentText,
          targetPost: winnerCandidate,
          log,
        };
      }

      // Live Publishing Flow
      console.log("[LinkedIn Runner] LIVE MODE: Typing CTO comment with human-like jitter...");
      await humanType(page, commentText);

      // Natural reading/deliberation pause before submitting (3 to 6 seconds)
      const pauseBeforePost = Math.floor(Math.random() * 3000) + 3000;
      console.log(`[LinkedIn Runner] Deliberation pause of ${(pauseBeforePost / 1000).toFixed(1)}s before submission...`);
      await page.waitForTimeout(pauseBeforePost);

      // Find submit button with 20s waiter
      console.log("[LinkedIn Runner] Waiting for Post/Comment submit button (up to 20s waiter)...");
      const submitBtnLocator = await waitForVisibleElement(
        page,
        [
          // Exact LinkedIn DOM from live session
          "div[componentkey*='commentButtonSection'] button",
          "div[id*='commentButtonSection'] button",
          "button[componentkey*='commentButtonSection']",
          "div[class*='commentButtonSection'] button",
          "button.comments-comment-box__submit-button",
          "button[type='submit']:has-text('Comment')",
          "button[type='submit']:has-text('Post')",
          "button.artdeco-button--primary:has-text('Comment')",
          "button.artdeco-button--primary:has-text('Post')",
          "div.comments-comment-box button:has-text('Comment')",
          "div.comments-comment-box button:has-text('Post')",
          "button:has-text('Comment')",
          "button:has-text('Post')",
        ],
        20000,
      );

      if (!submitBtnLocator) {
        throw new Error("Could not find visible and enabled submit button for the comment.");
      }

      console.log("[LinkedIn Runner] Submitting comment via Post/Comment button...");
      await submitBtnLocator.click();
      await page.waitForTimeout(4500);

      console.log("[LinkedIn Runner] Comment published successfully!");

      const log = await addLinkedInEngagementLog({
        authorName: winnerCandidate.authorName,
        authorHeadline: winnerCandidate.authorHeadline,
        postUrl: winnerCandidate.postUrl || effectiveSearchUrl,
        postSnippet: winnerCandidate.postText.slice(0, 250),
        searchQuery: selectedTopic,
        sourceTrend: trendDiscovery.sourceTrend,
        relevanceAngle: trendDiscovery.relevanceAngle,
        relevanceScore: evaluation.relevanceScore,
        relevanceReason: evaluation.reason,
        generatedComment: commentText,
        status: "published",
      });

      return {
        success: true,
        status: "published",
        comment: commentText,
        targetPost: winnerCandidate,
        log,
      };
    }

    // Fallback for dry-run if neither editor could be located
    if (options.dryRun) {
      const log = await addLinkedInEngagementLog({
        authorName: winnerCandidate.authorName,
        authorHeadline: winnerCandidate.authorHeadline,
        postUrl: winnerCandidate.postUrl || effectiveSearchUrl,
        postSnippet: winnerCandidate.postText.slice(0, 200),
        searchQuery: selectedTopic,
        sourceTrend: trendDiscovery.sourceTrend,
        relevanceAngle: trendDiscovery.relevanceAngle,
        relevanceScore: evaluation.relevanceScore,
        relevanceReason: `[Simulated Editor Locating Fallback] ${evaluation.reason}`,
        generatedComment: commentText,
        status: "dry-run",
      });

      return {
        success: true,
        status: "dry-run",
        comment: commentText,
        targetPost: winnerCandidate,
        log,
      };
    }

    throw new Error("Could not locate comment editor on the targeted post.");
  } catch (error: any) {
    console.error("[LinkedIn Runner Error]:", error);
    const log = await addLinkedInEngagementLog({
      authorName: "Search Engine",
      postUrl: "https://www.linkedin.com/search/results/content/",
      postSnippet: "Failed execution exception",
      searchQuery: selectedTopic,
      sourceTrend: trendDiscovery?.sourceTrend,
      relevanceAngle: trendDiscovery?.relevanceAngle,
      relevanceScore: 0,
      relevanceReason: "Execution exception",
      status: "failed",
      error: error.message || "Unknown error during execution",
    });
    return {
      success: false,
      status: "failed",
      error: error.message,
      log,
    };
  } finally {
    if (context) {
      try {
        // Chromium automatically flushes all cookies, localStorage, and tokens to .linkedin-profile-cache on disk!
        const activeCookies = await context.cookies(["https://www.linkedin.com", "https://linkedin.com"]);
        const hasLiAt = activeCookies.some((c) => c.name === "li_at" && c.value);
        if (hasLiAt) {
          console.log(
            `[LinkedIn Runner] Browser state natively preserved in persistent profile (.linkedin-profile-cache) with ${activeCookies.length} active cookies.`,
          );
        } else {
          console.warn("[LinkedIn Runner] Note: Persistent profile active, but li_at cookie was not found in context.");
        }
      } catch (err) {
        console.warn("[LinkedIn Runner] Note during persistent context close:", err);
      }
      await context.close().catch(() => { });
    }
    console.log("=== LINKEDIN SEARCH ENGAGEMENT RUN FINISHED ===");
  }
}
