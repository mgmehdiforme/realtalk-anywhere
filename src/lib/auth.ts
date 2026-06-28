import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "mehdi_dev_founder_assessment_jwt_fallback_secret_key";
const COOKIE_NAME = "founder_session";

export interface UserSession {
  email: string;
  name: string;
  picture: string;
  createdAt: number;
}

/**
 * Sign session data with HMAC-SHA256
 */
export function createSessionToken(user: { email: string; name: string; picture: string }): string {
  const session: UserSession = {
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: Date.now(),
  };

  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verify session token and return user details
 */
export function verifySessionToken(token: string): UserSession | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  // Prevent timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const session = JSON.parse(decoded) as UserSession;
    
    // Sessions expire after 30 days
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > THIRTY_DAYS) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Extract session cookie from request headers
 */
export function getSessionFromRequest(request: Request): UserSession | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);

  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  return verifySessionToken(token);
}

/**
 * Helper to generate session cookie headers
 */
export function getSessionCookieHeader(token: string | null): string {
  if (!token) {
    // Delete cookie
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  
  // Set cookie for 30 days
  const maxAge = 30 * 24 * 60 * 60;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
