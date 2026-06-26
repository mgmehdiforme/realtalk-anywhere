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
  Mail,
  Clock,
  Calendar,
  Gauge,
  Cpu,
  Wifi,
} from "lucide-react";
import { DemoButton } from "@/lib/demo-modal";

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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-2 py-2.5">
      <div className="font-display text-lg font-semibold text-neon-gradient">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

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
              <span className="text-neon-gradient font-semibold">Independent Technical Partner</span>
              <span className="opacity-50">·</span> Senior Engineer · AI & SaaS
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Work directly with the engineer{" "}
              <span className="text-neon-gradient">building your product.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              MehdiGolzari.dev is not a software agency. It's a senior engineer helping founders
              design, build and scale SaaS and AI products — from idea to production launch.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <DemoButton className="px-6 py-3.5 text-base">
                Book a Free Discovery Call <ArrowRight className="ml-2 h-4 w-4" />
              </DemoButton>
              <Link
                to="/services"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card"
              >
                See services
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
            <div className="relative rounded-2xl border border-border bg-card/70 p-6 shadow-card backdrop-blur">
              <div className="absolute -inset-px rounded-2xl bg-neon opacity-20 blur-2xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs uppercase tracking-widest text-neon-gradient">
                    /engagement.json
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400/70" />
                    <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  </div>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-background/60 p-4 font-mono text-[12.5px] leading-relaxed text-foreground/90">
{`{
  "engineer":   "Mehdi Golzari",
  "role":       "Senior · .NET · AI",
  "experience": "10+ years",
  "stack":      [".NET", "Node", "React",
                 "Python", "OpenAI"],
  "model":      "direct → you",
  "agency":     false,
  "available":  true
}`}
                </pre>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <Stat value="10+" label="Years" />
                  <Stat value="70k" label="Users served" />
                  <Stat value="0" label="Middlemen" />
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
            { icon: Award, title: "Letter of Appreciation", body: "Iran Khodro Co. — 70,000+ employees" },
            { icon: ShieldCheck, title: "OWASP Top 10 certified", body: "Secure-by-default architecture" },
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

      {/* DIRECT EXECUTION — redesigned comparison */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
              Direct execution model
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Five layers between you and your product — <span className="text-neon-gradient">or one.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every layer adds cost, lag and lost context. I work the way founders actually need: one
              senior engineer, end-to-end.
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
                {[
                  "Sales team",
                  "Account manager",
                  "Project manager",
                  "Tech lead",
                  "Developer",
                ].map((s, i) => (
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
                ))}
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
              <div className="absolute -inset-px rounded-2xl bg-neon opacity-10 blur-2xl" aria-hidden />
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
                    {[
                      "Direct chat",
                      "Same-day decisions",
                      "Full context",
                      "Owns the code",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-1.5 text-foreground/90">
                        <Check className="h-3.5 w-3.5 text-neon" /> {t}
                      </li>
                    ))}
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
                Software development isn't the product. <span className="text-neon-gradient">Execution is.</span>
              </h2>
              <p className="mt-5 text-muted-foreground">
                You're not buying programming hours — you're buying faster time-to-market, better
                technical decisions, lower risk and scalable architecture from someone who's done it
                before.
              </p>
              <div className="mt-7">
                <DemoButton>Book a Discovery Call</DemoButton>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {[
                { icon: Zap, title: "Faster execution", body: "Direct communication. No coordination overhead between you and the code." },
                { icon: ShieldCheck, title: "Lower risk", body: "10+ years building production systems — Clean Architecture, DDD, microservices." },
                { icon: Code2, title: "Right tech choices", body: ".NET, Node, React, Postgres, AI/LLM — picked for your business, not my preferences." },
                { icon: Globe, title: "Built to scale", body: "Architectures that survive growth — performance, security, cloud, deployment pipelines." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
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
            { n: "01", title: "Discovery call", body: "Free 30-min call. We discuss your idea, constraints and goals." },
            { n: "02", title: "Technical proposal", body: "Architecture, stack, timeline and a transparent scope you can act on." },
            { n: "03", title: "Build", body: "Iterative delivery directly with me — demos, code reviews, async updates." },
            { n: "04", title: "Launch & scale", body: "Production deploy, monitoring, hand-off — or continue as your technical partner." },
          ].map(({ n, title, body }) => (
            <li key={n} className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="font-mono text-xs text-neon-gradient">{n}</div>
              <div className="mt-2 text-lg font-semibold">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* AVAILABILITY — soft response-time band */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-70" aria-hidden />
        <div className="absolute left-1/2 top-1/2 h-72 w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon opacity-10 blur-3xl" aria-hidden />
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
              Real answers from the same engineer who'll build your product — usually within minutes.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-7 shadow-card backdrop-blur transition hover:border-[color:var(--neon)]/40">
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-neon opacity-10 blur-2xl transition group-hover:opacity-20" aria-hidden />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="font-display text-2xl font-semibold">Under 10 minutes</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">WhatsApp · typical reply time</div>
                  <p className="mt-3 text-sm text-foreground/85">
                    Send a voice note, a screenshot, a half-formed idea — I'll read it and reply
                    myself.
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-7 shadow-card backdrop-blur transition hover:border-[color:var(--neon)]/40">
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-neon opacity-10 blur-2xl transition group-hover:opacity-20" aria-hidden />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[color:var(--neon)]/10 text-neon ring-1 ring-[color:var(--neon)]/30">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="font-display text-2xl font-semibold">Under 1 hour</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Email · typical reply time</div>
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

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-card sm:p-14">
          <div className="absolute -top-20 left-1/2 h-60 w-[80%] -translate-x-1/2 rounded-full bg-neon opacity-20 blur-3xl" aria-hidden />
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
