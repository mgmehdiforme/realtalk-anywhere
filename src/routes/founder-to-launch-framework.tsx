import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Zap,
  Layers,
  Search,
  Check,
  FileCode,
  Rocket,
  LineChart,
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/founder-to-launch-framework")({
  head: () => ({
    meta: [
      { title: "Founder-to-Launch Framework™ — Methodology | MehdiGolzari.dev" },
      {
        name: "description",
        content:
          "A structured, seven-phase engineering methodology designed to mitigate technical debt, eliminate scope creep, and ensure scalability for SaaS founders.",
      },
      { property: "og:title", content: "Founder-to-Launch Framework™ — MehdiGolzari.dev" },
      {
        property: "og:description",
        content:
          "Structured engineering methodology for SaaS and AI products. Minimize risk, maximize code quality.",
      },
    ],
  }),
  component: FrameworkPage,
});

const PHASES = [
  {
    icon: Search,
    phase: "Phase 1",
    name: "Discover",
    tagline: "Scoping & Product Boundaries",
    desc: "We define exactly what your MVP needs to be—and what it shouldn't be. This phase locks down the core value proposition and restricts the build scope to prevent bloated deadlines and budget overflow.",
    deliverables: ["Product Scope Document", "Core Feature List", "Boundary definition (In/Out)"],
  },
  {
    icon: UserCheck,
    phase: "Phase 2",
    name: "Validate",
    tagline: "Assumption Verification",
    desc: "Before writing core application code, we validate technical assumptions. This includes testing third-party APIs, LLM prompts, data source availability, and verifying that the foundational workflows are feasible.",
    deliverables: [
      "Technical Feasibility Report",
      "Spike/Proof-of-Concept code",
      "API integration tests",
    ],
  },
  {
    icon: Layers,
    phase: "Phase 3",
    name: "Blueprint",
    tagline: "System & Domain Architecture",
    desc: "We lay out the software blueprint. This contains domain entity mapping, database schema design, REST/GraphQL API contracts, and infrastructure diagrams. Coding starts only after the design is locked.",
    deliverables: [
      "Database entity schema (ERD)",
      "API Specifications",
      "Infrastructure & domain maps",
    ],
  },
  {
    icon: FileCode,
    phase: "Phase 4",
    name: "Build",
    tagline: "Production-Grade Engineering",
    desc: "The core development phase. I build the system following clean-code principles, writing modular components, and implementing automated testing. No shortcuts, no spaghetti code.",
    deliverables: [
      "Complete Git repository",
      "Comprehensive test suite",
      "Clean, self-documenting code",
    ],
  },
  {
    icon: Rocket,
    phase: "Phase 5",
    name: "Launch",
    tagline: "Deployment & CI/CD Setup",
    desc: "Your product goes live. I configure secure production cloud environments, set up continuous integration/deployment (CI/CD) pipelines, and integrate monitoring tools (logging, health checks).",
    deliverables: [
      "Live production deployment",
      "Automated deployment pipeline",
      "Uptime & performance alerts",
    ],
  },
  {
    icon: LineChart,
    phase: "Phase 6",
    name: "Scale",
    tagline: "Optimization & Growth Tuning",
    desc: "As users join, we monitor performance. We tune slow database queries, optimize cloud resource usage, set up redis caching, and refactor any bottleneck services to handle traffic spikes smoothly.",
    deliverables: [
      "Database tuning reports",
      "Caching layer (Redis)",
      "Auto-scaling configuration",
    ],
  },
  {
    icon: Compass,
    phase: "Phase 7",
    name: "Partner",
    tagline: "Strategic Tech Leadership",
    desc: "Long-term partnership. I act as your strategic advisor, helping you hire developers, manage the engineering roadmap, select future vendor stacks, and execute fractional CTO duties.",
    deliverables: [
      "Technical hiring templates",
      "Product strategy reviews",
      "Direct fractional CTO access",
    ],
  },
];

