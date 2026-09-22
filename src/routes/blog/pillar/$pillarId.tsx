import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  Layers,
  Brain,
  Rocket,
  Shield,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Clock,
  BookOpen,
  ArrowRight,
  MessageCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { getPillarById, getAllPillars, type StrategicPillar } from "@/lib/pillar-config";
import { getBlogPostsForPillar } from "@/lib/db";
import type { BlogPost } from "@/lib/blog-types";

const ICON_MAP = {
  Layers,
  Brain,
  Rocket,
  Shield,
  TrendingUp,
};

/**
 * Server Function to load pillar configuration and matching published articles
 */
export const getPillarHubData = createServerFn()
  .validator((d: { pillarId: string }) => d)
  .handler(async ({ data }) => {
    const pillar = getPillarById(data.pillarId);
    if (!pillar) {
      return { pillar: null, posts: [], total: 0, totalReadMinutes: 0, otherPillars: [] };
    }

    const { posts, total, totalReadMinutes } = await getBlogPostsForPillar(pillar.id);
    const otherPillars = getAllPillars().filter((p) => p.id !== pillar.id);

    return {
      pillar,
      posts,
      total,
      totalReadMinutes,
      otherPillars,
    };
  });

export const Route = createFileRoute("/blog/pillar/$pillarId")({
  loader: async ({ params }) => {
    const data = await getPillarHubData({ data: { pillarId: params.pillarId } });
    if (!data.pillar) {
      throw notFound();
    }
    return data;
  },
  head: ({ loaderData }) => {
    const pillar = loaderData?.pillar;
    if (!pillar) {
      return { meta: [{ title: "Architecture Pillar Not Found — MehdiGolzari.dev" }] };
    }

    const canonicalUrl = `https://mehdigolzari.dev/blog/pillar/${pillar.slug}`;
    const ogImageUrl = `https://mehdigolzari.dev/api/og?slug=pillar-${pillar.slug}`;

    const jsonLdCollection = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${pillar.title} Technical Architecture Hub`,
      description: pillar.description,
      url: canonicalUrl,
      author: {
        "@type": "Person",
        name: "Mehdi Golzari",
        url: "https://mehdigolzari.dev/about",
        jobTitle: "Senior Independent Technical Partner & Fractional CTO",
      },
      hasPart: (loaderData?.posts || []).map((post: BlogPost) => ({
        "@type": "TechArticle",
        headline: post.title,
        description: post.excerpt,
        url: `https://mehdigolzari.dev/blog/${post.slug}`,
        datePublished: post.publishedAt || post.createdAt,
      })),
    };

    const jsonLdBreadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://mehdigolzari.dev",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Technical Blog",
          item: "https://mehdigolzari.dev/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: pillar.title,
          item: canonicalUrl,
        },
      ],
    };

    return {
      meta: [
        { title: `${pillar.title} — Technical Architecture Hub | MehdiGolzari.dev` },
        { name: "description", content: pillar.description },
        { property: "og:site_name", content: "MehdiGolzari.dev" },
        { property: "og:title", content: `${pillar.title} Architecture Hub` },
        { property: "og:description", content: pillar.tagline },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImageUrl },
        { property: "og:image:secure_url", content: ogImageUrl },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: `${pillar.title} Architecture Hub — Mehdi Golzari` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@mehdigolzaridev" },
        { name: "twitter:creator", content: "@mehdigolzaridev" },
        { name: "twitter:title", content: `${pillar.title} — Architecture Hub` },
        { name: "twitter:description", content: pillar.tagline },
        { name: "twitter:image", content: ogImageUrl },
        { name: "twitter:image:alt", content: pillar.title },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLdCollection),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLdBreadcrumbs),
        },
      ],
    };
  },
  component: PillarHubPage,
});

