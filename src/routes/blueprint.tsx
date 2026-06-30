import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { createServerFn } from "@tanstack/react-start";
import { useDemoModal } from "@/lib/demo-modal";
import { authWithGoogle } from "@/lib/auth-functions";
import type { QwenAnalysisResult } from "@/lib/qwen";
import {
  Loader2,
  CheckCircle,
  FileDown,
  PhoneCall,
  LogOut,
  Calendar,
  Lock,
  ArrowRight,
  ArrowLeft,
  CloudLightning,
  Sparkles,
  HelpCircle,
  Check,
  ChevronDown,
  Info,
  Brain,
  Shield,
  Zap,
  Target,
  Rocket,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Wrench,
  ExternalLink,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SERVER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the current user state, blueprint progress/submission, and env configs
 */
export const getBlueprintState = createServerFn()
  .handler(async ({ request }) => {
    const { getSessionFromRequest } = await import("@/lib/auth");
    const { getUser, getBlueprint } = await import("@/lib/db");

    const session = getSessionFromRequest(request);
    const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
    const showMockLogin = !googleClientId || !process.env.GOOGLE_CLIENT_SECRET;

    if (!session) {
      return { 
        authenticated: false, 
        user: null, 
        assessment: null, 
        showMockLogin,
        googleClientId
      };
    }

    const dbUser = await getUser(session.email);
    const assessment = await getBlueprint(session.email);

    return {
      authenticated: true,
      user: dbUser,
      assessment,
      showMockLogin,
      googleClientId
    };
  });

/**
 * Save current builder answers as a draft
 */
export const saveBlueprintDraft = createServerFn()
  .validator((d: { answers: Record<string, any> }) => d)
  .handler(async ({ data, request }) => {
    const { getSessionFromRequest } = await import("@/lib/auth");
    const { saveBlueprint } = await import("@/lib/db");

    const session = getSessionFromRequest(request);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const assessment = await saveBlueprint(session.email, data.answers);
    return { success: true, assessment };
  });

/**
 * Finalize blueprint builder, trigger Qwen analysis, and compile PDF
 */
export const submitBlueprintAction = createServerFn()
  .handler(async ({ request }) => {
    const { getSessionFromRequest } = await import("@/lib/auth");
    const { getBlueprint, submitBlueprint } = await import("@/lib/db");
    const { analyzeBlueprintAnswers } = await import("@/lib/qwen");
    const { generateBlueprintPdf } = await import("@/lib/pdf");

    try {
      console.log("submitBlueprintAction: Invoked");
      const session = getSessionFromRequest(request);
      if (!session) {
        console.error("submitBlueprintAction: Unauthorized session");
        throw new Error("Unauthorized");
      }

      console.log(`submitBlueprintAction: Retrieving blueprint for ${session.email}...`);
      const existing = await getBlueprint(session.email);
      if (!existing) {
        console.error(`submitBlueprintAction: No blueprint found for ${session.email}`);
        throw new Error("No blueprint answers found");
      }

      if (existing.submittedAt) {
        console.error(`submitBlueprintAction: Blueprint already submitted for ${session.email}`);
        throw new Error("Blueprint already submitted");
      }

      // 1. Call Qwen for report insights
      console.log(`submitBlueprintAction: Starting Qwen analysis for ${session.email}...`);
      const analysis = await analyzeBlueprintAnswers(existing.answers, session.email);
      console.log(`submitBlueprintAction: Qwen analysis complete. Recommended phase: ${analysis.recommendedPhase}`);

      // 2. Generate PDF using pdfkit
      console.log(`submitBlueprintAction: Generating PDF blueprint for ${session.email}...`);
      const pdfPath = await generateBlueprintPdf(session.email, existing.answers, analysis);
      console.log(`submitBlueprintAction: PDF generation complete: ${pdfPath}`);

      // 3. Mark in DB as submitted
      console.log(`submitBlueprintAction: Submitting blueprint in DB for ${session.email}...`);
      const updated = await submitBlueprint(session.email, pdfPath, analysis);
      console.log(`submitBlueprintAction: DB submission complete`);

      return { success: true, assessment: updated };
    } catch (error: any) {
      console.error("submitBlueprintAction ERROR:", error);
      throw error;
    }
  });

/**
 * Download the generated PDF blueprint as base64
 */
export const downloadPdfBlueprint = createServerFn()
  .handler(async ({ request }) => {
    const { getSessionFromRequest } = await import("@/lib/auth");
    const { getBlueprint } = await import("@/lib/db");

    const session = getSessionFromRequest(request);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const assessment = await getBlueprint(session.email);
    if (!assessment || !assessment.reportPdfPath) {
      throw new Error("Blueprint not generated yet");
    }

    try {
      const fs = await import("fs/promises");
      const pdfBuffer = await fs.readFile(assessment.reportPdfPath);
      return { 
        success: true, 
        base64: pdfBuffer.toString("base64"),
        fileName: `MehdiGolzari_GoToLaunch_Blueprint_${session.email.split("@")[0]}.pdf`
      };
    } catch (error) {
      console.error("PDF read error:", error);
      throw new Error("Failed to read blueprint file on server");
    }
  });

/**
 * Request edit unlock by sharing on LinkedIn
 */
export const requestBlueprintUnlockAction = createServerFn()
  .validator((d: { linkedinUrl: string }) => d)
  .handler(async ({ data, request }) => {
    const { getSessionFromRequest } = await import("@/lib/auth");
    const { requestUnlock } = await import("@/lib/db");

    const session = getSessionFromRequest(request);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const assessment = await requestUnlock(session.email, data.linkedinUrl);
    return { success: true, assessment };
  });

/**
 * Log the user out by clearing the session cookie
 */
export const logoutAction = createServerFn()
  .handler(async () => {
    return { success: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/blueprint")({
  head: () => ({
    meta: [
      { title: "Build Your Go-to-Launch Blueprint™ — SaaS Scoping | MehdiGolzari.dev" },
      {
        name: "description",
        content: "Create a personalized execution blueprint before writing code. Get immediate AI insights and a downloadable PDF roadmap.",
      },
    ],
  }),
  component: BlueprintFlowPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

function BlueprintFlowPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{
    authenticated: boolean;
    user: any;
    assessment: any;
    showMockLogin: boolean;
    googleClientId?: string;
  } | null>(null);

  // Authentication trigger redirect helper
  const handleGoogleLogin = () => {
    if (!state || !state.googleClientId) {
      alert("Google Client ID is not configured on the server.");
      return;
    }
    
    const host = window.location.host;
    const protocol = window.location.protocol;
    const redirectUri = `${protocol}//${host}/auth/callback`;
    
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${state.googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email`;
  };

  // Mock login trigger for dev
  const handleMockLogin = async (email: string) => {
    setLoading(true);
    try {
      const res = await authWithGoogle({
        data: {
          mockUser: {
            email,
            name: email.split("@")[0].toUpperCase(),
            picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
          },
        },
      });
      if (res.success) {
        if (res.token) {
          document.cookie = `founder_session=${res.token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        }
        refreshState();
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const refreshState = async () => {
    setLoading(true);
    try {
      const data = await getBlueprintState();
      setState(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    document.cookie = "founder_session=; Path=/; Max-Age=0";
    await logoutAction();
    refreshState();
  };

  useEffect(() => {
    refreshState();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-neon" />
      </div>
    );
  }

  if (!state?.authenticated) {
    return (
      <LandingPage 
        showMockLogin={state?.showMockLogin ?? true} 
        onGoogleLogin={handleGoogleLogin} 
        onMockLogin={handleMockLogin} 
      />
    );
  }

  if (state.assessment?.submittedAt) {
    return (
      <DashboardView 
        user={state.user} 
        assessment={state.assessment} 
        onLogout={handleLogout} 
        onRefresh={refreshState}
      />
    );
  }

  return (
    <WizardForm 
      user={state.user} 
      initialAnswers={state.assessment?.answers || {}} 
      onComplete={refreshState} 
      onLogout={handleLogout}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

function LandingPage({ 
  showMockLogin, 
  onGoogleLogin, 
  onMockLogin 
}: { 
  showMockLogin: boolean; 
  onGoogleLogin: () => void; 
  onMockLogin: (email: string) => void; 
}) {
  const [mockEmail, setMockEmail] = useState("testfounder@example.com");

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero border-b border-border py-16 sm:py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-neon-gradient backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> 100% Free Execution Blueprint
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Build Your <span className="text-neon-gradient">Go-to-Launch Blueprint™</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Create a personalized execution blueprint before writing code. Answer a few strategic questions and receive a personalized blueprint highlighting opportunities, technical risks, and the fastest path to launch.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-neon" /> 10-15 mins completion</span>
            <span className="opacity-50">·</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-neon" /> Structured PDF Output</span>
            <span className="opacity-50">·</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-neon" /> Google Sign-In only</span>
          </div>
        </div>
      </section>

      {/* Login & Core Value Grid */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          
          {/* Why Complete Card & Receivables */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Why build a Go-to-Launch Blueprint™?</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Before booking a discovery session, building this blueprint structures your startup requirements. 
                It helps lock features, map technology expectations, and isolate technical complexity early.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Step 1", desc: "Answer a few questions about your startup." },
                { title: "Step 2", desc: "Our AI analyzes your product, execution strategy, and business priorities." },
                { title: "Step 3", desc: "Receive your personalized Go-to-Launch Blueprint™." },
                { title: "Step 4", desc: "Review it together during a Discovery Session." }
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card/40 p-5">
                  <h3 className="font-display text-sm font-semibold text-neon">{item.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Redesigned Premium PDF Preview Mockup */}
            <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card/30 to-background/20 p-5 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground font-semibold">Blueprint Preview (Sample Layout)</span>
                </div>
                <span className="rounded bg-neon/10 border border-neon/30 px-2 py-0.5 font-mono text-[8px] font-bold text-neon uppercase">A4 PDF Blueprint</span>
              </div>
              
              <div className="space-y-3.5 opacity-70 text-left">
                {/* Simulated Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-foreground">Go-to-Launch Blueprint™</h4>
                    <p className="text-[9px] text-muted-foreground font-mono mt-0.5">PROJECT: SAAS MVP SCOPE</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">Page 1 of 3</span>
                </div>

                {/* Simulated Recommendation Banner */}
                <div className="rounded-lg border border-neon/20 bg-neon/5 p-2.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider block">Recommended Strategy Phase</span>
                    <span className="text-[10px] font-bold text-neon">VALIDATE™ Phase</span>
                  </div>
                  <span className="rounded bg-neon/20 px-2 py-0.5 text-[8px] font-mono text-neon font-bold">PRE-PRODUCT VALIDATION</span>
                </div>

                {/* Simulated Core Sections */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-foreground uppercase tracking-wider">1. Executive Summary</div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    The primary opportunity is to validate structural market demand using high-fidelity scoping templates before committing engineering runway. Focus on core user loops...
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-foreground uppercase tracking-wider">2. Engineering Strategy</div>
                  <div className="grid grid-cols-2 gap-2 text-[8px]">
                    <div className="rounded border border-border bg-card/40 p-2">
                      <span className="font-bold text-neon block">AI Scoping</span>
                      <span className="text-muted-foreground">Strict JSON output schemas via Qwen API.</span>
                    </div>
                    <div className="rounded border border-border bg-card/40 p-2">
                      <span className="font-bold text-neon block">Frontend Tech</span>
                      <span className="text-muted-foreground">Next.js + Zustand for wizard auto-saving.</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fade out mask to look like a document preview */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Login Card */}
          <div className="lg:col-span-5 rounded-3xl border-2 border-neon/40 bg-gradient-to-b from-card via-card/95 to-neon/10 p-8 shadow-[0_0_30px_rgba(var(--neon-color-rgb),0.15)] sticky top-24 overflow-hidden">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-neon opacity-10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-primary opacity-10 blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neon/15 px-2.5 py-1 text-[10px] font-bold text-neon uppercase tracking-wider mb-4 border border-neon/20">
                <Lock className="h-3.5 w-3.5" /> Secure Access
              </div>
              
              <h3 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Get Started <Sparkles className="h-5 w-5 text-neon animate-pulse" />
              </h3>
              
              <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                Login with Google is <strong className="text-foreground font-semibold">required</strong> to secure your progress, enable real-time auto-saving, and generate your blueprint.
              </p>

              <div className="mt-6 space-y-4">
                {showMockLogin ? (
                  <div className="rounded-2xl border border-neon/30 bg-neon/5 p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neon">
                      <CloudLightning className="h-4 w-4" /> Local Testing Mode Enabled
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Google Client credentials are not configured in your environment. Use this mock field to simulate authentication.
                    </p>
                    <input
                      type="email"
                      value={mockEmail}
                      onChange={(e) => setMockEmail(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
                      placeholder="Enter mock email address"
                    />
                    <button
                      onClick={() => onMockLogin(mockEmail)}
                      className="w-full rounded-lg bg-neon py-2.5 text-xs font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
                    >
                      Build My Blueprint
                    </button>
                  </div>
                ) : (
                  <button
                     onClick={onGoogleLogin}
                     className="w-full flex items-center justify-center gap-3 rounded-xl border border-neon/30 bg-neon text-primary-foreground shadow-neon hover:brightness-110 py-3.5 px-4 text-sm font-bold transition duration-200 transform hover:scale-[1.01]"
                  >
                    <div className="rounded-full bg-white p-1 flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.42 7.57l3.8 2.95C6.18 7.37 8.87 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.45 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.43c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.7-4.91 3.7-8.58z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.22 14.77c-.24-.73-.38-1.51-.38-2.32s.14-1.59.38-2.32L1.42 7.18C.51 9 .01 11 .01 13.1c0 2.1.5 4.1 1.41 5.92l3.8-3.25z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23.01c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-3.95 1.1-3.13 0-5.82-2.33-6.77-5.48l-3.8 2.95c1.95 3.89 5.93 6.57 10.59 6.57z"
                        />
                      </svg>
                    </div>
                    Continue with Google
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-card/20 border-t border-border">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
          <h2 className="font-display text-2xl font-semibold text-center">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-4">
            {[
              {
                q: "Is there any cost for this blueprint?",
                a: "No. The blueprint builder and PDF generation are completely free. It helps me prepare for our session so that we spend the conversation solving core technical challenges rather than reviewing basic project details.",
              },
              {
                q: "How does the auto-save feature work?",
                a: "Once signed in, every answer you type is saved in real-time as you transition between pages or click away. You can close the tab and return later to finish without losing your data.",
              },
              {
                q: "What happens after I generate?",
                a: "Your blueprint builder transitions to Read-Only mode. Your dashboard will immediately display your generated AI insights, a button to download the PDF blueprint, and direct contact CTAs to schedule your Discovery Session.",
              },
            ].map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left font-semibold text-sm transition hover:bg-card"
      >
        <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-neon shrink-0" /> {question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border p-5 text-xs text-muted-foreground leading-relaxed bg-background/30">
          {answer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BLUEPRINT BUILDER WIZARD FORM
// ─────────────────────────────────────────────────────────────────────────────

function WizardForm({ 
  user, 
  initialAnswers, 
  onComplete, 
  onLogout 
}: { 
  user: any; 
  initialAnswers: Record<string, any>; 
  onComplete: () => void; 
  onLogout: () => void; 
}) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const LOADING_STEPS = [
    { label: "Reading your blueprint answers...", icon: "📋" },
    { label: "Analyzing founder strengths...", icon: "💪" },
    { label: "Identifying biggest opportunities...", icon: "🚀" },
    { label: "Evaluating execution risks...", icon: "⚠️" },
    { label: "Formulating engineering strategy...", icon: "🔧" },
    { label: "Designing fastest path to launch...", icon: "⚡" },
    { label: "Compiling your Go-to-Launch Blueprint™...", icon: "📄" },
    { label: "Finalizing your Go-to-Launch Blueprint™...", icon: "✨" },
  ];

  useEffect(() => {
    if (submitting) {
      setLoadingStep(0);
      loadingInterval.current = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < LOADING_STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 5000);
    } else {
      if (loadingInterval.current) {
        clearInterval(loadingInterval.current);
        loadingInterval.current = null;
      }
      setLoadingStep(0);
    }
    return () => {
      if (loadingInterval.current) {
        clearInterval(loadingInterval.current);
      }
    };
  }, [submitting]);

  // Auto-save triggers
  const saveDraft = async (updatedAnswers: Record<string, any>) => {
    setSaving(true);
    try {
      await saveBlueprintDraft({ data: { answers: updatedAnswers } });
    } catch (e) {
      console.error("Auto-save failed", e);
    } finally {
      setTimeout(() => setSaving(false), 400);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const updated = { ...answers, [field]: value };
    setAnswers(updated);
    setValidationError(null);
  };

  const handleBlur = () => {
    saveDraft(answers);
  };

  const getSelectedIndustries = (): string[] => {
    return Array.isArray(answers.industryNiche)
      ? answers.industryNiche
      : typeof answers.industryNiche === "string"
        ? answers.industryNiche.split(",").map(i => i.trim()).filter(Boolean)
        : [];
  };

  const toggleIndustry = (ind: string) => {
    const current = getSelectedIndustries();
    let updated: string[];
    if (current.includes(ind)) {
      updated = current.filter((i) => i !== ind);
    } else {
      updated = [...current, ind];
    }
    handleInputChange("industryNiche", updated);
    saveDraft({ ...answers, industryNiche: updated });
  };

  const isStepValid = (stepNum: number) => {
    if (stepNum === 1) {
      return !!answers.founderName?.trim() && !!answers.founderRole;
    }
    if (stepNum === 2) {
      const currentInd = getSelectedIndustries();
      const industryOk = currentInd.includes("Other")
        ? currentInd.length > 1 && !!answers.industryNicheOther?.trim()
        : currentInd.length > 0;
      
      const targetAudienceOk = answers.targetAudience === "Other"
        ? !!answers.targetAudienceOther?.trim()
        : !!answers.targetAudience;

      const fundingStageOk = answers.fundingStage === "Other"
        ? !!answers.fundingStageOther?.trim()
        : !!answers.fundingStage;

      return !!answers.startupName?.trim() && industryOk && targetAudienceOk && fundingStageOk;
    }
    if (stepNum === 3) {
      return (
        !!answers.problemDescription?.trim() &&
        !!answers.urgencyDescription?.trim() &&
        !!answers.alternativesDescription?.trim()
      );
    }
    if (stepNum === 4) {
      return (
        !!answers.productDescription?.trim() &&
        !!answers.mvpFeatures?.trim() &&
        !!answers.designStatus
      );
    }
    if (stepNum === 5) {
      return !!answers.sixMonthGoal && !!answers.monetization;
    }
    return true;
  };

  const nextStep = () => {
    if (!isStepValid(step)) {
      setValidationError("Please fill out all required fields before continuing.");
      return;
    }
    setValidationError(null);
    saveDraft(answers);
    setStep((s) => Math.min(s + 1, 6));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setValidationError(null);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!isStepValid(5)) {
      setStep(5);
      setValidationError("Please complete all required fields on Business Goals first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitBlueprintAction();
      if (res.success) {
        onComplete();
      }
    } catch (e) {
      console.error(e);
      alert("Submission failed. Please check your answers and try again.");
      setSubmitting(false);
    }
  };

  const totalSteps = 6;
  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      {/* Top Wizard Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img src={user.picture} alt="" className="h-8 w-8 rounded-full border border-border" />
          <div className="text-xs">
            <div className="font-semibold">{user.name}</div>
            <div className="text-muted-foreground text-[10px]">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-muted-foreground text-[10px] flex items-center gap-1.5">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-neon" />
                Saving blueprint draft...
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Draft saved
              </>
            )}
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[10px] font-semibold"
          >
            <LogOut className="h-3 w-3" /> Log out
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span className="font-mono uppercase tracking-wider text-[10px] text-neon">Building Your Blueprint: Section {step} of {totalSteps}</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-neon transition-all duration-300 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card min-h-[40vh] transition-all">
        
        {/* ── PREMIUM LOADING OVERLAY ── */}
        {submitting ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 animate-in fade-in duration-500">
            {/* Glowing Brain Icon */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-neon/20 blur-2xl animate-pulse" style={{ width: 96, height: 96, top: -8, left: -8 }} />
              <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-neon/30 to-primary/20 border border-neon/30 shadow-lg">
                <Brain className="h-10 w-10 text-neon animate-pulse" />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
              Building Your Blueprint
            </h2>
            <p className="text-xs text-muted-foreground mb-8 text-center max-w-md">
              Our AI is reviewing your answers and building your personalized Go-to-Launch Blueprint™. This typically takes 30–60 seconds.
            </p>

            {/* Progress Bar */}
            <div className="w-full max-w-sm mb-8">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-neon to-primary rounded-full transition-all duration-[4500ms] ease-out"
                  style={{ width: `${Math.min(((loadingStep + 1) / LOADING_STEPS.length) * 100, 98)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>{Math.min(Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100), 98)}%</span>
                <span>Step {loadingStep + 1} of {LOADING_STEPS.length}</span>
              </div>
            </div>

            {/* Step-by-step status list */}
            <div className="w-full max-w-sm space-y-2.5">
              {LOADING_STEPS.map((ls, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs transition-all duration-500 ${
                    idx < loadingStep 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : idx === loadingStep
                        ? "bg-neon/10 text-neon border border-neon/30 shadow-sm"
                        : "bg-muted/30 text-muted-foreground/50 border border-transparent"
                  }`}
                >
                  <span className="text-base shrink-0">{ls.icon}</span>
                  <span className="flex-1 font-medium">{ls.label}</span>
                  {idx < loadingStep && (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  {idx === loadingStep && (
                    <Loader2 className="h-4 w-4 animate-spin text-neon shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Reassurance message */}
            <p className="mt-8 text-[10px] text-muted-foreground/60 text-center">
              Please don't close this tab. Your blueprint is being compiled in real-time.
            </p>
          </div>
        ) : (
        <>
        {/* STEP 1: FOUNDER PROFILE */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-neon-gradient">Founder Profile</h2>
            <p className="text-xs text-muted-foreground">Tell me a bit about yourself and your role in this project.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Founder Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={answers.founderName || ""}
                  onChange={(e) => handleInputChange("founderName", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={answers.linkedinUrl || ""}
                  onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Founder Role <span className="text-destructive">*</span>
                </label>
                <select
                  value={answers.founderRole || ""}
                  onChange={(e) => handleInputChange("founderRole", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                >
                  <option value="">Select your profile...</option>
                  <option value="Solo Founder">Solo Founder (Non-Technical)</option>
                  <option value="Solo Founder (Technical)">Solo Founder (Technical)</option>
                  <option value="Co-Founder (Technical)">Co-Founder & CTO / Lead Developer</option>
                  <option value="Co-Founder (Non-Technical)">Co-Founder & CEO / Business Lead</option>
                  <option value="Product Manager/Other">Product Owner / Director / PM</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: STARTUP SUMMARY */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-neon-gradient">Startup Summary</h2>
            <p className="text-xs text-muted-foreground">General context regarding the startup company and market target.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Startup or Project Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={answers.startupName || ""}
                  onChange={(e) => handleInputChange("startupName", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="e.g. Vendoroo.Ai"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Industry or Niche <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    "B2B SaaS",
                    "AI / Machine Learning",
                    "FinTech",
                    "HealthTech",
                    "EdTech",
                    "E-commerce",
                    "Creator Economy",
                    "Marketplace",
                    "PropTech",
                    "Other"
                  ].map((ind) => {
                    const isSelected = getSelectedIndustries().includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleIndustry(ind)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-neon border-neon text-primary-foreground"
                            : "bg-background border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {ind}
                      </button>
                    );
                  })}
                </div>
                {getSelectedIndustries().includes("Other") && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={answers.industryNicheOther || ""}
                      onChange={(e) => handleInputChange("industryNicheOther", e.target.value)}
                      onBlur={handleBlur}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                      placeholder="Please specify other industry/niche..."
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Target Audience <span className="text-destructive">*</span>
                </label>
                <select
                  value={answers.targetAudience || ""}
                  onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                >
                  <option value="">Select target...</option>
                  <option value="B2B (Enterprise)">B2B (Enterprise clients)</option>
                  <option value="B2B (SMEs)">B2B (Small/Medium Businesses)</option>
                  <option value="B2C (Consumers)">B2C (General consumer mass market)</option>
                  <option value="B2B2C">B2B2C (Partner distribution)</option>
                  <option value="Marketplace">Two-sided Marketplace / Platform</option>
                  <option value="Other">Other</option>
                </select>
                {answers.targetAudience === "Other" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={answers.targetAudienceOther || ""}
                      onChange={(e) => handleInputChange("targetAudienceOther", e.target.value)}
                      onBlur={handleBlur}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                      placeholder="Please specify other target audience..."
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Current Funding Stage <span className="text-destructive">*</span>
                </label>
                <select
                  value={answers.fundingStage || ""}
                  onChange={(e) => handleInputChange("fundingStage", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                >
                  <option value="">Select funding stage...</option>
                  <option value="Bootstrapped">Bootstrapped / Self-Funded</option>
                  <option value="Pre-seed (Friends & Family)">Pre-seed (Friends & Family / Angels)</option>
                  <option value="Seed Funded">Seed Funded (Institutional VCs)</option>
                  <option value="Series A+">Series A or beyond</option>
                  <option value="Other">Other</option>
                </select>
                {answers.fundingStage === "Other" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={answers.fundingStageOther || ""}
                      onChange={(e) => handleInputChange("fundingStageOther", e.target.value)}
                      onBlur={handleBlur}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                      placeholder="Please specify other funding stage..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROBLEM DEFINITION */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-neon-gradient">Problem Definition</h2>
            <p className="text-xs text-muted-foreground">Describe the market pain point you are solving.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  What primary problem does your product solve? <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={answers.problemDescription || ""}
                  onChange={(e) => handleInputChange("problemDescription", e.target.value)}
                  onBlur={handleBlur}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="Explain the specific frustration or inefficiencies your audience deals with daily."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Why now? What makes this problem urgent today? <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={answers.urgencyDescription || ""}
                  onChange={(e) => handleInputChange("urgencyDescription", e.target.value)}
                  onBlur={handleBlur}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="Are there new regulations, AI technologies, or market shifts triggering this?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  How do your users solve this problem today? <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={answers.alternativesDescription || ""}
                  onChange={(e) => handleInputChange("alternativesDescription", e.target.value)}
                  onBlur={handleBlur}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="Are they using spreadsheets, manual labor, or legacy competitors?"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PRODUCT DETAILS */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-neon-gradient">Product & Solution</h2>
            <p className="text-xs text-muted-foreground">Outline your product's architecture scope.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Product Description (Elevator Pitch) <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={answers.productDescription || ""}
                  onChange={(e) => handleInputChange("productDescription", e.target.value)}
                  onBlur={handleBlur}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="Describe your solution in 2-3 sentences. How does it fix the problem described?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  What are the core 2-3 MVP features? <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={answers.mvpFeatures || ""}
                  onChange={(e) => handleInputChange("mvpFeatures", e.target.value)}
                  onBlur={handleBlur}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="e.g. 1. Google sign-in & team workspace. 2. PDF parsing using LLMs. 3. Excel exporting."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Do you have wireframes, designs, or prototypes? <span className="text-destructive">*</span>
                </label>
                <select
                  value={answers.designStatus || ""}
                  onChange={(e) => handleInputChange("designStatus", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                >
                  <option value="">Select status...</option>
                  <option value="no">No designs (just text/ideas)</option>
                  <option value="in_progress">In progress (basic sketches / mockups)</option>
                  <option value="yes_figma">Yes, completed Figma wireframes/mockups</option>
                  <option value="yes_prototype">Yes, clickable interactive prototype</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: BUSINESS GOALS */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-neon-gradient">Business Goals</h2>
            <p className="text-xs text-muted-foreground">Aligning technology with commercial objectives.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Primary Goal for the Next 6 Months <span className="text-destructive">*</span>
                </label>
                <select
                  value={answers.sixMonthGoal || ""}
                  onChange={(e) => handleInputChange("sixMonthGoal", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                >
                  <option value="">Select goal...</option>
                  <option value="Launch MVP">Launch MVP to get initial user feedback</option>
                  <option value="First 10 Customers">Acquire first 10 paying customers</option>
                  <option value="Raise Funding">Build prototype to raise Seed/Angel funding</option>
                  <option value="Scale & Stabilize">Optimize scaling and system stability</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Monetization Strategy <span className="text-destructive">*</span>
                </label>
                <select
                  value={answers.monetization || ""}
                  onChange={(e) => handleInputChange("monetization", e.target.value)}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                >
                  <option value="">Select monetization...</option>
                  <option value="Subscription">Monthly/Annual SaaS Subscription</option>
                  <option value="Transaction Fee">Commission / Transaction Fee</option>
                  <option value="Usage-based">Usage-based / API Credits</option>
                  <option value="Freemium">Freemium model (features behind paywall)</option>
                  <option value="Other">Other / Licensing / Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  What does success look like for this launch? <span className="text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  value={answers.successCriteria || ""}
                  onChange={(e) => handleInputChange("successCriteria", e.target.value)}
                  onBlur={handleBlur}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon focus:outline-none"
                  placeholder="e.g. 50 active pilot companies, 5% conversion to paid plans, or securing angel backing."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & SUBMIT */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-neon-gradient">Review & Confirm</h2>
            <p className="text-xs text-muted-foreground">Please double check your inputs. Once generated, your blueprint will lock.</p>
            
            <div className="rounded-xl border border-border bg-background/50 p-5 space-y-4 max-h-[30vh] overflow-y-auto text-xs text-foreground/90 leading-relaxed">
              <div>
                <span className="font-semibold text-neon">Founder:</span> {answers.founderName || "N/A"} ({answers.founderRole || "N/A"})
              </div>
              {answers.linkedinUrl && (
                <div>
                  <span className="font-semibold text-neon">LinkedIn:</span> {answers.linkedinUrl}
                </div>
              )}
              <div>
                <span className="font-semibold text-neon">Startup Name:</span> {answers.startupName || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-neon">Industry/Niche:</span> {
                  (() => {
                    const currentInd = getSelectedIndustries();
                    return currentInd.map(i => i === "Other" ? `Other (${answers.industryNicheOther || ""})` : i).join(", ") || "N/A";
                  })()
                }
              </div>
              <div>
                <span className="font-semibold text-neon">Target Audience:</span> {
                  answers.targetAudience === "Other"
                    ? `Other (${answers.targetAudienceOther || ""})`
                    : answers.targetAudience || "N/A"
                }
              </div>
              <div>
                <span className="font-semibold text-neon">Funding Stage:</span> {
                  answers.fundingStage === "Other"
                    ? `Other (${answers.fundingStageOther || ""})`
                    : answers.fundingStage || "N/A"
                }
              </div>
              <div>
                <span className="font-semibold text-neon">Problem Description:</span> {answers.problemDescription || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-neon">Product Summary:</span> {answers.productDescription || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-neon">Core MVP Features:</span> {answers.mvpFeatures || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-neon">Six Month Goal:</span> {answers.sixMonthGoal || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-neon">Monetization:</span> {answers.monetization || "N/A"}
              </div>
              {answers.successCriteria && (
                <div>
                  <span className="font-semibold text-neon">Success Criteria:</span> {answers.successCriteria}
                </div>
              )}
            </div>

            {/* Read-only Warning Alert */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3 text-amber-800 dark:text-amber-200">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold text-amber-900 dark:text-amber-300">Generation is final.</span> Once generated:
                <ul className="list-disc pl-4 mt-1 space-y-1 text-amber-700 dark:text-amber-300/90">
                  <li>Your blueprint inputs become strictly read-only. No edits are allowed.</li>
                  <li>Our AI will analyze your scope and validate technical requirements.</li>
                  <li>Your PDF blueprint will compile immediately.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-neon py-3.5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Blueprint with AI...
                </>
              ) : (
                <>
                  Generate My Blueprint <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Validation Error Message */}
        {validationError && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-semibold">
            {validationError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between border-t border-border pt-5">
          {step > 1 ? (
            <button
              onClick={prevStep}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold hover:bg-muted transition disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
            >
              Continue Building <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div />
          )}
        </div>

        </>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DASHBOARD VIEW (COMPLETED STATE) — Version 2.0
// ─────────────────────────────────────────────────────────────────────────────

function DashboardView({ 
  user, 
  assessment, 
  onLogout,
  onRefresh
}: { 
  user: any; 
  assessment: any; 
  onLogout: () => void; 
  onRefresh: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "strategy" | "next-steps">("overview");
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [linkedinPostUrl, setLinkedinPostUrl] = useState("");
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const { open: openContactModal } = useDemoModal();

  const handleRequestUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinPostUrl.trim()) return;

    setUnlockSubmitting(true);
    try {
      const res = await requestBlueprintUnlockAction({
        data: { linkedinUrl: linkedinPostUrl }
      });
      if (res.success) {
        setUnlockSuccess(true);
        setTimeout(() => {
          setIsUnlockModalOpen(false);
          onRefresh();
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit unlock request. Please try again.");
    } finally {
      setUnlockSubmitting(false);
    }
  };

  const hasRequestedUnlock = !!assessment.unlockRequestedAt;

  const PromoUnlockBanner = () => (
    <div className="rounded-xl border border-neon/30 bg-gradient-to-r from-neon/10 to-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon/10 border border-neon/20 text-neon">
          <Lock className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">Made a typo or want to edit your answers?</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasRequestedUnlock 
              ? "Your request is pending review. We will verify your post and unlock editing within the next 6 hours."
              : "Share your experience working with this tool on LinkedIn to unlock editing capabilities."}
          </p>
        </div>
      </div>
      <div>
        {hasRequestedUnlock ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Pending Review
          </span>
        ) : (
          <button
            onClick={() => {
              setUnlockSuccess(false);
              setLinkedinPostUrl("");
              setIsUnlockModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neon px-4 py-2 text-xs font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 shrink-0"
          >
            Unlock Editing 🔓
          </button>
        )}
      </div>
    </div>
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadPdfBlueprint();
      if (res.success && res.base64) {
        const blob = base64ToBlob(res.base64, "application/pdf");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.fileName || "MehdiGolzari_GoToLaunch_Blueprint.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to download PDF report. Please contact support.");
    } finally {
      setDownloading(false);
    }
  };

  const base64ToBlob = (base64: string, contentType: string) => {
    const sliceSize = 1024;
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const formattedDate = assessment.submittedAt
    ? new Date(assessment.submittedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const analysis = assessment.reportData as QwenAnalysisResult | null;

  // Pre-filled LinkedIn post copywriting
  const startupName = assessment.answers?.startupName || "my startup";
  const phaseName = analysis?.recommendedPhase || "Validate";
  const currentStage = analysis?.currentStage || "Pre-product validation";
  const reasoning = analysis?.recommendedPhaseReasoning || "";

  const postText = `🚀 Just completed the Go-to-Launch Blueprint™ by Mehdi Golzari (mehdigolzari.dev) to map the execution strategy for my startup, ${startupName}.

My project slot is: ${phaseName.toUpperCase()}™ (${currentStage})

Here's the direct, independent technical recommendation I received:
"${reasoning}"

If you're an early-stage founder building SaaS or AI, I highly recommend building your blueprint here: https://mehdigolzari.dev

#startup #saas #buildinginpublic #technicalfounder`;

  const downloadPostImage = (phase: string, stage: string, nameOfStartup: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, "#09090b");
    grad.addColorStop(0.5, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);

    // 2. Glowing Orbs
    ctx.globalCompositeOperation = "screen";
    const orb = ctx.createRadialGradient(200, 150, 50, 200, 150, 400);
    orb.addColorStop(0, "rgba(99, 102, 241, 0.15)");
    orb.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(200, 150, 400, 0, Math.PI * 2);
    ctx.fill();

    const orb2 = ctx.createRadialGradient(1000, 450, 50, 1000, 450, 400);
    orb2.addColorStop(0, "rgba(168, 85, 247, 0.15)");
    orb2.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = orb2;
    ctx.beginPath();
    ctx.arc(1000, 450, 400, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // 3. Branded Header
    ctx.font = "bold 32px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("MehdiGolzari", 80, 90);
    ctx.fillStyle = "#a855f7";
    ctx.fillText(".dev", 280, 90);

    // Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 130);
    ctx.lineTo(1120, 130);
    ctx.stroke();

    // 4. Title
    ctx.font = "normal 20px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("GO-TO-LAUNCH BLUEPRINT™", 80, 180);

    // 5. Startup Name
    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(nameOfStartup, 80, 245);

    // 6. Phase Recommendation
    ctx.font = "normal 18px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("RECOMMENDED FRAMEWORK PHASE:", 80, 340);

    ctx.font = "bold 72px sans-serif";
    const neonGrad = ctx.createLinearGradient(80, 0, 800, 0);
    neonGrad.addColorStop(0, "#38bdf8");
    neonGrad.addColorStop(1, "#a855f7");
    ctx.fillStyle = neonGrad;
    ctx.fillText(`${phase.toUpperCase()}™`, 80, 425);

    ctx.font = "italic 28px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`(${stage})`, 80, 480);

    // 7. Footer Call to Action
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.moveTo(80, 530);
    ctx.lineTo(1120, 530);
    ctx.stroke();

    ctx.font = "normal 18px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Get your Go-to-Launch Blueprint™ at MehdiGolzari.dev", 80, 580);

    // Trigger Download
    const link = document.createElement("a");
    link.download = `MehdiGolzari_${phase.replace(/[^a-zA-Z0-9]/g, "_")}_Phase_Cover.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Target },
    { id: "strategy" as const, label: "Technical Strategy", icon: Wrench },
    { id: "next-steps" as const, label: "Next Steps", icon: Rocket },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-neon font-semibold uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" /> Go-to-Launch Blueprint™
          </div>
          <h1 className="font-display text-2xl font-bold mt-1">Blueprint Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Generated on {formattedDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg bg-neon px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-50"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {downloading ? "Generating..." : "Download Blueprint"}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Promoted Section: Unlock Editing (Top) */}
      <div className="mb-8">
        <PromoUnlockBanner />
      </div>

      {analysis ? (
        <>
          {/* Phase Recommendation Banner */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-neon/5 p-5 sm:p-6 mb-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-neon opacity-10 blur-2xl" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neon to-primary text-white shadow-lg">
                <Zap className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider">Founder-to-Launch Framework™</span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="rounded-lg bg-neon/15 border border-neon/30 px-3 py-1 font-mono text-sm font-bold text-neon">
                    {analysis.recommendedPhase.toUpperCase()}™
                  </span>
                  <span className="text-xs text-muted-foreground">({analysis.currentStage})</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{analysis.recommendedPhaseReasoning}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 rounded-xl bg-muted/50 p-1 mb-8 border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── TAB: OVERVIEW ─── */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Executive Summary */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
                  <Brain className="h-5 w-5 text-neon" /> Executive Summary
                </h2>
                <p className="text-sm text-foreground/90 leading-relaxed">{analysis.executiveSummary}</p>
              </section>

              {/* Founder Strengths */}
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
                  <Shield className="h-5 w-5 text-emerald-500" /> Founder Strengths
                </h2>
                <div className="space-y-2.5">
                  {analysis.founderStrengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/15 p-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/90">{strength}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Biggest Opportunities */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
                  <TrendingUp className="h-5 w-5 text-neon" /> Biggest Opportunities
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {analysis.biggestOpportunities.map((opp, idx) => (
                    <div key={idx} className="rounded-xl border border-neon/15 bg-neon/5 p-5 hover:border-neon/30 transition-colors">
                      <h3 className="text-sm font-semibold text-neon mb-2">{opp.title}</h3>
                      <p className="text-xs text-foreground/80 leading-relaxed">{opp.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* What Could Slow You Down */}
              <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" /> What Could Slow You Down
                </h2>
                <div className="space-y-4">
                  {analysis.whatCouldSlowYouDown.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-amber-500/15 bg-background/50 p-5">
                      <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">{item.risk}</h3>
                      <div className="grid gap-3 sm:grid-cols-2 text-xs text-foreground/80">
                        <div className="rounded-lg bg-amber-500/5 p-3 border border-amber-500/10">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Business Impact</span>
                          <p className="mt-1 leading-relaxed">{item.businessImpact}</p>
                        </div>
                        <div className="rounded-lg bg-amber-500/5 p-3 border border-amber-500/10">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Technical Impact</span>
                          <p className="mt-1 leading-relaxed">{item.technicalImpact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ─── TAB: TECHNICAL STRATEGY ─── */}
          {activeTab === "strategy" && (
            <div className="space-y-8">
              {/* Technical Partnership Insights */}
              <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-neon/5 p-6 sm:p-8">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-1">
                  <Lightbulb className="h-5 w-5 text-neon" /> Technical Partnership Insights
                </h2>
                <p className="text-xs text-muted-foreground mb-5">Mehdi's direct priorities as your Independent Technical Partner</p>
                <div className="space-y-3">
                  {analysis.ifThisWereMyStartup.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-xl bg-card border border-border p-4 shadow-sm">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neon/15 text-neon text-xs font-bold">{idx + 1}</span>
                      <p className="text-sm text-foreground/90 leading-relaxed pt-0.5">{point}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Engineering Strategy */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
                  <Wrench className="h-5 w-5 text-neon" /> Engineering Strategy
                </h2>
                <div className="space-y-4">
                  {analysis.engineeringStrategy.map((strat, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-background/50 p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-neon" />
                        {strat.area}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 text-xs">
                        <div className="rounded-lg bg-neon/5 p-3 border border-neon/10">
                          <span className="font-semibold text-neon block mb-1">Recommendation</span>
                          <p className="text-foreground/80 leading-relaxed">{strat.recommendation}</p>
                        </div>
                        <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                          <span className="font-semibold text-primary block mb-1">Why</span>
                          <p className="text-foreground/80 leading-relaxed">{strat.why}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ─── TAB: NEXT STEPS ─── */}
          {activeTab === "next-steps" && (
            <div className="space-y-8">
              {/* Fastest Path to Launch */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
                  <Rocket className="h-5 w-5 text-neon" /> Fastest Path to Launch
                </h2>
                <div className="space-y-3">
                  {analysis.fastestPathToLaunch.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border border-border bg-background/50 p-4 hover:border-neon/20 transition-colors">
                      <Zap className="h-4 w-4 text-neon shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/90 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )}

          {/* Discovery Session CTA (Always Visible) */}
          <section className="rounded-2xl border border-neon/20 bg-gradient-to-br from-card to-neon/5 p-6 sm:p-8 relative overflow-hidden mt-8">
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-neon opacity-5 blur-3xl" />
            <h2 className="font-display text-lg font-semibold mb-2">Continue Your Go-to-Launch Journey</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-2xl">
              Your Blueprint is the beginning—not the final answer. During a Discovery Session, we will review it together, challenge key assumptions, refine your MVP scope, prioritize highest-value features, reduce execution risk, and build a practical launch plan. The objective is not to sell development services. The objective is to help you launch with greater confidence—in weeks, not months.
            </p>
            <div className="flex flex-wrap gap-3 mb-6 text-xs text-foreground/80">
              {[
                "Challenge key product assumptions",
                "Refine your MVP scope",
                "Prioritize highest-value features",
                "Identify technical risks early",
                "Design the fastest path to launch",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5">
                  <CheckCircle className="h-3 w-3 text-emerald-500" /> {item}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openContactModal}
                className="flex items-center justify-center gap-2 rounded-xl bg-neon px-6 py-3 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
              >
                <Calendar className="h-4 w-4" /> Review My Blueprint Together
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted transition disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                Download Blueprint
              </button>
            </div>
          </section>

          {/* Promoted Section: Unlock Editing (Bottom) */}
          <div className="mt-8">
            <PromoUnlockBanner />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Blueprint data is being processed. Please refresh in a few moments.</p>
        </div>
      )}

      {/* ─── EDITING UNLOCK MODAL ─── */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsUnlockModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              ✕
            </button>

            {unlockSuccess ? (
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                  <CheckCircle className="h-5 w-5 shrink-0" /> Request Submitted Successfully!
                </div>
                
                {/* Amber-styled message block */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                  <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    We will review your post and unlock editing for you in the next 6 hours.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsUnlockModalOpen(false)}
                    className="rounded-lg bg-neon px-4 py-2 text-xs font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestUnlock} className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    Unlock Blueprint Editing 🔓
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Share your blueprint result on LinkedIn to request editing permissions. We've prepared everything for you:
                  </p>
                </div>

                {/* STEP 1: Copy Text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground/80">
                    <span>1. Copy Pre-Written Post Text</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(postText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-neon flex items-center gap-1 hover:underline font-bold animate-pulse"
                    >
                      {copied ? "✓ Copied!" : "📋 Copy Text"}
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto rounded-lg border border-border bg-background p-2.5 text-[11px] text-muted-foreground font-mono leading-relaxed select-all">
                    {postText}
                  </div>
                </div>

                {/* STEP 2: Cover Image */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground/80">
                    <span>2. Branded Post Cover Image</span>
                    <button
                      type="button"
                      onClick={() => downloadPostImage(phaseName, currentStage, startupName)}
                      className="text-neon flex items-center gap-1 hover:underline font-bold"
                    >
                      📥 Download PNG
                    </button>
                  </div>
                  <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      Attach this styled layout graphic to your LinkedIn post to boost engagement.
                    </p>
                    <button
                      type="button"
                      onClick={() => downloadPostImage(phaseName, currentStage, startupName)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-neon/30 bg-neon/5 hover:bg-neon/10 text-neon px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Download Cover Graphic
                    </button>
                  </div>
                </div>

                {/* STEP 3: Share Button */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-foreground/80">
                    <span>3. Post on LinkedIn</span>
                  </div>
                  <a
                    href="https://www.linkedin.com/feed/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-neon px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
                  >
                    Open LinkedIn Feed to Post 🚀
                  </a>
                </div>

                {/* STEP 4: URL Input */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <label className="block text-xs font-semibold text-foreground/80">
                    4. Paste LinkedIn Post URL <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={linkedinPostUrl}
                    onChange={(e) => setLinkedinPostUrl(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
                    placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUnlockModalOpen(false)}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={unlockSubmitting || !linkedinPostUrl.trim()}
                    className="rounded-lg bg-neon px-4 py-2 text-xs font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {unlockSubmitting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
