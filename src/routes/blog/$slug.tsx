import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { createServerFn } from "@tanstack/react-start";
import {
  Clock,
  ArrowLeft,
  Share2,
  Linkedin,
  Twitter,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  User,
  Shield,
  Layers,
  Calendar,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { getBlogPostBySlug, getBlogPosts, type BlogPost } from "@/lib/db";
import { marked } from "marked";

/**
 * Server Function to load post by slug and related posts
 */
export const getSingleBlogPost = createServerFn()
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const post = await getBlogPostBySlug(data.slug);
    if (!post) {
      return { post: null, related: [] };
    }

    const { posts: allPosts } = await getBlogPosts({ status: "published", limit: 4 });
    const related = allPosts.filter((p) => p.slug !== data.slug).slice(0, 3);

    return { post, related };
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const data = await getSingleBlogPost({ data: { slug: params.slug } });
    if (!data.post) {
      throw notFound();
    }
    return data;
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) {
      return { meta: [{ title: "Article Not Found — MehdiGolzari.dev" }] };
    }

    const canonicalUrl = `https://mehdigolzari.dev/blog/${post.slug}`;
    const coverUrl = post.coverImage.startsWith("http")
      ? post.coverImage
      : `https://mehdigolzari.dev${post.coverImage}`;

    const jsonLdArticle = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: post.title,
      description: post.excerpt,
      image: [coverUrl],
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt || post.publishedAt || post.createdAt,
      author: {
        "@type": "Person",
        name: "Mehdi Golzari",
        url: "https://mehdigolzari.dev/about",
        jobTitle: "Senior Independent Technical Partner",
      },
      publisher: {
        "@type": "Organization",
        name: "MehdiGolzari.dev",
        url: "https://mehdigolzari.dev",
        logo: {
          "@type": "ImageObject",
          url: "https://mehdigolzari.dev/favicon.ico",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      keywords: post.seo.keywords?.join(", ") || post.tags.join(", "),
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
          name: post.title,
          item: canonicalUrl,
        },
      ],
    };

    return {
      meta: [
        { title: `${post.title} — MehdiGolzari.dev` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: coverUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.excerpt },
        { name: "twitter:image", content: coverUrl },
        { name: "article:published_time", content: post.publishedAt || post.createdAt },
        { name: "article:author", content: "Mehdi Golzari" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLdArticle),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLdBreadcrumbs),
        },
      ],
    };
  },
  component: SingleBlogPostPage,
});

