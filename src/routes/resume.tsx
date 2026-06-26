import { createFileRoute } from "@tanstack/react-router";
import { Download, Mail, MessageCircle, MapPin, Linkedin } from "lucide-react";
import resumePdf from "@/assets/resume.pdf.asset.json";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Mehdi Golzari — Senior .NET Core & C# Engineer" },
      { name: "description", content: "10+ years architecting high-performance .NET microservices. Clean Architecture, DDD, OpenAI integrations, RabbitMQ, Kubernetes." },
      { property: "og:title", content: "Mehdi Golzari — Senior Software Engineer" },
      { property: "og:description", content: "Senior .NET Core / C# engineer specializing in microservices, DDD and AI integrations." },
    ],
  }),
  component: ResumePage,
});

const competencies: Record<string, string[]> = {
  "Languages & Frameworks": ["C#", "ASP.NET Core", ".NET Framework", "Razor Pages", "Python", "FastAPI", "Node.js", "TypeScript", "T-SQL", "PL-SQL", "JavaScript", "React", "Next.js"],
  "Architecture & Patterns": ["Microservices", "DDD", "EDD", "CQRS", "Clean Architecture", "Event-Driven", "Cloud-Native", "SaaS Multi-tenant", "Serverless"],
  "Cloud & DevOps": ["Docker", "Kubernetes", "GitHub Actions", "CI/CD", "Redis", "RabbitMQ", "AWS", "Azure", "Cloudflare Workers", "Nginx", "Linux"],
  "Databases & Data": ["SQL Server", "PostgreSQL", "Oracle", "MongoDB", "Redis", "EF Core", "Dapper", "Vector DBs (pgvector, Pinecone, Qdrant)"],
  "AI & LLM Engineering": ["OpenAI API (GPT-4/4o)", "Anthropic Claude", "LangChain", "LlamaIndex", "RAG Pipelines", "AI Agents", "Function Calling", "Prompt Engineering", "Embeddings", "Fine-tuning", "Whisper / TTS"],
  "Integrations & Realtime": ["SignalR", "WebSockets", "REST APIs", "GraphQL", "SOAP / WCF", "Stripe", "Twilio", "Webhooks"],
  "Product & Delivery": ["MVP Architecture", "Technical Discovery", "Fractional CTO", "Product Engineering", "Code Audits"],
  "Tools & Methods": ["Git", "GitHub", "Jira", "Agile / Scrum", "OWASP Top 10", "ISO 27001", "xUnit", "PyTest"],
};

const roles = [
  {
    company: "Vendoroo.Ai",
    location: "Remote, US",
    title: "Software Engineer — C# / .NET Core",
    period: "Feb 2024 – Present",
    summary:
      "Senior role orchestrating high-availability backend microservices and AI workflows. Optimized background data systems and built secure cloud-native infrastructure for high-volume third-party feeds.",
    points: [
      "Built a monitoring dashboard visualizing background processes to resolve system bottlenecks.",
      "Architected a secure internal credential-generation system for safely provisioning external integration keys.",
      "Built a resilient microservice to scrape, fetch and evaluate external platform data, optimized via RabbitMQ.",
      "Engineered a script integration platform with ASP.NET Core + OpenAI APIs and real-time SignalR streaming.",
    ],
    stack: ["C#", "ASP.NET Core", "OpenAI API", "RabbitMQ", "SignalR", "xUnit", "PostgreSQL", "Redis", "EF Core", "Docker", "Kubernetes"],
  },
  {
    company: "ITShams",
    location: "Hybrid",
    title: "Software Engineer — C# / .NET Core",
    period: "Nov 2022 – Feb 2024",
    summary:
      "Architected high-concurrency enterprise engines. Led production deployment of a business-critical system for Iran Khodro Co. (70,000+ employees) — received a formal Letter of Appreciation.",
    points: [
      "Directed development of a high-concurrency Employee Suggestion & Idea Management Engine for 70,000+ workforce.",
      "Engineered core services using C#, EF Core and WCF/SOAP for high availability and robust performance.",
      "Wrote complex T-SQL procedures and tuned MS SQL Server for massive legacy data migrations.",
    ],
    stack: ["C#", "MS SQL Server", "T-SQL", "EF Core", "SOAP", "React"],
  },
  {
    company: "Manir",
    location: "On Site",
    title: "Full-Stack Razor C# / ASP.NET Core Developer",
    period: "Oct 2018 – Mar 2023",
    summary:
      "Technical owner for a secure web infrastructure. Achieved OWASP Top 10 certification while optimizing a database-heavy billing framework.",
    points: [
      "Designed, built and deployed an Enterprise Portal CMS — official OWASP Top 10 certification.",
      "Optimized a high-volume billing engine, eliminating concurrency bottlenecks and heavy ORM overhead.",
    ],
    stack: ["T-SQL", "PostgreSQL", "Oracle (PL-SQL)", "Redis", "Dapper", "Docker", "Kubernetes", "ASP.NET Core", "Razor"],
  },
  {
    company: "RoyanAfzar",
    location: "On Site",
    title: "Full-Stack ASPX C# / .NET Framework Developer",
    period: "Jan 2015 – Sep 2018",
    summary:
      "Engineered highly secure low-level server utilities and background processes aligned with ISO 27001 protocols.",
    points: [
      "Built high-security automated backend systems aligned with ISMS (ISO 27001) compliance.",
      "Engineered enterprise tools using C# and .NET Framework to deliver scalable client-server systems.",
      "Developed high-performance multi-threaded Windows Services.",
    ],
    stack: ["C#", ".NET Framework", "ASPX", "MS SQL"],
  },
];

