import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Rocket,
  Brain,
  Handshake,
  LifeBuoy,
  TrendingUp,
  Compass,
  MessageCircle,
  Code2,
  Zap,
  ShieldCheck,
  Globe,
  Award,
  Building2,
  Sparkles,
  X,
  Heart,
  Mail,
  Clock,
  Calendar,
  Gauge,
  Cpu,
  Wifi,
} from "lucide-react";
import { DemoButton } from "@/lib/demo-modal";
import avatarAsset from "@/assets/avatar.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MehdiGolzari.dev — Independent Technical Partner for SaaS Founders" },
      {
        name: "description",
        content:
          "Work directly with the senior engineer building your product. SaaS MVP development, AI MVP development, fractional CTO and product scaling — no agencies, no middlemen.",
      },
      { property: "og:title", content: "MehdiGolzari.dev — Independent Technical Partner" },
      {
        property: "og:description",
        content:
          "Founders should work directly with the engineer building their product. SaaS & AI MVPs, scaling, rescue, fractional CTO.",
      },
    ],
  }),
  component: Landing,
});

const SERVICES = [
  {
    icon: Rocket,
    title: "SaaS MVP Development",
    body: "Turn an idea into a production-ready MVP in weeks, not months. Architecture, backend, APIs, auth, cloud deploy.",
  },
  {
    icon: Brain,
    title: "AI MVP Development",
    body: "Modern LLM products done right — AI assistants, dashboards, document processing, workflow automation.",
  },
  {
    icon: Handshake,
    title: "Technical Partnership",
    body: "Long-term collaboration as your trusted engineer: roadmap, architecture, tech selection, engineering leadership.",
  },
  {
    icon: LifeBuoy,
    title: "SaaS Rescue",
    body: "Recover projects suffering from poor architecture, missed deadlines, technical debt or scalability issues.",
  },
  {
    icon: TrendingUp,
    title: "Product Scaling",
    body: "Performance, security, cloud infrastructure, databases and deployment pipelines built for growth.",
  },
  {
    icon: Compass,
    title: "Fractional CTO",
    body: "Engineering strategy, team mentoring, architecture governance, hiring — for growth-stage startups.",
  },
];

