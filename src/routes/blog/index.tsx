import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Clock,
  ArrowRight,
  Search,
  BookOpen,
  CheckCircle2,
  Brain,
  Compass,
  Cpu,
  Layers,
  Zap,
} from "lucide-react";
import { getBlogPosts, type BlogPost } from "@/lib/db";
import { DemoButton } from "@/lib/demo-modal";

/**
 * Server Function to fetch published posts for the public blog index
 */
export const getPublicBlogIndex = createServerFn().handler(async () => {
  const { posts } = await getBlogPosts({ status: "published" });
  return { posts };
});

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    return await getPublicBlogIndex();
  },
  head: () => ({
    meta: [
      { title: "Technical Insights & SaaS Architecture Blog — MehdiGolzari.dev" },
      {
        name: "description",
        content:
          "Practical, high-signal, CTO-level architectural deep-dives for SaaS and AI founders. Modular monoliths, RAG pipelines, multi-tenancy, and fractional CTO strategy.",
      },
      { property: "og:title", content: "Technical Insights & SaaS Architecture Blog — MehdiGolzari.dev" },
      {
        property: "og:description",
        content:
          "Practical architectural deep-dives for SaaS and AI founders. Battle-tested engineering without agency fluff.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mehdigolzari.dev/blog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndexPage,
});

const CATEGORIES = [
  "All",
  "Architecture",
  "AI Engineering",
  "SaaS MVP",
  "Scaling",
  "Databases",
  "DevOps",
];

function BlogIndexPage() {
  const { posts } = Route.useLoaderData();
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = posts.filter((post: BlogPost) => {
    const matchesTag =
      selectedTag === "All" ||
      post.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTag && matchesSearch;
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-hero border-b border-border py-16 sm:py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-neon-gradient backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> High-Signal Technical Insights
          </div>

          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            CTO-Grade Insights for <span className="text-neon-gradient">SaaS & AI Founders</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Practical architectural analysis, real-world trade-off matrices, and lessons learned from
            rescuing, engineering, and scaling production software systems.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-md relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by keyword, stack, or topic..."
              className="w-full rounded-2xl border border-border bg-card/80 backdrop-blur pl-11 pr-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-neon focus:outline-none shadow-sm transition"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedTag(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedTag === cat
                    ? "bg-neon text-primary-foreground shadow-neon"
                    : "border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARTICLES CONTENT ── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 space-y-16">
        {filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No articles found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              We couldn't find any articles matching your search criteria. Try a different search term
              or select another category.
            </p>
          </div>
        ) : (
          <>
            {/* FEATURED HERO CARD */}
            {featuredPost && (
              <div className="group relative rounded-3xl border border-border bg-card overflow-hidden shadow-card transition duration-300 hover:border-neon/40 hover:shadow-2xl">
                <div className="grid lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 overflow-hidden bg-muted/40 aspect-[16/9] lg:aspect-auto">
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>

                  <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neon/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-neon uppercase tracking-wider">
                          Featured Deep Dive
                        </span>
                        {featuredPost.tags.slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:text-neon transition">
                        <Link to="/blog/$slug" params={{ slug: featuredPost.slug }}>
                          {featuredPost.title}
                        </Link>
                      </h2>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-5">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{featuredPost.readTimeMinutes || 6} min read</span>
                        </div>
                        <span>·</span>
                        <span>
                          {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </div>

                      <Link
                        to="/blog/$slug"
                        params={{ slug: featuredPost.slug }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-neon group-hover:translate-x-1 transition-transform"
                      >
                        Read Article <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 3-COLUMN GRID ── */}
            {gridPosts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-foreground">Latest Articles</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {gridPosts.length} article{gridPosts.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post: BlogPost) => (
                    <article
                      key={post.id}
                      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:border-neon/40 hover:shadow-xl transition-all duration-300"
                    >
                      <Link
                        to="/blog/$slug"
                        params={{ slug: post.slug }}
                        className="aspect-[16/9] overflow-hidden bg-muted/40 block"
                      >
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <h3 className="font-display text-base font-bold text-foreground leading-snug group-hover:text-neon transition">
                            <Link to="/blog/$slug" params={{ slug: post.slug }}>
                              {post.title}
                            </Link>
                          </h3>

                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {post.readTimeMinutes || 5} min read
                          </span>
                          <span>
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── GO-TO-LAUNCH BLUEPRINT LEAD MAGNET CALLOUT ── */}
        <div className="rounded-3xl border-2 border-neon/30 bg-gradient-to-br from-card via-card/90 to-neon/10 p-8 sm:p-12 shadow-card relative overflow-hidden text-center sm:text-left">
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-neon/10 blur-3xl" />
          <div className="grid lg:grid-cols-12 gap-8 items-center relative">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neon/15 px-3 py-1 font-mono text-[10px] font-bold text-neon uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Free Technical Scoping Tool
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Planning your SaaS or AI Architecture?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Before writing code or hiring developers, get a personalized execution blueprint.
                Identify technical risks, lock your MVP scope, and receive AI-backed architecture
                recommendations.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center lg:items-end">
              <Link
                to="/blueprint"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neon px-6 py-3.5 text-xs font-bold text-primary-foreground shadow-neon transition hover:brightness-110"
              >
                Build My Blueprint Free ⚡
              </Link>
              <DemoButton>Book a 1-on-1 Call</DemoButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
