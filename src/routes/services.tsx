import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Rocket,
  Brain,
  Handshake,
  LifeBuoy,
  TrendingUp,
  Compass,
  Check,
  Clock,
  Users,
  Target,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { DemoButton } from "@/lib/demo-modal";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Offers — Ways to Work Together | MehdiGolzari.dev" },
      {
        name: "description",
        content:
          "Six ways founders work with me directly: SaaS MVP, AI MVP, technical partnership, SaaS rescue, product scaling, and fractional CTO — with transparent monthly pricing.",
      },
      { property: "og:title", content: "Offers — MehdiGolzari.dev" },
      {
        property: "og:description",
        content:
          "Direct engineering offers for founders: MVPs, AI products, scaling, rescue and fractional CTO — transparent pricing.",
      },
    ],
  }),
  component: ServicesPage,
});

type Service = {
  icon: typeof Rocket;
  tag: string;
  title: string;
  pitch: string;
  overview: string;
  deliverables: string[];
  idealFor: string;
  timeline: string;
  outcome: string;
};

const SERVICES: Service[] = [
  {
    icon: Rocket,
    tag: "Build",
    title: "SaaS MVP Development",
    pitch: "Production-ready MVPs in weeks instead of months.",
    overview:
      "I take a validated idea and turn it into a real, deployable SaaS product founders can show to users, investors, and design partners. Architecture decisions are made for where you're going — not just where you are today — so the MVP doesn't have to be thrown away the moment you find traction.",
    deliverables: [
      "Product discovery & scope locking",
      "System & domain architecture",
      "Backend, REST/GraphQL APIs",
      "Database design & migrations",
      "Authentication, roles & billing-ready foundation",
      "Cloud deployment, CI/CD, monitoring",
      "Technical documentation & handover",
    ],
    idealFor: "First-time and non-technical founders launching their first SaaS.",
    timeline: "4–10 weeks, milestone-based.",
    outcome: "A live, paying-customer-ready product with a clean codebase you fully own.",
  },
  {
    icon: Brain,
    tag: "Build",
    title: "AI MVP Development",
    pitch: "Modern LLM products done right — built to actually work in production.",
    overview:
      "Going from a ChatGPT prompt demo to a reliable AI product is where most teams stall. I design AI systems with the same rigor as any other backend: evaluations, guardrails, observability, cost control, and graceful fallbacks. The result is an AI product that holds up under real user traffic — not just a flashy demo.",
    deliverables: [
      "LLM-powered assistants & copilots",
      "AI dashboards and internal tools",
      "Document processing & RAG pipelines",
      "Vector search and knowledge bases",
      "Workflow automation & AI agents",
      "Integrations with OpenAI, Anthropic, Azure AI",
      "Prompt evaluation, logging & cost tracking",
    ],
    idealFor: "Founders building AI-native SaaS or adding AI to an existing product.",
    timeline: "3–8 weeks for a focused AI MVP.",
    outcome: "An AI feature or product that's accurate, observable, and safe to put in front of users.",
  },
  {
    icon: Handshake,
    tag: "Partner",
    title: "Independent Technical Partnership",
    pitch: "Long-term collaboration as your trusted engineering partner.",
    overview:
      "For founders who don't just need code — they need someone in their corner making the right technical calls over months and years. I work alongside you on roadmap, architecture, hiring, and trade-offs, so the product keeps moving in the right direction even as the team and the market change.",
    deliverables: [
      "Ongoing technical decision-making",
      "Product & feature planning sessions",
      "Architecture and code reviews",
      "Feature prioritization with business in mind",
      "Stack and vendor selection",
      "Engineering leadership & mentorship",
      "Direct WhatsApp / email access",
    ],
    idealFor: "Founders who've shipped an MVP and want a senior partner for the long game.",
    timeline: "Monthly retainer, often quarterly commitment.",
    outcome: "Confident technical decisions, fewer wrong turns, faster shipping.",
  },
  {
    icon: LifeBuoy,
    tag: "Recover",
    title: "SaaS Rescue",
    pitch: "Recover projects from broken architecture or missed deadlines.",
    overview:
      "When a previous agency or team left things in a difficult state — slow features, fragile deploys, unhappy users — I come in to stabilize the codebase, finish what matters, and put the project back on a healthy trajectory. The goal is honest assessment first, surgical fixes second, and a realistic plan you can act on.",
    deliverables: [
      "Full architecture & code audit",
      "Risk and technical-debt report",
      "Critical bug & stability fixes",
      "Scalability and security patches",
      "Refactoring to safer foundations",
      "Recovery roadmap with milestones",
      "Optional ongoing ownership",
    ],
    idealFor: "Founders inheriting a SaaS that's painful to change or unreliable in production.",
    timeline: "2–6 weeks for stabilization; longer for full refactor.",
    outcome: "A codebase you can ship into again, with a clear path forward.",
  },
  {
    icon: TrendingUp,
    tag: "Scale",
    title: "Product Scaling",
    pitch: "Take a growing SaaS to the next stage of load and reliability.",
    overview:
      "Growth exposes everything. Slow queries, fragile services, scary deploys, security gaps. I work on the parts that quietly limit your business — performance, infrastructure, data, and process — so you can grow users and revenue without growing fear of the next outage.",
    deliverables: [
      "Performance profiling & optimization",
      "Architecture evolution (modular / microservices)",
      "Security review & hardening",
      "Cloud infrastructure (AWS / Azure)",
      "Database tuning, indexing, sharding",
      "Observability: logs, metrics, alerts",
      "CI/CD pipelines and release safety",
    ],
    idealFor: "SaaS teams with real users hitting growth ceilings.",
    timeline: "Project-based or fractional, usually 6–12 weeks of focus.",
    outcome: "Faster product, calmer on-call, safer releases.",
  },
  {
    icon: Compass,
    tag: "Lead",
    title: "Fractional CTO",
    pitch: "Senior engineering leadership for growth-stage startups.",
    overview:
      "Not every startup needs — or can afford — a full-time CTO yet. I step in as your acting CTO for a few days a week: setting technical strategy, building or mentoring the team, owning architecture standards, and translating business goals into an engineering roadmap.",
    deliverables: [
      "Engineering strategy & vision",
      "Team structure & hiring plans",
      "Technical interviews & onboarding",
      "Architecture governance & standards",
      "Quarterly technical roadmap",
      "Vendor, infra & cost decisions",
      "Board / investor technical reporting",
    ],
    idealFor: "Funded startups between first hires and a full-time CTO.",
    timeline: "Fractional retainer, typically 2–4 days per week.",
    outcome: "Engineering that runs like a real org — not a series of fire drills.",
  },
];