function PillarHubPage() {
  const data = Route.useLoaderData();
  const pillar = data.pillar as StrategicPillar;
  const posts = data.posts as BlogPost[];
  const otherPillars = data.otherPillars as StrategicPillar[];

  const IconComponent = ICON_MAP[pillar.iconName] || Layers;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full min-w-0 space-y-16">
        {/* ── BREADCRUMBS ── */}
        <nav aria-label="Breadcrumb" className="overflow-x-auto whitespace-nowrap pb-1">
          <ol
            itemScope
            itemType="https://schema.org/BreadcrumbList"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" itemProp="item" className="hover:text-neon transition-colors">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/blog" itemProp="item" className="hover:text-neon transition-colors">
                <span itemProp="name">Technical Blog</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-foreground font-medium">
                {pillar.title}
              </span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        {/* ── PILLAR HERO ── */}
        <header className="relative overflow-hidden rounded-3xl border border-neon/30 bg-card/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-neon/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-neon-2/15 blur-3xl pointer-events-none" />

          <div className="relative space-y-6 max-w-3xl">
            {/* Live Pillar Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3.5 py-1 text-xs font-mono font-bold text-neon uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
              </span>
              <IconComponent className="h-3.5 w-3.5" />
              <span>{pillar.badge}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
              {pillar.title}
            </h1>

            <p className="font-display text-lg sm:text-xl font-semibold text-neon-gradient">
              {pillar.headline}
            </p>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {pillar.tagline}
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-3 py-1.5 font-medium">
                <BookOpen className="h-3.5 w-3.5 text-neon" />
                <span>{data.total} Technical Articles</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-3 py-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-neon" />
                <span>~{data.totalReadMinutes} Min Total Reading Time</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-3 py-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-neon" />
                <span>Founder Blueprint Preset Ready</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                to="/blueprint"
                search={{
                  pillar: pillar.blueprintPresetKey,
                  sourceSlug: `pillar-${pillar.id}`,
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neon px-5 py-3 font-display text-xs font-bold text-primary-foreground shadow-neon hover:bg-neon/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText className="h-4 w-4" />
                <span>Load {pillar.title} Blueprint</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                to="/contact"
                search={{
                  topic: pillar.contactTopic,
                  source: `pillar_hub_${pillar.id}`,
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neon/40 bg-neon/10 px-5 py-3 font-display text-xs font-bold text-neon hover:bg-neon/20 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Book 30-Min Architecture Triage</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ── CURATED ARTICLES IN THIS PILLAR ── */}
        <section className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                In-Depth Architecture Guides
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Practical, code-backed engineering teardowns for {pillar.title.toLowerCase()}.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-neon">
              {posts.length} {posts.length === 1 ? "Guide" : "Guides"} Available
            </span>
          </div>

          {posts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:border-neon/50 hover:shadow-neon/20 transition-all duration-300"
                >
                  <div>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="block aspect-[16/9] overflow-hidden bg-muted relative"
                    >
                      <img
                        src={post.coverImage || `/api/og?slug=${post.slug}`}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="p-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(post.tags || []).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="font-display text-base font-bold text-foreground line-clamp-2 group-hover:text-neon transition">
                        <Link to="/blog/$slug" params={{ slug: post.slug }}>
                          {post.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/80 p-4 px-5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-neon" />
                      {post.readTimeMinutes || 6} min read
                    </span>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="font-semibold text-neon group-hover:underline flex items-center gap-1"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground space-y-3">
              <BookOpen className="h-8 w-8 mx-auto text-neon/60" />
              <div className="font-display font-semibold text-foreground">
                New guides in production for this pillar
              </div>
              <p className="text-xs max-w-md mx-auto">
                Articles in {pillar.title} are being drafted. Check back shortly or generate a personalized architecture blueprint now.
              </p>
            </div>
          )}
        </section>

        {/* ── ENGINEERING MANIFESTO / PRINCIPLES ── */}
        <section className="rounded-3xl border border-border bg-[#090d18] p-6 sm:p-10 shadow-xl space-y-8">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-neon">
              Architectural Standards
            </div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-foreground">
              The {pillar.title} Engineering Rules
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Non-negotiable architectural practices we implement across founder codebases to prevent premature rewrites and ensure investor-grade quality.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {pillar.manifestoRules.map((rule, idx) => (
              <div
                key={rule.title}
                className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2 backdrop-blur hover:border-neon/30 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-neon/15 font-mono text-xs font-bold text-neon">
                    {idx + 1}
                  </span>
                  <h3 className="font-display text-sm font-bold text-foreground">{rule.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-border/80 pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Core Topics: <span className="text-foreground/90 font-mono">{pillar.keyTopics.join(" · ")}</span>
            </div>
            <Link
              to="/founder-to-launch-framework"
              className="text-xs font-semibold text-neon hover:underline inline-flex items-center gap-1"
            >
              Explore the Founder-to-Launch Framework™ <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        {/* ── EXPLORE OTHER STRATEGIC PILLARS ── */}
        <section className="space-y-6 border-t border-border pt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-foreground">
              Explore Other Strategic Architecture Hubs
            </h2>
            <Link to="/blog" className="text-xs font-semibold text-neon hover:underline">
              View All Articles →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherPillars.map((other) => {
              const OtherIcon = ICON_MAP[other.iconName] || Layers;
              return (
                <Link
                  key={other.id}
                  to="/blog/pillar/$pillarId"
                  params={{ pillarId: other.id }}
                  className="group rounded-2xl border border-border bg-card/70 p-5 hover:border-neon/40 hover:bg-card transition-all space-y-3"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background group-hover:border-neon/40 group-hover:bg-neon/10 group-hover:text-neon transition">
                    <OtherIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground group-hover:text-neon transition">
                      {other.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                      {other.headline}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-neon flex items-center gap-1 pt-1">
                    <span>Explore Hub</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
