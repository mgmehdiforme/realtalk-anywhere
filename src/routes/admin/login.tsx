import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Shield, ArrowRight, Loader2, Sparkles, KeyRound, User } from "lucide-react";
import { adminLoginAction } from "@/lib/admin-functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Portal Login — MehdiGolzari.dev" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminLoginAction({
        data: { username: username.trim(), password: password.trim() },
      });

      if (res.success && res.token) {
        document.cookie = `mehdi_admin_session=${res.token}; Path=/; Max-Age=${14 * 24 * 60 * 60}; SameSite=Lax`;
        navigate({ to: "/admin/blog" });
      } else {
        setError(res.error || "Invalid username or password.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md">
        {/* Top Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-neon/10 border border-neon/20 text-neon shadow-neon mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Admin Management Portal
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Autonomous AI Engine & Technical Article Governance
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-neon/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-neon" /> Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                placeholder="Enter admin username"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-neon focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-neon" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-neon focus:outline-none transition"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">
            ← Return to public website
          </Link>
        </div>
      </div>
    </div>
  );
}
