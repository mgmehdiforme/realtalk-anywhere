import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Rocket, Brain, Handshake, LifeBuoy, TrendingUp, Compass, Check } from "lucide-react";
import { DemoButton } from "@/lib/demo-modal";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — SaaS & AI MVP Development, Scaling, Fractional CTO" },
      {
        name: "description",
        content:
          "Senior engineering services for SaaS founders: MVP development, AI products, technical partnership, SaaS rescue, scaling and fractional CTO support.",
      },
      { property: "og:title", content: "Services — MehdiGolzari.dev" },
      {
        property: "og:description",
        content: "SaaS MVPs, AI products, scaling, rescue and fractional CTO — direct from the engineer.",
      },
    ],
  }),
  component: ServicesPage,
});

const SERVICES = [
  {
    icon: Rocket,
    title: "SaaS MVP Development",
    pitch: "Production-ready MVPs in weeks instead of months.",
    deliverables: [
      "Product planning",
      "System architecture",
      "Backend & API development",
      "Database design",
      "Authentication",
      "Cloud deployment & docs",
    ],
  },
  {
    icon: Brain,
    title: "AI MVP Development",
    pitch: "Modern LLM products done right — built to actually work in production.",
    deliverables: [
      "AI assistants",
      "AI dashboards",
      "AI business tools",
      "Document processing",
      "Workflow automation",
      "AI integrations",
    ],
  },
  {
    icon: Handshake,
    title: "Independent Technical Partnership",
    pitch: "Long-term collaboration as your trusted engineering partner.",
    deliverables: [
      "Technical decision making",
      "Product planning",
      "Architecture reviews",
      "Feature prioritization",
      "Technology selection",
      "Engineering leadership",
    ],
  },
  {
    icon: LifeBuoy,
    title: "SaaS Rescue",
    pitch: "Recover projects from broken architecture or missed deadlines.",
    deliverables: [
      "Architecture audit",
      "Technical debt cleanup",
      "Scalability fixes",
      "Codebase stabilization",
      "Delivery recovery plan",
    ],
  },
  {
    icon: TrendingUp,
    title: "Product Scaling",
    pitch: "Take a growing SaaS to the next stage of load and reliability.",
    deliverables: [
      "Performance optimization",
      "Architecture evolution",
      "Security hardening",
      "Cloud infrastructure",
      "Database tuning",
      "CI/CD pipelines",
    ],
  },
  {
    icon: Compass,
    title: "Fractional CTO",
    pitch: "Senior engineering leadership for growth-stage startups.",
    deliverables: [
      "Engineering strategy",
      "Team mentoring",
      "Architecture governance",
      "Technical roadmap",
      "Hiring consultation",
    ],
  },
];

function ServicesPage() {
  return (
    <div>
      <section className="bg-hero">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24 text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">Services</div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            One engineer. <span className="text-neon-gradient">Every stage</span> of your product.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Whether you're validating an idea, rescuing a stalled codebase, or scaling a growing
            SaaS — you work directly with me from day one.
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
          {SERVICES.map(({ icon: Icon, title, pitch, deliverables }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-7 shadow-card">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neon shadow-neon">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{pitch}</p>
                </div>
              </div>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Not sure which fits? Let's talk first.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            A 30-minute discovery call usually makes the right path obvious.
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