function SingleBlogPostPage() {
  const { post, related } = Route.useLoaderData();
  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>("");

  if (!post) return null;

  // Track scroll position for reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}`;
      setReadingProgress(Math.min(Math.max(Number(scroll), 0), 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parse Markdown & Extract Table of Contents
  const { htmlContent, toc } = useMemo(() => {
    const headings: Array<{ id: string; text: string; level: number }> = [];

    // Custom renderer to add IDs to headings for TOC linking
    const renderer = new marked.Renderer();
    renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
      const cleanText = text.replace(/<[^>]*>/g, "");
      const id = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      if (depth === 2 || depth === 3) {
        headings.push({ id, text: cleanText, level: depth });
      }

      return `<h${depth} id="${id}" class="scroll-mt-24 group flex items-center justify-between">${text}<a href="#${id}" class="opacity-0 group-hover:opacity-100 text-neon ml-2 text-sm">#</a></h${depth}>`;
    };

    const rawHtml = marked.parse(post.content, { renderer }) as string;
    return { htmlContent: rawHtml, toc: headings };
  }, [post.content]);

  const postUrl = typeof window !== "undefined" ? window.location.href : `https://mehdigolzari.dev/blog/${post.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ── TOP READING PROGRESS BAR ── */}
      <div className="fixed top-0 inset-x-0 z-[60] h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-neon via-primary to-neon-2 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <article className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-40" />
          <Link to="/blog" className="hover:text-foreground transition">
            Blog
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-40" />
          <span className="truncate max-w-[200px] sm:max-w-md text-foreground font-medium">
            {post.title}
          </span>
        </nav>

        {/* ── ARTICLE HEADER ── */}
        <header className="max-w-4xl space-y-6 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neon/15 px-3 py-1 font-mono text-[10px] font-bold text-neon uppercase tracking-wider border border-neon/30"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-neon text-primary-foreground font-bold font-display shadow-neon">
                MG
              </div>
              <div>
                <div className="font-semibold text-foreground">Mehdi Golzari</div>
                <div className="text-[11px]">Senior Independent Technical Partner</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neon" /> {formattedDate}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neon" /> {post.readTimeMinutes || 6} min read
              </span>
            </div>
          </div>
        </header>

        {/* ── HERO BANNER IMAGE ── */}
        <div className="max-w-5xl rounded-3xl border border-border bg-card overflow-hidden shadow-card mb-12">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover"
          />
        </div>

        {/* ── TWO-COLUMN ARTICLE BODY ── */}
        <div className="grid lg:grid-cols-12 gap-12 max-w-5xl">
          {/* Main Markdown Body (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed
                prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-foreground prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-5
                prose-a:text-neon prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-neon prose-blockquote:bg-card/50 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-foreground
                prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-2xl prose-pre:p-4 prose-pre:font-mono prose-pre:text-xs
                prose-code:text-neon prose-code:bg-neon/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[11px]
                prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-2.5 prose-th:bg-muted/40 prose-td:border prose-td:border-border prose-td:p-2.5
                prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-2 prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* ── IN-ARTICLE GO-TO-LAUNCH BLUEPRINT CONTEXTUAL CTA ── */}
            <div className="mt-12 rounded-3xl border-2 border-neon/40 bg-gradient-to-br from-card via-card/95 to-neon/15 p-8 shadow-card relative overflow-hidden space-y-4">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-neon/15 blur-2xl" />
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neon/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-neon uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Founder-to-Launch Framework™
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Want to stress-test your SaaS MVP architecture?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Avoid premature technical debt and validate your product boundaries before writing
                code. Build your customized Go-to-Launch Blueprint™ free in under 10 minutes.
              </p>
              <div className="pt-2">
                <Link
                  to="/blueprint"
                  className="inline-flex items-center gap-2 rounded-xl bg-neon px-5 py-3 text-xs font-bold text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  Generate My Execution Blueprint ⚡
                </Link>
              </div>
            </div>

            {/* ── AUTHOR SIGNATURE BIO BOX ── */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-neon text-primary-foreground font-bold font-display text-xl shadow-neon shrink-0">
                MG
              </div>
              <div className="space-y-1.5">
                <h4 className="font-display text-sm font-bold text-foreground">
                  Written by Mehdi Golzari
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Independent Technical Partner & Senior Architect helping early-stage SaaS and AI
                  founders take products from ideation to scalable production without agency overhead.
                </p>
                <div className="flex gap-3 text-xs pt-1">
                  <a
                    href="https://linkedin.com/in/mehdigolzariofficial"
                    target="_blank"
                    rel="noreferrer"
                    className="text-neon hover:underline"
                  >
                    LinkedIn
                  </a>
                  <span>·</span>
                  <Link to="/about" className="text-muted-foreground hover:text-foreground">
                    About Mehdi
                  </Link>
                  <span>·</span>
                  <Link to="/services" className="text-muted-foreground hover:text-foreground">
                    Work Together
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar (4 Cols) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents */}
              {toc.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
                  <div className="flex items-center gap-2 font-display text-xs font-bold text-foreground uppercase tracking-wider">
                    <BookOpen className="h-4 w-4 text-neon" /> Table of Contents
                  </div>
                  <nav className="space-y-1.5 text-xs">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-muted-foreground hover:text-foreground transition line-clamp-1 ${
                          item.level === 3 ? "pl-3 text-[11px]" : "font-medium"
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Social Share Box */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
                <div className="flex items-center gap-2 font-display text-xs font-bold text-foreground uppercase tracking-wider">
                  <Share2 className="h-4 w-4 text-neon" /> Share Article
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 p-2 text-xs font-semibold hover:bg-muted transition"
                  >
                    <Linkedin className="h-3.5 w-3.5 text-blue-500" /> LinkedIn
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 p-2 text-xs font-semibold hover:bg-muted transition"
                  >
                    <Twitter className="h-3.5 w-3.5 text-sky-400" /> X / Twitter
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${post.title} - ${postUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 p-2 text-xs font-semibold hover:bg-muted transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 p-2 text-xs font-semibold hover:bg-muted transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── RELATED ARTICLES ── */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-border pt-12 space-y-8 max-w-5xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-foreground">Related Technical Articles</h3>
              <Link to="/blog" className="text-xs font-semibold text-neon hover:underline">
                View all articles →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((r: BlogPost) => (
                <article
                  key={r.id}
                  className="group rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:border-neon/40 transition"
                >
                  <Link to="/blog/$slug" params={{ slug: r.slug }} className="block aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={r.coverImage}
                      alt={r.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                  <div className="p-4 space-y-2">
                    <h4 className="font-display text-xs font-bold text-foreground line-clamp-2 group-hover:text-neon transition">
                      <Link to="/blog/$slug" params={{ slug: r.slug }}>
                        {r.title}
                      </Link>
                    </h4>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
                      <span>{r.readTimeMinutes || 5} min read</span>
                      <span>
                        {new Date(r.publishedAt || r.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