function FrameworkPage() {
  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-neon-gradient backdrop-blur">
            Our Methodology
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            The Founder-to-Launch <span className="text-neon-gradient">Framework™</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground">
            A structured, seven-phase product engineering methodology. Designed to eliminate the
            primary reason why software projects fail: unmanaged complexity and poor architectural
            planning.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/blueprint"
              className="inline-flex items-center justify-center rounded-xl bg-neon px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
            >
              Build Your Go-to-Launch Blueprint™ <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* WHY IT EXISTS */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Why the framework <span className="text-neon-gradient">exists</span>.
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Most software agencies and freelancers dive straight into coding without validating
              assumptions or structuring the domain architecture. This leads to codebases that are
              fragile, hard to change, and full of bugs.
            </p>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              The Founder-to-Launch Framework™ introduces engineering rigor early. By breaking the
              lifecycle down into seven clear, milestone-driven phases, we build features in the
              correct order, lock down scope, and establish code quality from day one.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-neon" />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">Zero Guesswork</div>
                  <div className="text-muted-foreground text-xs">
                    Everything is mapped and documented before build.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-neon" />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">No Scope Creep</div>
                  <div className="text-muted-foreground text-xs">
                    Rigid scope boundaries keep you on budget.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-card relative overflow-hidden">
            <div
              className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-neon-2 opacity-10 blur-3xl pointer-events-none"
              aria-hidden
            />
            <h3 className="font-display text-xl font-semibold text-neon-gradient">
              Core Philosophy
            </h3>
            <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
              "We write code only after we are 100% sure we are building the right thing, in the
              right way."
            </p>
            <ul className="mt-6 space-y-3.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-neon" /> Define MVP boundaries before code
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-neon" /> Clear technical audit of every integration
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-neon" /> Code is owned completely by the founder
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-neon" /> Standardized deployment pipelines
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SEVEN PHASES */}
      <section className="bg-card/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              The Seven <span className="text-neon-gradient">Phases</span>.
            </h2>
            <p className="mt-3 text-muted-foreground">
              A comprehensive blueprint mapping your startup from initial ideation to a fully scaled
              partnership.
            </p>
          </div>

          <div className="mt-14 space-y-8">
            {PHASES.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.name}
                  className="flex flex-col lg:flex-row gap-6 lg:gap-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card relative overflow-hidden transition hover:border-neon/30"
                >
                  <div className="flex lg:flex-col items-center gap-4 lg:w-32 shrink-0 text-center">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neon shadow-neon text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xs text-neon uppercase tracking-wider font-semibold">
                        {p.phase}
                      </div>
                      <div className="font-display text-xl font-bold mt-0.5">{p.name}</div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-neon-gradient">{p.tagline}</h4>
                    <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-8">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      Deliverables
                    </div>
                    <ul className="space-y-1.5">
                      {p.deliverables.map((d) => (
                        <li key={d} className="flex items-center gap-2 text-xs text-foreground/90">
                          <span className="h-1.5 w-1.5 rounded-full bg-neon shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BENEFITS & OUTCOMES */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Benefits & Expected <span className="text-neon-gradient">Outcomes</span>.
          </h2>
          <p className="mt-3 text-muted-foreground">
            What you get by building your software through a standardized process.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Absolute Security & IP Ownership",
              desc: "All source code, database structures, and cloud accounts are strictly owned by you. At launch, ownership transitions fully to your legal entities.",
            },
            {
              icon: Cpu,
              title: "Scalable Core Architecture",
              desc: "The software is designed for where you are going—not just where you are today. Build a solid core that won't require a total rewrite as you scale.",
            },
            {
              icon: Zap,
              title: "Rapid Execution Velocity",
              desc: "By removing planning friction and locking the project scope, we build faster. Focus strictly on launch deadlines without unnecessary delay.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-neon/30"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-neon/10 border border-neon/20 text-neon">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-12 text-center shadow-card">
          <div
            className="absolute -inset-4 rounded-3xl bg-neon opacity-5 blur-3xl pointer-events-none"
            aria-hidden
          />
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Ready to Build Your <span className="text-neon-gradient">Go-to-Launch Blueprint™</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Answer a few strategic questions about your startup and receive a personalized execution
            blueprint highlighting opportunities, technical risks, and the fastest path to launch.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/blueprint"
              className="inline-flex items-center justify-center rounded-xl bg-neon px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
            >
              Build My Blueprint <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