function ServicesPage() {
  return (
    <div>
      <section className="bg-hero">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24 text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
            Engagements
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Ways to <span className="text-neon-gradient">work together</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Six focused engagement models — from launching an MVP to acting as your fractional
            CTO. Every one of them means you work directly with me. No sales team. No project
            manager in between.
          </p>
          <div className="mt-7 flex justify-center">
            <DemoButton className="px-6 py-3.5 text-base">
              Book a Discovery Call <ArrowRight className="ml-2 h-4 w-4" />
            </DemoButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map(
            ({ icon: Icon, tag, title, pitch, overview, deliverables, idealFor, timeline, outcome }) => (
              <article
                key={title}
                className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-card"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neon shadow-neon">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-neon">
                      {tag}
                    </div>
                    <h2 className="font-display text-xl font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{pitch}</p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-foreground/85">{overview}</p>

                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    What's included
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-foreground/90">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-3">
                  <Meta icon={Users} label="Ideal for" value={idealFor} />
                  <Meta icon={Clock} label="Timeline" value={timeline} />
                  <Meta icon={Target} label="Outcome" value={outcome} />
                </div>
              </article>
            ),
          )}
        </div>

        <div className="mt-14 rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Not sure which fits? Let's talk first.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            A 30-minute discovery call usually makes the right path obvious — and there's no
            obligation to continue.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <DemoButton>Book Discovery Call</DemoButton>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              About Mehdi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-xs leading-relaxed text-foreground/85">{value}</div>
      </div>
    </div>
  );
}
