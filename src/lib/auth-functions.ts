import { createServerFn } from "@tanstack/react-start";

/**
 * Server Function to handle Google OAuth and Mock logins
 */
export const authWithGoogle = createServerFn()
  .validator(
    (d: { code?: string; mockUser?: { email: string; name: string; picture: string } }) => d,
  )
  .handler(async ({ data }) => {
    const { saveUser } = await import("./db");
    const { createSessionToken } = await import("./auth");

    // Check if it's a mock login
    if (data.mockUser) {
      console.log("Mock login triggered for:", data.mockUser.email);
      const user = await saveUser({
        email: data.mockUser.email,
        name: data.mockUser.name,
        picture: data.mockUser.picture,
      });

      const token = createSessionToken(user);
      return { success: true, token };
    }

    // Otherwise, handle real Google OAuth
    const code = data.code;
    if (!code) {
      return { success: false, error: "No authorization code provided" };
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: "Google client credentials are not configured on the server.",
      };
    }

    try {
      // Exchange code for token
      // We resolve origin dynamically from request headers
      const host = process.env.NODE_ENV === "production" ? "mehdigolzari.dev" : "localhost:8080";
      const protocol = host.startsWith("localhost") ? "http" : "https";
      const redirectUri = `${protocol}://${host}/auth/callback`;

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errText}`);
      }

      const tokens = await tokenResponse.json();

      // Fetch user profile info
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile info");
      }

      const profile = await profileResponse.json();

      const user = await saveUser({
        email: profile.email,
        name: profile.name || profile.email.split("@")[0],
        picture: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.email}`,
      });

      // Generate session
      const token = createSessionToken(user);
      return { success: true, token };
    } catch (error: any) {
      console.error("Google OAuth callback error:", error);
      return { success: false, error: error.message || "Authentication failed" };
    }
  });