function ResumePage() {
  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card sm:p-10">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-neon opacity-20 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Open to senior backend & architect roles
              </div>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Mehdi Golzari
              </h1>
              <p className="mt-2 text-lg text-neon-gradient">
                Senior Software Engineer · .NET Core & C# Developer
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Istanbul, Turkey</span>
                <a className="inline-flex items-center gap-1.5 hover:text-foreground" href="mailto:MehdiGolzari.official@gmail.com"><Mail className="h-4 w-4" /> MehdiGolzari.official@gmail.com</a>
                <a className="inline-flex items-center gap-1.5 hover:text-foreground" href="https://wa.me/905019390465" target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> +90 501 939 0465</a>
                <a className="inline-flex items-center gap-1.5 hover:text-foreground" href="https://linkedin.com/in/mehdigolzariofficial" target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" /> linkedin.com/in/mehdigolzariofficial</a>
              </div>
            </div>
            <a
              href={resumePdf.url}
              download="Mehdi_Golzari_Resume.pdf"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-neon px-5 py-3 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </div>

          <p className="relative mt-7 max-w-3xl text-[0.97rem] leading-relaxed text-foreground/90">
            Strategic Senior C# / .NET Core engineer with <strong>10+ years</strong> architecting and delivering
            high-performance backend systems. Expert in microservices, Clean Architecture and Domain-Driven Design,
            with a proven track record across full-lifecycle development and CI/CD. Known for driving engineering
            excellence through cloud-native solutions, <strong>AI integrations</strong>, and optimization of
            large-scale MSSQL & PostgreSQL databases.
          </p>
        </header>

        {/* Competencies */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Core Competencies</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(competencies).map(([cat, items]) => (
              <div key={cat} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">{cat}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {items.map((it) => (
                    <span key={it} className="rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground/90">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Professional Experience</h2>
          <div className="relative mt-6 space-y-5 sm:pl-8">
            <span className="absolute left-3 top-2 bottom-2 hidden w-px bg-border sm:block" aria-hidden />
            {roles.map((r) => (
              <article key={r.company} className="relative rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
                <span className="absolute -left-[1.4rem] top-7 hidden h-3 w-3 rounded-full bg-neon shadow-neon sm:block" aria-hidden />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {r.company} <span className="font-normal text-muted-foreground">· {r.location}</span>
                    </h3>
                    <div className="text-sm text-foreground/90">{r.title}</div>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{r.period}</div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/85">{r.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-foreground/90">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {r.stack.map((s) => (
                    <span key={s} className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Education</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <div className="font-medium">B.Sc. Computer Engineering</div>
                <div className="text-muted-foreground">Istanbul Technical University, Turkey</div>
              </li>
              <li>
                <div className="font-medium">Associate's Degree, Computer Software Engineering</div>
                <div className="text-muted-foreground">Razi State University, Ardabil</div>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Certifications & Languages</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li><span className="font-medium">Digital Marketing Fundamentals</span> · Google Digital Garage</li>
              <li><span className="font-medium">Google My Business</span> · Google</li>
              <li><span className="font-medium">C# Development Assessment</span> · LinkedIn</li>
              <li className="pt-2 text-muted-foreground">Languages: English · Turkish</li>
            </ul>
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <a
            href={resumePdf.url}
            download="Mehdi_Golzari_Resume.pdf"
            className="inline-flex items-center gap-2 rounded-xl bg-neon px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
          >
            <Download className="h-4 w-4" /> Download full résumé (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}
