import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "mehdi_admin_secret_fallback_key_2026";
const ADMIN_COOKIE_NAME = "mehdi_admin_session";

export interface AdminSession {
  username: string;
  role: "superadmin" | "admin";
  createdAt: number;
}

/**
 * Verify administrative password against env variables
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME || "mehdi";
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (username.trim().toLowerCase() !== expectedUsername.trim().toLowerCase()) {
    return false;
  }

  if (expectedPasswordHash) {
    // Verify SHA-256 hash
    const inputHash = crypto.createHash("sha256").update(password).digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(inputHash),
      Buffer.from(expectedPasswordHash),
    );
  }

  // Direct string comparison with timingSafeEqual
  const inputBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expectedPassword);
  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

/**
 * Create signed HMAC-SHA256 admin session token
 */
export function createAdminSessionToken(username: string): string {
  const session: AdminSession = {
    username,
    role: "superadmin",
    createdAt: Date.now(),
  };

  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verify admin session token
 */
export function verifyAdminSessionToken(token: string): AdminSession | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const session = JSON.parse(decoded) as AdminSession;

    // Admin sessions expire after 14 days
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > FOURTEEN_DAYS) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Extract admin session from Request headers
 */
export function getAdminSessionFromRequest(request: Request): AdminSession | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const token = cookies[ADMIN_COOKIE_NAME];
  if (!token) return null;

  return verifyAdminSessionToken(token);
}

/**
 * Verify Bearer token for Cloud Scheduler Cron endpoint
 */
export function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET || "mehdi-autonomous-cron-secret-2026";
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    // Check URL search parameter fallback (?secret=...)
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret");
    return querySecret === cronSecret;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token === cronSecret;
}

export function getAdminSessionCookieHeader(token: string | null): string {
  if (!token) {
    return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  const maxAge = 14 * 24 * 60 * 60;
  return `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
