import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authWithGoogle } from "@/lib/auth-functions";
import { Loader2 } from "lucide-react";

// Define route search parameters
interface SearchParams {
  code?: string;
  error?: string;
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      code: search.code as string | undefined,
      error: search.error as string | undefined,
    };
  },
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { code, error: urlError } = Route.useSearch();
  const [error, setError] = useState<string | null>(urlError || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (urlError) {
      setError(urlError);
      return;
    }

    if (!code) {
      setError("No authorization code found in URL.");
      return;
    }

    async function authenticate() {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const res = await authWithGoogle({ data: { code, redirectUri } });
        if (res.success) {
          if (res.token) {
            document.cookie = `founder_session=${res.token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          }
          // Redirect to blueprint builder
          navigate({ to: "/blueprint" });
        } else {
          setError(res.error || "Authentication failed.");
        }
      } catch (err) {
        setError("Failed to reach authentication server.");
      }
    }

    authenticate();
  }, [code, urlError, navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-5 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        {error ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-destructive">Authentication Error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="mt-4">
              <Link
                to="/blueprint"
                className="inline-flex items-center justify-center rounded-xl bg-neon px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
              >
                Go back to Blueprint Builder
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-neon" />
            <h1 className="text-xl font-semibold">Signing in with Google</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your credentials and establish your session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
