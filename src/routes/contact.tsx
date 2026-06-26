import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Mail, MapPin, Linkedin, ArrowRight, Sparkles } from "lucide-react";

const PHONE_DISPLAY = "+90 501 939 0465";
const PHONE = "905019390465";
const EMAIL = "MehdiGolzari.official@gmail.com";
const MESSAGE =
  "Hi Mehdi! I'd like to book a free discovery call to discuss building/scaling my SaaS or AI product.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Mehdi Golzari — Book a Discovery Call" },
      { name: "description", content: "Talk directly to Mehdi about your SaaS or AI product. WhatsApp, email or LinkedIn — pick your channel." },
      { property: "og:title", content: "Contact — MehdiGolzari.dev" },
      { property: "og:description", content: "WhatsApp, email, or LinkedIn — talk directly to the engineer." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const waHref = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent("Hello Mehdi")}&body=${encodeURIComponent(MESSAGE)}`;

  const channels = [
    { icon: MessageCircle, label: "WhatsApp", value: PHONE_DISPLAY, href: waHref, primary: true, hint: "Fastest reply — message is pre-filled" },
    { icon: Mail, label: "Email", value: EMAIL, href: mailHref, hint: "Opens your default mail client" },
    { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/in/mehdigolzariofficial", href: "https://linkedin.com/in/mehdigolzariofficial", hint: "Connect or DM" },
  ];

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-neon" /> Free 30-min discovery call
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Let's <span className="text-neon-gradient">talk</span>.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pick whichever channel is easiest. Your message is already written — just hit send.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4">
          {channels.map(({ icon: Icon, label, value, href, hint, primary }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className={
                "group flex items-center gap-5 rounded-2xl border border-border p-5 transition hover:border-[color:var(--neon)]/40 sm:p-6 " +
                (primary ? "bg-card shadow-neon" : "bg-card shadow-card")
              }
            >
              <div className={"grid h-12 w-12 shrink-0 place-items-center rounded-xl " + (primary ? "bg-neon" : "border border-border bg-background")}>
                <Icon className={"h-5 w-5 " + (primary ? "text-primary-foreground" : "text-neon")} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="font-display text-lg font-semibold">{label}</div>
                  {primary && <span className="text-[10px] font-medium uppercase tracking-wider text-neon-gradient">Recommended</span>}
                </div>
                <div className="truncate font-mono text-sm text-foreground/90">{value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </a>
          ))}
        </div>

        {/* Pre-filled message preview */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">Pre-filled message</div>
          <div className="mt-3 rounded-xl border border-border bg-background/60 p-4 font-mono text-sm leading-relaxed text-foreground/90">
            "{MESSAGE}"
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Clicking WhatsApp or Email above sends this message to Mehdi automatically.
          </p>
        </div>

        {/* Other details */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-neon" /> Based in</div>
            <div className="mt-1.5 text-muted-foreground">Istanbul, Turkey · Remote-friendly worldwide</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-sm font-medium">Response time</div>
            <div className="mt-1.5 text-muted-foreground">Usually under 24 hours · WhatsApp is fastest</div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          Curious about the engineering behind the app?{" "}
          <Link to="/resume" className="font-medium text-foreground underline-offset-4 hover:underline">
            Read my résumé →
          </Link>
        </div>
      </div>
    </div>
  );
}