function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
              <span className="text-neon-gradient font-semibold">
                Independent Technical Partner
              </span>
              <span className="opacity-50">·</span> Senior Engineer · AI & SaaS
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Before you invest months building your startup,{" "}
              <span className="text-neon-gradient">build your Go-to-Launch Blueprint™ first.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Answer a few strategic questions and receive a personalized execution blueprint that
              highlights risks, opportunities, and the fastest path to launch.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/blueprint"
                className="inline-flex items-center justify-center rounded-xl bg-neon px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
              >
                Build My Blueprint Report | Free
              </Link>
              <Link
                to="/founder-to-launch-framework"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card"
              >
                Learn More
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No sales team", "No project managers", "No outsourcing"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-neon" /> {t}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              {/* Glow */}
              <div
                className="absolute -inset-4 rounded-3xl bg-neon opacity-20 blur-3xl"
                aria-hidden
              />

              {/* Identity card */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 shadow-card backdrop-blur">
                {/* Top status bar */}
                <div className="flex items-center justify-between border-b border-border bg-background/40 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-xs font-medium text-foreground/80">
                      Online · accepting projects
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    v10.0
                  </span>
                </div>

                {/* Profile */}
                <div className="px-6 pt-7">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={avatarAsset.url}
                        alt="Mehdi Golzari"
                        className="h-14 w-14 rounded-2xl object-cover shadow-neon ring-2 ring-[color:var(--neon)]/40"
                      />
                      <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-emerald-500 text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-lg font-semibold">Mehdi Golzari</div>
                      <div className="text-xs text-muted-foreground">
                        Senior Engineer · .NET · AI · SaaS
                      </div>
                    </div>
                  </div>

                  {/* Stack chips */}
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {[".NET", "Node", "React", "Python", "OpenAI", "Postgres"].map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-foreground/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Live metrics */}
                  <div className="mt-6 space-y-3">
                    {[
                      {
                        icon: Wifi,
                        label: "Avg. reply (WhatsApp)",
                        value: "< 10 min",
                        tone: "emerald",
                      },
                      {
                        icon: Gauge,
                        label: "MVP delivery",
                        value: "weeks, not months",
                        tone: "neon",
                      },
                      { icon: Cpu, label: "Engagement model", value: "direct → you", tone: "neon" },
                    ].map(({ icon: Icon, label, value, tone }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                          <Icon
                            className={`h-3.5 w-3.5 ${tone === "emerald" ? "text-emerald-500" : "text-neon"}`}
                          />
                          {label}
                        </div>
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats footer */}
                <div className="mt-6 grid grid-cols-3 border-t border-border bg-background/30 text-center">
                  {[
                    { v: "10+", l: "Years" },
                    { v: "70k", l: "Users served" },
                    { v: "0", l: "Middlemen" },
                  ].map(({ v, l }, i) => (
                    <div key={l} className={`px-3 py-4 ${i < 2 ? "border-r border-border" : ""}`}>
                      <div className="font-display text-xl font-semibold text-neon-gradient">
                        {v}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {[
            {
              icon: Award,
              title: "Letter of Appreciation",
              body: "Iran Khodro Co. — 70,000+ employees",
            },
            {
              icon: ShieldCheck,
              title: "OWASP Top 10 certified",
              body: "Secure-by-default architecture",
            },
            { icon: Building2, title: "Enterprise clients", body: "Vendoroo.Ai · ITShams · Manir" },
            { icon: Sparkles, title: "ISO 27001 aligned", body: "ISMS-compliant engineering" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background">
                <Icon className="h-4 w-4 text-neon" />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-muted-foreground">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOUNDER TO LAUNCH FRAMEWORK */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-neon-gradient">
              Methodology
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Every successful SaaS starts with a{" "}
              <span className="text-neon-gradient">structured process</span>.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Launching a product shouldn't be a guessing game. Every project I build follows the
              <strong> Founder-to-Launch Framework™</strong>—a structured engineering methodology
              designed to mitigate technical debt, eliminate scope creep, and ensure scalability.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              { phase: "01", name: "Discover", desc: "Scope locking and product boundaries." },
              { phase: "02", name: "Validate", desc: "Testing integrations and assumptions." },
              { phase: "03", name: "Blueprint", desc: "System and database architecture." },
              { phase: "04", name: "Build", desc: "Production-ready coding and tests." },
              { phase: "05", name: "Launch", desc: "CI/CD and production deployment." },
              { phase: "06", name: "Scale", desc: "Performance tuning and optimization." },
              { phase: "07", name: "Partner", desc: "Ongoing strategy and fractional CTO." },
            ].map((p, idx) => (
              <div
                key={p.name}
                className="relative flex flex-col rounded-2xl border border-border bg-card/50 p-5 transition hover:border-neon/30 hover:bg-card"
              >
                <div className="font-mono text-xs font-semibold text-neon">{p.phase}</div>
                <h3 className="mt-2 font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                {idx < 6 && (
                  <div className="hidden xl:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/30 font-display text-base">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/blueprint"
              className="inline-flex items-center justify-center rounded-xl bg-neon px-5 py-3 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
            >
              Build My Blueprint
            </Link>
            <Link
              to="/founder-to-launch-framework"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* NATIVE LANGUAGE CONVERSATIONS */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-25" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neon-gradient">
              <Globe className="h-3.5 w-3.5" /> No borders. No language wall.
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              I meet you in <span className="text-neon-gradient">your native language</span> —
              wherever you are.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Calls, Google Meet, WhatsApp voice — I run them in your country's language, in real
              time. Powered by a translation product I designed and use myself, so the conversation
              feels natural, not robotic.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Real-time voice translation on any call platform",
                "Built with my own AI tool — used daily, not theoretical",
                "Discovery calls in English, Spanish, French, German, Arabic, Portuguese, Japanese, Chinese…",
                "You speak normally. I understand you. We move forward.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Floating language orb */}
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div
              className="absolute inset-0 rounded-full bg-neon opacity-20 blur-3xl"
              aria-hidden
            />
            {/* Concentric rings */}
            <div className="absolute inset-6 rounded-full border border-[color:var(--neon)]/30" />
            <div className="absolute inset-16 rounded-full border border-[color:var(--neon)]/20" />
            <div className="absolute inset-28 rounded-full border border-[color:var(--neon)]/10" />

            {/* Center globe */}
            <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-neon text-primary-foreground shadow-neon">
              <Globe className="h-10 w-10" />
              <span className="absolute -bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              </span>
            </div>

            {/* Floating language chips */}
            {[
              { t: "Hola", flag: "🇪🇸", x: "8%", y: "12%" },
              { t: "Bonjour", flag: "🇫🇷", x: "70%", y: "6%" },
              { t: "こんにちは", flag: "🇯🇵", x: "82%", y: "44%" },
              { t: "你好", flag: "🇨🇳", x: "72%", y: "78%" },
              { t: "مرحبا", flag: "🇸🇦", x: "10%", y: "76%" },
              { t: "Olá", flag: "🇧🇷", x: "0%", y: "44%" },
              { t: "Guten Tag", flag: "🇩🇪", x: "40%", y: "0%" },
              { t: "Привет", flag: "🇷🇺", x: "44%", y: "90%" },
            ].map(({ t, flag, x, y }, i) => (
              <div
                key={t}
                className="absolute flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium shadow-card backdrop-blur"
                style={{
                  left: x,
                  top: y,
                  animation: `float 6s ease-in-out ${i * 0.4}s infinite alternate`,
                }}
              >
                <span className="text-sm leading-none">{flag}</span>
                <span className="text-foreground/90">{t}</span>
              </div>
            ))}

            <style>{`@keyframes float { from { transform: translateY(0) } to { transform: translateY(-8px) } }`}</style>
          </div>
        </div>
      </section>

      {/* DIRECT EXECUTION — redesigned comparison */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
              Direct execution model
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Two ways to build your product.{" "}
              <span className="text-neon-gradient">Which one is better?</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Side by side — the agency path most founders default to, and the direct path I offer.
              Same goal, very different cost, speed and clarity.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            {/* Most agencies */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-card backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Most agencies
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  5 layers
                </span>
              </div>
              <ol className="mt-5 space-y-2">
                {["Sales team", "Account manager", "Project manager", "Tech lead", "Developer"].map(
                  (s, i) => (
                    <li
                      key={s}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm text-muted-foreground"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        0{i + 1}
                      </span>
                      <span className="flex-1">{s}</span>
                      <X className="h-3.5 w-3.5 opacity-50" />
                    </li>
                  ),
                )}
                <li className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  <span className="font-mono text-[10px]">→</span>
                  <span className="flex-1 font-medium">You</span>
                </li>
              </ol>
              <p className="mt-5 text-xs text-muted-foreground">
                Long feedback loops. Diluted context. Your decisions translated three times.
              </p>
            </div>

            {/* MehdiGolzari.dev */}
            <div className="relative rounded-2xl border border-[color:var(--neon)]/40 bg-card p-6 shadow-neon">
              <div
                className="absolute -inset-px rounded-2xl bg-neon opacity-10 blur-2xl"
                aria-hidden
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs uppercase tracking-widest text-neon-gradient">
                    MehdiGolzari.dev
                  </div>
                  <span className="rounded-full bg-neon px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    1 layer
                  </span>
                </div>
                <div className="mt-5 rounded-xl border border-[color:var(--neon)]/40 bg-background p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-neon text-primary-foreground shadow-neon">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold">Mehdi → You</div>
                      <div className="text-xs text-muted-foreground">
                        Senior engineer · architect · partner
                      </div>
                    </div>
                  </div>
                  <ul className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {["Direct chat", "Same-day decisions", "Full context", "Owns the code"].map(
                      (t) => (
                        <li key={t} className="flex items-center gap-1.5 text-foreground/90">
                          <Check className="h-3.5 w-3.5 text-neon" /> {t}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
                <p className="mt-5 text-xs text-muted-foreground">
                  Fewer layers. Faster decisions. Better products.
                </p>
                <div className="mt-5">
                  <DemoButton className="w-full justify-center">
                    Book a free discovery call <ArrowRight className="ml-2 h-4 w-4" />
                  </DemoButton>
                </div>
              </div>
            </div>
          </div>

          {/* Outcome row */}
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
            {[
              { k: "~3×", v: "Faster decision loops" },
              { k: "0", v: "Coordination overhead" },
              { k: "100%", v: "Built by the engineer you hired" },
            ].map(({ k, v }) => (
              <div
                key={v}
                className="rounded-xl border border-border bg-card/60 p-5 text-center shadow-card backdrop-blur"
              >
                <div className="font-display text-2xl font-semibold text-neon-gradient">{k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
            What I do
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Enterprise-level engineering. Founder-level access.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Six ways founders work with me — from first MVP to growth-stage CTO support.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-[color:var(--neon)]/40"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-neon shadow-neon">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-neon-gradient"
          >
            Explore all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* WHY ME */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
                Why founders pick me
              </div>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                Software development isn't my main offer.{" "}
                <span className="text-neon-gradient">Execution is.</span>
              </h2>
              <p className="mt-5 text-muted-foreground">
                I move fast because I pair 10+ years of senior engineering with modern AI tools —
                seniority chooses the right path, AI shortens the road. Together they let me ship
                accurately, in a fraction of the usual time.
              </p>
              <p className="mt-4 text-muted-foreground">
                I'm a technical person — and quietly, a business one too. Years of hands-on
                marketing experience, plus Google{" "}
                <span className="text-foreground/90 font-medium">My Business</span> and
                <span className="text-foreground/90 font-medium"> Digital Garage</span>{" "}
                certifications, let me think about your product the way your customers will. I help
                you go from
                <span className="text-neon-gradient font-semibold"> zero to hero</span> — not just
                build software.
              </p>
              <p className="mt-4 text-muted-foreground">
                You'll also be working with an engineer who's been a{" "}
                <span className="text-foreground/90 font-medium">
                  core team member inside American startups
                </span>{" "}
                — the pace, the product instincts, the bar for quality. That experience comes with
                me into your product.
              </p>
              <div className="mt-5 space-y-2.5 text-sm">
                {[
                  {
                    icon: Calendar,
                    text: "Most engagements run monthly — some founders only need a focused week.",
                  },
                  { icon: Rocket, text: "Production-ready MVPs in weeks, not months." },
                  { icon: Sparkles, text: "AI-augmented delivery, senior-engineered decisions." },
                  {
                    icon: TrendingUp,
                    text: "Engineer + marketer mindset — built to ship and built to sell.",
                  },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2.5 text-foreground/85">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7">
                <DemoButton>Book a Discovery Call</DemoButton>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {[
                {
                  icon: Zap,
                  title: "Faster execution",
                  body: "Direct communication. No coordination overhead between you and the code.",
                },
                {
                  icon: ShieldCheck,
                  title: "Lower risk",
                  body: "10+ years building production systems — Clean Architecture, DDD, microservices.",
                },
                {
                  icon: Code2,
                  title: "Right tech choices",
                  body: ".NET, Node, React, Postgres, AI/LLM — picked for your business, not my preferences.",
                },
                {
                  icon: Globe,
                  title: "Built to scale",
                  body: "Architectures that survive growth — performance, security, cloud, deployment pipelines.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background">
                    <Icon className="h-5 w-5 text-neon" />
                  </div>
                  <div className="mt-4 font-semibold">{title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
            How it works
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            From first message to launched product.
          </h2>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              title: "Discovery call",
              body: "Free 30-min call. We discuss your idea, constraints and goals.",
            },
            {
              n: "02",
              title: "Technical proposal",
              body: "Architecture, stack, timeline and a transparent scope you can act on.",
            },
            {
              n: "03",
              title: "Build",
              body: "Iterative delivery directly with me — demos, code reviews, async updates.",
            },
            {
              n: "04",
              title: "Launch & scale",
              body: "Production deploy, monitoring, hand-off — or continue as your technical partner.",
            },
          ].map(({ n, title, body }) => (
            <li
              key={n}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <div className="font-mono text-xs text-neon-gradient">{n}</div>
              <div className="mt-2 text-lg font-semibold">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
            Investment
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Simple, transparent <span className="text-neon-gradient">pricing</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pricing is always a conversation — every project is a little different. Instead of
            locking you into rigid monthly overheads, we tie pricing directly to deliverables so you
            only pay for actual working results.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Main price card */}
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-8 shadow-card relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-neon opacity-10 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <div className="flex flex-wrap items-end gap-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-neon">
                  Pricing model
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold">Milestone-Based</span>
                <span className="text-muted-foreground">/ deliverables</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Zero hourly billing. We define clear delivery phases, and you only settle payments
                as milestones are met.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <PayStep
                  n="1"
                  title="Advance"
                  body="One third up-front to kick things off and lock the slot."
                  highlight
                />
                <PayStep
                  n="2"
                  title="Progress"
                  body="Work happens with full visibility — demos, docs, repo access."
                />
                <PayStep
                  n="3"
                  title="Final"
                  body="Remaining two thirds settled at the end, once you're happy."
                />
              </div>

              <div className="mt-7 rounded-2xl border border-border bg-background/60 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neon" />
                  <div className="text-sm text-foreground/85">
                    <span className="font-semibold text-foreground">
                      Full transparency, every step.
                    </span>{" "}
                    You receive documented updates and visible results on a regular cadence — so you
                    always know exactly where your money is going and what's been built.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Infra card */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card flex flex-col">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-neon shadow-neon">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">
              Development infrastructure on me.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              During the build, you don't pay for any of the moving parts behind the scenes.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                "Cloud hosting to run the app while we build",
                "Git repositories with live access for you",
                "Staging environments to review results online",
                "Tooling, CI/CD and monitoring during development",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 text-sm">
              <span className="font-semibold text-foreground">
                Free for you during development.
              </span>{" "}
              <span className="text-muted-foreground">
                At the end, everything migrates cleanly to your own accounts — code, cloud, data,
                all yours.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <DemoButton>Discuss Your Project</DemoButton>
          <Link
            to="/services"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:bg-muted"
          >
            See Offers <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* AVAILABILITY — soft response-time band */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-70" aria-hidden />
        <div
          className="absolute left-1/2 top-1/2 h-72 w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon opacity-10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Available now · replying personally
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              You message me. <span className="text-neon-gradient">I message back.</span>
              <br className="hidden sm:block" />
              No bots. No queues. No "we'll get back to you."
            </h2>
            <p className="mt-4 text-muted-foreground">
              Real answers from the same engineer who'll build your product — usually within
              minutes.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-7 shadow-card backdrop-blur transition hover:border-[color:var(--neon)]/40">
              <div
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-neon opacity-10 blur-2xl transition group-hover:opacity-20"
                aria-hidden
              />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="font-display text-2xl font-semibold">Under 10 minutes</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    WhatsApp · typical reply time
                  </div>
                  <p className="mt-3 text-sm text-foreground/85">
                    Send a voice note, a screenshot, a half-formed idea — I'll read it and reply
                    myself.
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-7 shadow-card backdrop-blur transition hover:border-[color:var(--neon)]/40">
              <div
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-neon opacity-10 blur-2xl transition group-hover:opacity-20"
                aria-hidden
              />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[color:var(--neon)]/10 text-neon ring-1 ring-[color:var(--neon)]/30">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="font-display text-2xl font-semibold">Under 1 hour</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Email · typical reply time
                  </div>
                  <p className="mt-3 text-sm text-foreground/85">
                    Long brief, scope, proposal — a thoughtful response from me, not a templated
                    auto-reply.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neon" /> Ready to start this week
            </div>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-neon" /> Kickoff call within 24 hours
            </div>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-neon" /> Same person, every message
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <DemoButton className="px-6 py-3.5 text-base">
              Message me now <ArrowRight className="ml-2 h-4 w-4" />
            </DemoButton>
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="mx-auto max-w-5xl px-5 pb-10 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 shadow-card sm:p-12">
          <div
            className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-neon opacity-10 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-neon opacity-10 blur-3xl"
            aria-hidden
          />
          <div className="relative grid items-center gap-8 sm:grid-cols-[auto,1fr]">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-neon shadow-neon">
              <Heart className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-neon-gradient">
                My promise
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                You'll have the best time working together — that's a promise.
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                I genuinely love what I do, and I love helping ideas grow — in{" "}
                <span className="text-foreground font-medium">any industry</span>, at any stage.
                Expect calm communication, real ownership, and someone who treats your product like
                it's their own.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-card sm:p-14">
          <div
            className="absolute -top-20 left-1/2 h-60 w-[80%] -translate-x-1/2 rounded-full bg-neon opacity-20 blur-3xl"
            aria-hidden
          />
          <h2 className="relative font-display text-3xl font-semibold sm:text-4xl">
            Ready to build your product — with the engineer, not around them?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
            Tell me about your idea. 30 minutes, free, no sales pitch.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <DemoButton className="px-6 py-3.5 text-base">
              <MessageCircle className="mr-1 h-4 w-4" /> Book Discovery Call
            </DemoButton>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3.5 text-sm font-semibold transition hover:bg-muted"
            >
              About Mehdi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PayStep({
  n,
  title,
  body,
  highlight,
}: {
  n: string;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${highlight ? "border-neon/50 bg-neon/5" : "border-border bg-background/60"}`}
    >
      <div className="font-mono text-xs text-neon-gradient">Step {n}</div>
      <div className="mt-1 font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
