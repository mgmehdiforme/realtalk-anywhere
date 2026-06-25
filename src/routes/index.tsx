import { createFileRoute } from "@tanstack/react-router";
import { Mic, Languages, Layers, Check, ArrowRight, Code2, GraduationCap, Briefcase } from "lucide-react";
import demoVideo from "@/assets/demo.mp4.asset.json";
import { DemoButton } from "@/lib/demo-modal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Universal Voice Translator — Speak any language in any Windows app" },
      { name: "description", content: "Real-time system-wide voice translation over Discord, Google Meet, WhatsApp and any Windows app. No plugins. No setup." },
      { property: "og:title", content: "Universal Voice Translator for Windows" },
      { property: "og:description", content: "Break the language barrier in any Windows app — instantly." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 lg:pt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
              Live · Real-time · System-wide
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              You don't need to learn a new language.{" "}
              <span className="text-neon-gradient">Speak in real-time, anywhere, in any language.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Break the language barrier in any Windows app — instantly. The Universal Voice
              Translator captures your system audio and translates it on the fly, with zero plugins.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <DemoButton className="px-6 py-3.5 text-base">
                Request a Live Demo <ArrowRight className="ml-2 h-4 w-4" />
              </DemoButton>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card"
              >
                See it in action
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No plugins", "Any Windows app", "Two-way translation"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-neon" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Video proof */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl border border-border bg-card/70 p-2 shadow-card backdrop-blur">
              <div className="absolute -inset-px rounded-2xl bg-neon opacity-30 blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-xl bg-background">
                <div className="flex items-center gap-1.5 border-b border-border bg-card/80 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">live-translate · discord · meet</span>
                </div>
                <video
                  src={demoVideo.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="aspect-video w-full bg-background object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">What it is</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">One layer. Every app. Every language.</h2>
          <p className="mt-3 text-muted-foreground">
            The translator sits between your microphone, your speakers, and every app on your PC —
            so any voice you hear or speak can be translated live.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { icon: Layers, title: "System-wide integration", body: "Captures and translates system audio seamlessly — no per-app plugins, no complex setup." },
            { icon: Mic, title: "Works in any Windows app", body: "Designed to run alongside Discord, Google Meet, WhatsApp, Zoom, Teams, and virtually any communication tool." },
            { icon: Languages, title: "Pick a language. Done.", body: "A minimalist UI lets you pick a target language — Japanese, Spanish, Farsi, anything — from a dropdown and start speaking." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-[color:var(--neon)]/40">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-neon shadow-neon">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        {/* Platforms grid */}
        <div className="mt-12 rounded-2xl border border-border bg-card/60 p-8 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Works beautifully with</h3>
            <span className="text-xs text-muted-foreground">…and anything else</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {["Discord", "Google Meet", "WhatsApp", "Zoom", "Microsoft Teams", "Slack"].map((p) => (
              <div key={p} className="flex items-center justify-center rounded-xl border border-border bg-background/60 px-4 py-4 text-sm font-medium text-foreground/80 transition hover:border-[color:var(--neon)]/40 hover:text-foreground">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-medium uppercase tracking-widest text-neon-gradient">Who it's for</div>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Built for people who speak to the world.</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Code2,
                tag: "Global software engineers",
                problem: "Fast-paced, multi-accent daily stand-ups and technical syncs.",
                solution: "Seamless real-time translations during cross-border agile meetings.",
              },
              {
                icon: GraduationCap,
                tag: "International students",
                problem: "Missing vital context and terminology in foreign-language lectures.",
                solution: "Accurate live transcription and translation of educational streams.",
              },
              {
                icon: Briefcase,
                tag: "Cross-border businesses",
                problem: "Losing high-ticket deals to communication and language barriers.",
                solution: "Smooth discovery calls and negotiations with international partners.",
              },
            ].map(({ icon: Icon, tag, problem, solution }) => (
              <div key={tag} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background">
                    <Icon className="h-5 w-5 text-neon" />
                  </div>
                  <div className="font-semibold">{tag}</div>
                </div>
                <div className="mt-5">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Problem</div>
                  <p className="mt-1 text-sm text-foreground/90">{problem}</p>
                </div>
                <div className="mt-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-neon-gradient">Solution</div>
                  <p className="mt-1 text-sm text-foreground/90">{solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-card sm:p-14">
          <div className="absolute -top-20 left-1/2 h-60 w-[80%] -translate-x-1/2 rounded-full bg-neon opacity-20 blur-3xl" aria-hidden />
          <h2 className="relative font-display text-3xl font-semibold sm:text-4xl">
            See it translate your next meeting — live.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
            Book a 15-minute demo. Watch a real Discord or Google Meet call get translated in real time.
          </p>
          <div className="relative mt-7 flex justify-center">
            <DemoButton className="px-6 py-3.5 text-base">
              Request a Live Demo <ArrowRight className="ml-2 h-4 w-4" />
            </DemoButton>
          </div>
        </div>
      </section>
    </div>
  );
}
