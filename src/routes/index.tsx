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
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Most agencies
                </div>
                <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {["Sales team", "Account manager", "Project manager", "Tech lead", "Developer", "→ You"].map(
                    (s) => (
                      <li key={s} className="rounded-md border border-border bg-background/40 px-3 py-1.5">
                        {s}
                      </li>
                    ),
                  )}
                </ol>
                <div className="mt-6 font-mono text-xs uppercase tracking-widest text-neon-gradient">
                  MehdiGolzari.dev
                </div>
                <ol className="mt-3 space-y-1.5 text-sm">
                  <li className="rounded-md border border-[color:var(--neon)]/40 bg-background px-3 py-2 font-semibold shadow-neon">
                    Mehdi → You
                  </li>
                </ol>
                <p className="mt-5 text-xs text-muted-foreground">
                  Fewer layers. Faster decisions. Better products.
                </p>
              </div>
            </div>
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
