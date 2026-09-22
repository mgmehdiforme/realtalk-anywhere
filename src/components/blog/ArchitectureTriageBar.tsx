import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Layers,
  Brain,
  Rocket,
  CloudLightning,
  Zap,
  MessageCircle,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ArchitectureTriageBarProps {
  postTitle: string;
  postSlug: string;
  category?: string;
  tags?: string[];
}

interface PillarConfig {
  badge: string;
  headline: string;
  description: string;
  pillarKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PILLAR_CONFIGS: Record<string, PillarConfig> = {
  "saas-architecture": {
    badge: "SaaS & Systems Architecture",
    headline: "Refactoring SaaS or Microservices Architecture?",
    description: "Avoid the microservices trap. Review your boundaries, caching, and DB design in a 30-min triage.",
    pillarKey: "saas-architecture",
    icon: Layers,
  },
  "ai-engineering": {
    badge: "AI Engineering & LLMs",
    headline: "Scaling an AI Agent or LLM Pipeline?",
    description: "Review prompt chaining, eval pipelines, and vector DB latency in a 30-min architecture triage.",
    pillarKey: "ai-engineering",
    icon: Brain,
  },
  "mvp-development": {
    badge: "Zero-to-One MVP Build",
    headline: "Architecting a New SaaS or AI Product?",
    description: "Build modular from Day 1 without over-engineering. Book a 30-min Architecture Triage call.",
    pillarKey: "mvp-development",
    icon: Rocket,
  },
  "cloud-devops": {
    badge: "Cloud Infrastructure & DevOps",
    headline: "Triage Cloud Spend & Deployment Topologies?",
    description: "Audit container topology, CI/CD, and observability directly with an experienced engineer.",
    pillarKey: "cloud-devops",
    icon: CloudLightning,
  },
  "performance-scaling": {
    badge: "Performance & Database Scaling",
    headline: "Hitting Database or Throughput Bottlenecks?",
    description: "Diagnose indexing, query contention, and concurrency locks before they cascade into outages.",
    pillarKey: "performance-scaling",
    icon: Zap,
  },
};

const DEFAULT_CONFIG: PillarConfig = {
  badge: "Direct Founder-to-Engineer Access",
  headline: "Experiencing an Architecture Bottleneck?",
  description: "Talk directly to Mehdi. Get practical, battle-tested solutions in a free 30-min triage call.",
  pillarKey: "saas-architecture",
  icon: ShieldCheck,
};

const PHONE_NUMBER = "905019390465";

export function ArchitectureTriageBar({
  postTitle,
  postSlug,
  category,
  tags = [],
}: ArchitectureTriageBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Match the category or tags against our pillar matrix
  const config = React.useMemo(() => {
    if (category && PILLAR_CONFIGS[category]) {
      return PILLAR_CONFIGS[category];
    }
    const combinedTags = tags.map((t) => t.toLowerCase()).join(" ");
    if (combinedTags.includes("agent") || combinedTags.includes("llm") || combinedTags.includes("ai")) {
      return PILLAR_CONFIGS["ai-engineering"];
    }
    if (combinedTags.includes("mvp") || combinedTags.includes("startup")) {
      return PILLAR_CONFIGS["mvp-development"];
    }
    if (combinedTags.includes("cloud") || combinedTags.includes("devops") || combinedTags.includes("kubernetes")) {
      return PILLAR_CONFIGS["cloud-devops"];
    }
    if (combinedTags.includes("scale") || combinedTags.includes("performance") || combinedTags.includes("database")) {
      return PILLAR_CONFIGS["performance-scaling"];
    }
    return DEFAULT_CONFIG;
  }, [category, tags]);

  // Check sessionStorage dismissal on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const dismissed = sessionStorage.getItem("triage_bar_dismissed");
        if (dismissed === "true") {
          setIsDismissed(true);
        }
      } catch {
        // Ignore storage access errors
      }
    }
  }, []);

  // Passive scroll listener: triggers between 35% and 90% scroll depth
  useEffect(() => {
    if (isDismissed) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const doc = document.documentElement;
          const totalScroll = doc.scrollTop || document.body.scrollTop;
          const windowHeight = doc.scrollHeight - doc.clientHeight;

          if (windowHeight > 0) {
            const scrollPercentage = (totalScroll / windowHeight) * 100;
            // Show when reader passes 35%, hide when reaching footer/related at 90%
            if (scrollPercentage >= 35 && scrollPercentage < 90) {
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run an initial check in case page is loaded mid-scroll
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    try {
      sessionStorage.setItem("triage_bar_dismissed", "true");
    } catch {
      // Ignore storage errors
    }
  };

  if (isDismissed) return null;

  const IconComponent = config.icon;
  const waMessage = encodeURIComponent(
    `Hi Mehdi, I was reading your article "${postTitle}" and would like to schedule a 30-minute Architecture Triage call for our stack.`
  );
  const waHref = `https://wa.me/${PHONE_NUMBER}?text=${waMessage}`;

  return (
    <aside
      aria-label="Architecture Triage Consultation Banner"
      className={`fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-6 max-w-4xl mx-auto z-40 transition-all duration-500 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-neon/40 bg-card/95 p-4 sm:p-5 shadow-[0_12px_45px_-10px_rgba(0,255,178,0.25)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:gap-6">
        {/* Ambient Subtle Glow Accent */}
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-neon/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-neon-2/15 blur-2xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss consultation bar"
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 grid h-7 w-7 place-items-center rounded-lg border border-border bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground transition z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Left Column: Contextual Value Proposition */}
        <div className="flex items-start gap-3 sm:gap-4 pr-6 sm:pr-0">
          <div className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-neon/30 bg-neon/10 text-neon shadow-sm">
            <IconComponent className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neon">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
                </span>
                {config.badge}
              </span>
              <span className="hidden md:inline text-[10px] text-muted-foreground">· Available for review this week</span>
            </div>

            <h4 className="font-display text-sm sm:text-base font-bold text-foreground leading-snug">
              {config.headline}
            </h4>

            <p className="text-xs text-muted-foreground line-clamp-2 max-w-xl">
              {config.description}
            </p>
          </div>
        </div>

        {/* Right Column: High-Intent Actions */}
        <div className="mt-3.5 sm:mt-0 flex flex-wrap items-center gap-2 sm:shrink-0">
          {/* Primary Action: Book Triage on /contact */}
          <Link
            to="/contact"
            search={{
              topic: "triage",
              article: postSlug,
              title: postTitle,
              source: "floating_bar",
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-neon px-4 py-2.5 font-display text-xs font-bold text-primary-foreground shadow-neon hover:bg-neon/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Book 30-Min Triage</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
          </Link>

          {/* Direct WhatsApp Fast-Track */}
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Direct WhatsApp chat with Mehdi"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
            title="Fast direct reply via WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">WhatsApp</span>
          </a>

          {/* Secondary Blueprint Preset Link */}
          <Link
            to="/blueprint"
            search={{
              pillar: config.pillarKey,
              sourceSlug: postSlug,
            }}
            className="hidden lg:inline-flex items-center justify-center rounded-xl border border-border bg-background/60 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title="Generate Free Architecture Blueprint"
          >
            Blueprint
          </Link>
        </div>
      </div>
    </aside>
  );
}
