import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { DemoButton } from "@/lib/demo-modal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Mehdi Golzari — Senior Software Engineer & Technical Partner" },
      {
        name: "description",
        content:
          "Senior software engineer with 10+ years building SaaS and AI products. Clean Architecture, DDD, microservices, .NET, Node, React, LLMs. Direct partner to founders.",
      },
      { property: "og:title", content: "About Mehdi Golzari" },
      {
        property: "og:description",
        content: "10+ years building SaaS and AI products for founders worldwide.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="bg-hero">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
            About
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Hi, I'm <span className="text-neon-gradient">Mehdi Golzari</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Senior software engineer with 10+ years building production SaaS and AI products. I work
            directly with founders — designing architecture, writing the code, and shipping the
            product end-to-end.
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            I don't run an agency. There is no sales team, no project manager, no outsourcing. You
            email me, you talk to me, you get me building.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <DemoButton>
              Book a Discovery Call <ArrowRight className="ml-2 h-4 w-4" />
            </DemoButton>
            <Link
              to="/resume"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              Full résumé
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
              What I believe
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                "Founders should work directly with the engineer building their product.",
                "Software is not the product — successful execution is.",
                "Fewer layers means faster decisions and better products.",
                "Clean Architecture and DDD are not buzzwords; they're how you survive growth.",
                "AI is a tool, not a feature — use it where it actually moves the business.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">
              Stack I work in
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "C# / .NET Core",
                "ASP.NET Core",
                "Python",
                "FastAPI",
                "Node.js / TypeScript",
                "React / Next.js",
                "PostgreSQL",
                "MongoDB",
                "RabbitMQ",
                "Redis",
                "Docker",
                "Kubernetes",
                "AWS / Azure",
                "Cloudflare Workers",
                "Clean Architecture",
                "DDD",
                "Microservices",
                "OpenAI / Claude",
                "LangChain / LlamaIndex",
                "RAG Pipelines",
                "AI Agents",
                "Vector DBs (pgvector, Pinecone)",
                "Whisper / TTS",
                "Stripe / Twilio",
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/90"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-6 text-xs font-medium uppercase tracking-widest text-neon-gradient">
              Roles I take
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              <li>· Senior Software Engineer</li>
              <li>· Independent Technical Partner</li>
              <li>· Product Engineer</li>
              <li>· Solution Architect</li>
              <li>· AI Engineering Specialist</li>
              <li>· Fractional CTO</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Building startup products <span className="text-neon-gradient">with</span> founders —
            not for them.
          </h2>
          <div className="mt-6 flex justify-center">
            <DemoButton>Book Discovery Call</DemoButton>
          </div>
        </div>
      </section>
    </div>
  );
}
