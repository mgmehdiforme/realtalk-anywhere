import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getAdminSessionFromRequest } from "./admin-auth";
import {
  getLinkedInConfig,
  saveLinkedInSession,
  clearLinkedInSession,
  updateLinkedInSchedule,
} from "./db";
import { executeLinkedInFeedEngagement } from "./linkedin-runner";

/**
 * Fetch LinkedIn admin state & recent activity logs
 */
export const getLinkedInAdminStateAction = createServerFn().handler(async () => {
  const request = getRequest();
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return {
      authenticated: false,
      connected: false,
      config: null,
      stats: { publishedToday: 0, totalPublished: 0, totalSkipped: 0 },
    };
  }

  const config = await getLinkedInConfig();
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  const publishedToday = (config.logs || []).filter(
    (l) => l.status === "published" && new Date(l.timestamp).getTime() > twentyFourHoursAgo,
  ).length;

  const totalPublished = (config.logs || []).filter((l) => l.status === "published").length;
  const totalSkipped = (config.logs || []).filter((l) => l.status === "skipped").length;

  return {
    authenticated: true,
    connected: !!(config.sessionState && config.sessionState.cookies?.length > 0),
    config: {
      lastImportedAt: config.lastImportedAt,
      accountInfo: config.accountInfo,
      schedule: config.schedule,
      logs: config.logs || [],
    },
    stats: {
      publishedToday,
      totalPublished,
      totalSkipped,
    },
  };
});

/**
 * Import and validate uploaded LinkedIn session JSON
 */
export const importLinkedInSessionAction = createServerFn({ method: "POST" })
  .validator((d: { rawSessionJson: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = getAdminSessionFromRequest(request);

    if (!session) {
      throw new Error("Unauthorized admin access");
    }

    try {
      const parsed = JSON.parse(data.rawSessionJson);

      // Validate that it looks like a Playwright storageState or cookie bundle
      if (!parsed.cookies || !Array.isArray(parsed.cookies)) {
        return {
          success: false,
          error: "Invalid session format. File must contain a 'cookies' array (exported by Playwright CLI).",
        };
      }

      // Check for essential LinkedIn auth cookie (li_at)
      const hasAuthCookie = parsed.cookies.some((c: any) => c.name === "li_at");
      if (!hasAuthCookie) {
        return {
          success: false,
          error: "Missing 'li_at' cookie. Please make sure you were actively logged into LinkedIn when extracting the session.",
        };
      }

      const accountInfo = parsed.accountInfo || {
        name: "LinkedIn Account",
        headline: "Active Session",
      };

      await saveLinkedInSession(parsed, accountInfo);

      return {
        success: true,
        accountInfo,
        cookiesCount: parsed.cookies.length,
      };
    } catch (e: any) {
      return {
        success: false,
        error: `Failed to parse session JSON: ${e.message}`,
      };
    }
  });

/**
 * Manually trigger LinkedIn feed scanner and commenting run
 */
export const triggerLinkedInFeedRunAction = createServerFn({ method: "POST" })
  .validator(
    (d: {
      dryRun?: boolean;
      showBrowser?: boolean;
      skipDailyLimit?: boolean;
      useImportedSession?: boolean;
    }) => d,
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = getAdminSessionFromRequest(request);

    if (!session) {
      throw new Error("Unauthorized admin access");
    }

    try {
      const result = await executeLinkedInFeedEngagement({
        dryRun: data.dryRun ?? false,
        showBrowser: data.showBrowser ?? false,
        skipDailyLimit: data.skipDailyLimit ?? true, // Manual admin triggers bypass daily limit
        useImportedSession: data.useImportedSession ?? false,
      });
      return { success: true, result };
    } catch (error: any) {
      console.error("[LinkedIn Admin Action Error]:", error);
      return {
        success: false,
        error: error.message || "Execution failed",
      };
    }
  });

/**
 * Disconnect and wipe stored LinkedIn session
 */
export const clearLinkedInSessionAction = createServerFn({ method: "POST" }).handler(async () => {
  const request = getRequest();
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    throw new Error("Unauthorized admin access");
  }

  await clearLinkedInSession();
  return { success: true };
});

/**
 * Update automated daily schedule settings
 */
export const updateLinkedInScheduleAction = createServerFn({ method: "POST" })
  .validator(
    (d: {
      enabled: boolean;
      morningHourUtc: number;
      afternoonHourUtc: number;
      maxPerDay: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = getAdminSessionFromRequest(request);

    if (!session) {
      throw new Error("Unauthorized admin access");
    }

    const updated = await updateLinkedInSchedule(data);
    return { success: true, schedule: updated.schedule };
  });
