import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { createServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Clock,
  ArrowRight,
  Search,
  BookOpen,
  Tag as TagIcon,
  X,
  Layers,
  ChevronRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { getBlogPosts } from "@/lib/db";
import { BLOG_PILLAR_CATEGORIES, type BlogPost } from "@/lib/blog-types";

interface BlogSearchSchema {
  tag?: string;
  category?: string;
  q?: string;
}

/**
 * Server Function to fetch published posts for the public blog index
 */
export const getPublicBlogIndex = createServerFn().handler(async () => {
  try {
    const { posts } = await getBlogPosts({ status: "published" });
    return { posts: posts || [] };
  } catch (error) {
    console.error("Failed to load blog posts in getPublicBlogIndex:", error);
    return { posts: [] };
  }
});

export const Route = createFileRoute("/blog/")({
  validateSearch: (search: Record<string, unknown>): BlogSearchSchema => {
    return {
      tag: typeof search.tag === "string" ? search.tag : undefined,
      category: typeof search.category === "string" ? search.category : undefined,
      q: typeof search.q === "string" ? search.q : undefined,
    };
  },
  loader: async () => {
    try {
      const data = await getPublicBlogIndex();
      return { posts: data?.posts || [] };
    } catch (err) {
      console.error("Error in blog loader:", err);
      return { posts: [] };
    }
  },
  head: ({ loaderData }) => {
    const posts = loaderData?.posts || [];
    const blogJsonLd = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": "https://mehdigolzari.dev/blog/#blog",
      url: "https://mehdigolzari.dev/blog",
      name: "Technical Insights & SaaS Architecture Blog",
      description:
        "Practical, high-signal, CTO-level architectural deep-dives for SaaS and AI founders. Modular monoliths, deterministic AI, multi-tenancy, and fractional CTO strategy.",
      publisher: {
        "@type": "Person",
        name: "Mehdi Golzari",
        url: "https://mehdigolzari.dev/about",
      },
      inLanguage: "en-US",
      blogPost: posts.slice(0, 10).map((p: BlogPost) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.excerpt,
        url: `https://mehdigolzari.dev/blog/${p.slug}`,
        datePublished: p.publishedAt || p.createdAt,
        dateModified: p.updatedAt || p.publishedAt || p.createdAt,
        author: {
          "@type": "Person",
          name: "Mehdi Golzari",
        },
      })),
    };

    const breadcrumbsJsonLd = {
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
      ],
    };

    return {
      meta: [
        { title: "Technical Insights & SaaS Architecture Blog — Mehdi Golzari" },
        {
          name: "description",
          content:
            "Practical, high-signal, CTO-level architectural deep-dives for SaaS and AI founders. Modular monoliths, deterministic AI, multi-tenancy, and fractional CTO strategy.",
        },
        { property: "og:site_name", content: "MehdiGolzari.dev" },
        { property: "og:title", content: "Technical Insights & SaaS Architecture Blog — Mehdi Golzari" },
        {
          property: "og:description",
          content:
            "Practical architectural deep-dives for SaaS and AI founders. Battle-tested engineering without agency fluff.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://mehdigolzari.dev/blog" },
        {
          property: "og:image",
          content:
            "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ac23c38d-b692-43ac-863d-d0c7e38bfc5b",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Technical Insights & SaaS Architecture Blog — Mehdi Golzari" },
        {
          name: "twitter:description",
          content:
            "Practical architectural deep-dives for SaaS and AI founders. Battle-tested engineering without agency fluff.",
        },
        {
          name: "twitter:image",
          content:
            "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ac23c38d-b692-43ac-863d-d0c7e38bfc5b",
        },
      ],
      links: [
        { rel: "canonical", href: "https://mehdigolzari.dev/blog" },
        {
          rel: "alternate",
          type: "application/rss+xml",
          title: "Mehdi Golzari — Architectural Blog RSS",
          href: "https://mehdigolzari.dev/rss.xml",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(blogJsonLd),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbsJsonLd),
        },
      ],
    };
  },
  component: BlogIndexPage,
});

const PILLAR_TABS = [
  { id: "all", label: "All Insights" },
  ...BLOG_PILLAR_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.name.split("&")[0].trim(),
  })),
];

function BlogIndexPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const posts: BlogPost[] = loaderData?.posts || [];

  const [selectedPillar, setSelectedPillar] = useState<string>(searchParams.category || "all");
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.tag || "");
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.q || "");

  // Sync state if URL query params change
  useEffect(() => {
    if (searchParams.category) setSelectedPillar(searchParams.category);
    if (searchParams.tag !== undefined) setSelectedTag(searchParams.tag);
    if (searchParams.q !== undefined) setSearchQuery(searchParams.q);
  }, [searchParams.category, searchParams.tag, searchParams.q]);

  // Extract all unique tags with frequency count
  const allTagsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of posts) {
      const tags = Array.isArray(post.tags) ? post.tags : [];
      for (const t of tags) {
        const clean = t.trim();
        if (clean) {
          counts[clean] = (counts[clean] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // Filter posts based on active Pillar, Tag, and Search Keyword
  const filteredPosts = useMemo(() => {
    return posts.filter((post: BlogPost) => {
      const postTags = Array.isArray(post.tags) ? post.tags : [];

      const matchesPillar =
        selectedPillar === "all" ||
        (post.category && post.category.toLowerCase() === selectedPillar.toLowerCase());

      const matchesTag =
        !selectedTag ||
        postTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (post.title || "").toLowerCase().includes(q) ||
        (post.excerpt || "").toLowerCase().includes(q) ||
        postTags.some((t) => t.toLowerCase().includes(q));

      return matchesPillar && matchesTag && matchesSearch;
    });
  }, [posts, selectedPillar, selectedTag, searchQuery]);

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  const handleTagClick = (tag: string) => {
    const nextTag = selectedTag === tag ? "" : tag;
    setSelectedTag(nextTag);
    navigate({
      to: "/blog",
      search: {
        category: selectedPillar !== "all" ? selectedPillar : undefined,
        tag: nextTag || undefined,
        q: searchQuery || undefined,
      },
    });
  };

  const handlePillarClick = (pillarId: string) => {
    setSelectedPillar(pillarId);
    navigate({
      to: "/blog",
      search: {
        category: pillarId !== "all" ? pillarId : undefined,
        tag: selectedTag || undefined,
        q: searchQuery || undefined,
      },
    });
  };

  const clearAllFilters = () => {
    setSelectedPillar("all");
    setSelectedTag("");
    setSearchQuery("");
    navigate({ to: "/blog", search: {} });
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-hero border-b border-border py-14 sm:py-20">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1 text-xs font-semibold text-neon backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> High-Signal Technical Insights & Strategy
          </div>

          <h1 className="mt-5 font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
            CTO-Grade Insights for <span className="text-neon-gradient">SaaS & AI Founders</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Battle-tested software architecture, deterministic AI systems, and actionable 0-to-1
            engineering roadmaps for founders seeking technical partnership.
          </p>

          {/* Search Input */}
          <div className="mx-auto mt-8 max-w-md relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by keyword, stack, or topic..."
              className="w-full rounded-2xl border border-border bg-card/90 backdrop-blur pl-11 pr-10 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-neon focus:outline-none shadow-sm transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Pillar Tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {PILLAR_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handlePillarClick(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedPillar === tab.id
                    ? "bg-neon text-primary-foreground shadow-neon"
                    : "border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT AREA WITH SIDEBAR ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Main Feed (8 or 9 Cols) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-12 min-w-0">
            {/* Active Filters Notification Bar */}
            {(selectedPillar !== "all" || selectedTag || searchQuery) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 p-4 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">Filtered by:</span>
                  {selectedPillar !== "all" && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-neon/15 px-2.5 py-1 font-mono text-[11px] font-bold text-neon border border-neon/30">
                      Pillar: {PILLAR_TABS.find((t) => t.id === selectedPillar)?.label || selectedPillar}
                      <button onClick={() => handlePillarClick("all")} className="hover:text-foreground ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedTag && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] font-bold text-foreground border border-border">
                      <TagIcon className="h-3 w-3 text-neon" /> {selectedTag}
                      <button onClick={() => handleTagClick(selectedTag)} className="hover:text-neon ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground border border-border">
                      Query: "{searchQuery}"
                      <button onClick={() => setSearchQuery("")} className="hover:text-foreground ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="font-semibold text-neon hover:underline text-xs"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {filteredPosts.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-4">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <h3 className="font-display text-xl font-bold text-foreground">No articles found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  We couldn't find any articles matching your search filters. Try selecting another pillar
                  or resetting your tag filter.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  View All Articles
                </button>
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

                      <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-neon/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-neon uppercase tracking-wider">
                              Featured Deep Dive
                            </span>
                            {(featuredPost.tags || []).slice(0, 2).map((tag: string) => (
                              <button
                                key={tag}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleTagClick(tag);
                                }}
                                className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-neon transition"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>

                          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-neon transition leading-snug">
                            <Link to="/blog/$slug" params={{ slug: featuredPost.slug }}>
                              {featuredPost.title}
                            </Link>
                          </h2>

                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {featuredPost.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-neon" />
                            <span>{featuredPost.readTimeMinutes || 6} min read</span>
                          </div>

                          <Link
                            to="/blog/$slug"
                            params={{ slug: featuredPost.slug }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-neon group-hover:translate-x-1 transition-transform"
                          >
                            Read Deep Dive <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 2 OR 3 COLUMN GRID FOR REMAINING ARTICLES ── */}
                {gridPosts.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold text-foreground">Latest Publications</h3>
                      <span className="text-xs text-muted-foreground font-mono">
                        {gridPosts.length} article{gridPosts.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap gap-1.5">
                                {(post.tags || []).slice(0, 2).map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleTagClick(tag);
                                    }}
                                    className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-neon transition"
                                  >
                                    #{tag}
                                  </button>
                                ))}
                              </div>

                              <h3 className="font-display text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-neon transition line-clamp-2">
                                <Link to="/blog/$slug" params={{ slug: post.slug }}>
                                  {post.title}
                                </Link>
                              </h3>

                              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                {post.excerpt}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-3.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-neon" /> {post.readTimeMinutes || 5} min read
                              </span>
                              <Link
                                to="/blog/$slug"
                                params={{ slug: post.slug }}
                                aria-label={`Read full deep dive: ${post.title}`}
                                className="font-bold text-neon hover:underline inline-flex items-center gap-1"
                              >
                                Read Deep Dive →
                              </Link>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── DESKTOP EXPLORATION SIDEBAR (4 or 3 Cols) ── */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-8">
            {/* GO-TO-LAUNCH BLUEPRINT PROMO */}
            <div className="rounded-3xl border-2 border-neon/40 bg-gradient-to-br from-card via-card/95 to-neon/15 p-6 shadow-card space-y-4 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neon/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-neon uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Founder Framework™
              </div>
              <h4 className="font-display text-base font-bold text-foreground">
                Building an MVP from Scratch?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stress-test your architecture boundaries and prevent costly agency rewrites. Build
                your customized execution blueprint free in 10 minutes.
              </p>
              <Link
                to="/blueprint"
                className="block text-center rounded-xl bg-neon px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-neon transition hover:brightness-110"
              >
                Generate Blueprint ⚡
              </Link>
            </div>

            {/* TOPIC TAG CLOUD (SEO & EXPLORATION HUB) */}
            {allTagsWithCount.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display text-xs font-bold text-foreground uppercase tracking-wider">
                    <TagIcon className="h-4 w-4 text-neon" /> Popular Topic Tags
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {allTagsWithCount.length} tags
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {allTagsWithCount.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedTag === tag
                          ? "bg-neon text-primary-foreground shadow-neon font-bold"
                          : "border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <span>#{tag}</span>
                      <span className="text-[10px] opacity-60 font-mono">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FRACTIONAL CTO & TECHNICAL PARTNER ADVISORY CARD */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
              <div className="flex items-center gap-2 font-display text-xs font-bold text-foreground uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-neon" /> Need a Technical Partner?
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hire Mehdi Golzari as your Senior Fractional CTO to lead system architecture, audit dev
                deliverables, and take your product from 0 to scale.
              </p>
              <div className="pt-1 flex flex-col gap-2">
                <Link
                  to="/services"
                  className="block text-center rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted transition"
                >
                  Fractional CTO Advisory →
                </Link>
                <Link
                  to="/contact"
                  className="block text-center rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted transition"
                >
                  Schedule Code Audit →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
