import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Shield,
  Sparkles,
  Loader2,
  Plus,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  BookOpen,
  LogOut,
  X,
  Save,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Flame,
  LayoutGrid,
} from "lucide-react";
import {
  getAdminBlogState,
  triggerAutonomousGenerationAction,
  updateBlogPostAction,
  deleteBlogPostAction,
  regenerateCoverImageAction,
  adminLogoutAction,
} from "@/lib/admin-functions";
import type { BlogPost } from "@/lib/db";
import { marked } from "marked";
import {
  renderMermaidBlocksInContainer,
  MermaidViewerModal,
  type FullscreenDiagramData,
} from "@/components/blog/MermaidViewer";

function parseAdminMarkdown(content: string): string {
  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
    const cleanLang = (lang || "code").toLowerCase().trim();
    const encodedCode = encodeURIComponent(text);

    if (cleanLang === "mermaid" || cleanLang.startsWith("mermaid")) {
      return `<div class="mermaid-block-wrapper my-6 rounded-2xl border border-border bg-[#0a0f1d] overflow-hidden shadow-card group w-full max-w-full min-w-0" data-mermaid-code="${encodedCode}">
        <div class="flex items-center justify-between px-4 py-2 bg-[#0e162b] border-b border-border/80 text-[10px] font-mono text-muted-foreground">
          <div class="flex items-center gap-2">
            <span class="font-bold text-neon uppercase">MERMAID DIAGRAM</span>
            <div class="flex items-center rounded bg-background/60 p-0.5 border border-border/60 text-[9px]">
              <button type="button" data-tab="preview" class="px-2 py-0.5 rounded font-medium bg-neon/20 text-neon cursor-pointer">Preview</button>
              <button type="button" data-tab="code" class="px-2 py-0.5 rounded font-medium text-muted-foreground hover:text-foreground cursor-pointer">Code</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="mermaid-fullscreen-btn hover:text-foreground transition-colors px-2 py-0.5 rounded bg-muted/40 text-[9px] text-muted-foreground cursor-pointer">
              Fullscreen
            </button>
            <button type="button" class="mermaid-copy-btn hover:text-foreground transition-colors px-2 py-0.5 rounded bg-muted/40 text-[9px] text-muted-foreground cursor-pointer">
              Copy Code
            </button>
          </div>
        </div>
        <div class="mermaid-preview-container relative p-4 bg-[#070b14] flex flex-col items-center justify-center min-h-[120px] cursor-zoom-in group/preview overflow-x-auto select-none">
          <div class="mermaid-svg-target w-full flex justify-center py-2 opacity-50 animate-pulse">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">Rendering diagram...</div>
          </div>
          <div class="absolute bottom-2 right-2 opacity-0 group-hover/preview:opacity-100 transition-opacity px-2 py-0.5 rounded bg-background/90 text-[9px] text-neon font-mono pointer-events-none">
            Click to expand
          </div>
        </div>
        <div class="mermaid-code-container hidden p-3 overflow-x-auto bg-[#0a0f1d]">
          <pre class="w-full text-xs font-mono text-[#e2e8f0]"><code>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
        </div>
      </div>`;
    }

    return `<div class="my-4 rounded-xl border border-border bg-[#0a0f1d] overflow-hidden">
      <div class="flex items-center justify-between px-3 py-1.5 bg-[#0e162b] border-b border-border text-[10px] font-mono text-muted-foreground">
        <span class="font-bold text-neon uppercase">${cleanLang}</span>
      </div>
      <pre class="p-3 overflow-x-auto text-xs font-mono text-[#e2e8f0]"><code>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
    </div>`;
  };

  return marked.parse(content || "", { renderer }) as string;
}

export const Route = createFileRoute("/admin/blog")({
  head: () => ({
    meta: [
      { title: "Autonomous Blog Admin Dashboard — MehdiGolzari.dev" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBlogDashboard,
});

function AdminBlogDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{
    authenticated: boolean;
    user: any;
    posts: BlogPost[];
    metrics: { total: number; published: number; drafts: number; totalReadMinutes: number };
  } | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<BlogPost>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTab, setEditTab] = useState<"edit" | "preview">("edit");
  const [adminFullscreenDiagram, setAdminFullscreenDiagram] = useState<FullscreenDiagramData | null>(null);
  const adminPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editTab === "preview" && adminPreviewRef.current) {
      renderMermaidBlocksInContainer(adminPreviewRef.current, (data) => {
        setAdminFullscreenDiagram(data);
      });
    }
  }, [editTab, editFormData.content]);

  // Cover Image Regeneration State
  const [imageModalPost, setImageModalPost] = useState<BlogPost | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [regeneratingImage, setRegeneratingImage] = useState(false);

  const GEN_STEPS = [
    { label: "1. Scanning HackerNews & Substack trends with Gemini 3.7 Flash...", icon: "🔍" },
    { label: "2. Selecting unique, non-overlapping architectural problem...", icon: "💡" },
    { label: "3. Drafting CTO-grade markdown with trade-off matrices...", icon: "✍️" },
    { label: "4. Rendering 1200x630 dark-mode hero banner & publishing...", icon: "🎨" },
  ];

  const loadData = async () => {
    try {
      const data = await getAdminBlogState();
      if (!data.authenticated) {
        navigate({ to: "/admin/login" });
        return;
      }
      setState(data);
    } catch (e) {
      console.error(e);
      navigate({ to: "/admin/login" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    document.cookie = "mehdi_admin_session=; Path=/; Max-Age=0";
    await adminLogoutAction();
    navigate({ to: "/admin/login" });
  };

  const handleTriggerAutonomousGeneration = async () => {
    setGenerating(true);
    setGenStep(0);

    const timer = setInterval(() => {
      setGenStep((prev) => (prev < GEN_STEPS.length - 1 ? prev + 1 : prev));
    }, 4000);

    try {
      const res = await triggerAutonomousGenerationAction();
      if (res.success) {
        await loadData();
      } else {
        alert(`Generation Error: ${res.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to run autonomous generation pipeline.");
    } finally {
      clearInterval(timer);
      setGenerating(false);
      setGenStep(0);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const nextStatus: BlogPost["status"] =
      post.status === "published" ? "draft" : "published";
    try {
      await updateBlogPostAction({
        data: {
          id: post.id,
          updates: { status: nextStatus },
        },
      });
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    try {
      await deleteBlogPostAction({ data: { id: post.id } });
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to delete post.");
    }
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setEditFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: [...post.tags],
      status: post.status,
      content: post.content,
      readTimeMinutes: post.readTimeMinutes,
      seo: { ...post.seo },
    });
    setEditTab("edit");
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setSavingEdit(true);
    try {
      await updateBlogPostAction({
        data: {
          id: editingPost.id,
          updates: editFormData,
        },
      });
      setEditingPost(null);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!imageModalPost) return;
    setRegeneratingImage(true);
    try {
      await regenerateCoverImageAction({
        data: {
          id: imageModalPost.id,
          customPrompt: customPrompt.trim() || undefined,
        },
      });
      setImageModalPost(null);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate cover image.");
    } finally {
      setRegeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-neon" />
      </div>
    );
  }

  const posts = state?.posts || [];
  const filteredPosts = posts.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Admin Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon text-primary-foreground shadow-neon">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display text-sm font-bold tracking-tight">
                Admin Blog Governance
              </span>
              <span className="ml-2 rounded-full bg-neon/15 px-2 py-0.5 font-mono text-[10px] font-bold text-neon uppercase">
                48h Autonomous Cron
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/blog"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Public Blog
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 space-y-8">
        {/* KPI Metrics Header */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Articles</span>
              <FileText className="h-4 w-4 text-neon" />
            </div>
            <div className="mt-2 text-2xl font-bold font-display">{state?.metrics.total || 0}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Autonomous + Manual drafts</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {state?.metrics.published || 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Indexed and live on SSR</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Drafts / In Review</span>
              <Edit3 className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
              {state?.metrics.drafts || 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Awaiting publication</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Reading Volume</span>
              <Clock className="h-4 w-4 text-neon" />
            </div>
            <div className="mt-2 text-2xl font-bold font-display">
              {state?.metrics.totalReadMinutes || 0} min
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Total combined reading time</div>
          </div>
        </div>

        {/* Action Hero Bar: Autonomous Trigger */}
        <div className="rounded-3xl border-2 border-neon/30 bg-gradient-to-r from-card via-card/95 to-neon/10 p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon/10 blur-3xl" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neon/15 px-2.5 py-0.5 text-[10px] font-bold text-neon uppercase tracking-wider border border-neon/20">
                <Sparkles className="h-3 w-3" /> Gemini 3.7 Flash + Vertex AI
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Autonomous AI Generation Engine
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Discover trending CTO topics, evaluate architecture trade-offs, draft in-depth
                markdown, generate high-resolution hero banners, and publish automatically.
              </p>
            </div>

            <button
              onClick={handleTriggerAutonomousGeneration}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neon px-6 py-3.5 text-xs font-bold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-50 shrink-0 transform hover:scale-[1.01]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Autonomous Article...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Trigger AI Generation Now ⚡
                </>
              )}
            </button>
          </div>

          {/* Real-Time Generation Progress Card */}
          {generating && (
            <div className="mt-6 rounded-2xl border border-neon/30 bg-background/80 p-5 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-neon">
                <span>Autonomous Generation in Progress</span>
                <span>Step {genStep + 1} of {GEN_STEPS.length}</span>
              </div>
              <div className="space-y-2">
                {GEN_STEPS.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all ${
                      idx < genStep
                        ? "bg-emerald-500/10 text-emerald-500 font-medium"
                        : idx === genStep
                          ? "bg-neon/15 text-neon font-semibold border border-neon/30"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    <span>{step.icon}</span>
                    <span className="flex-1">{step.label}</span>
                    {idx < genStep && <Check className="h-4 w-4 text-emerald-500" />}
                    {idx === genStep && <Loader2 className="h-4 w-4 animate-spin text-neon" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, slug, or tag..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {["all", "published", "draft"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  statusFilter === status
                    ? "bg-neon text-primary-foreground shadow-neon"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Article</th>
                  <th className="px-5 py-3.5">Tags</th>
                  <th className="px-5 py-3.5">Read Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Published Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      No blog posts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/20 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.coverImage}
                            alt=""
                            className="h-10 w-16 object-cover rounded-lg border border-border bg-muted shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate max-w-sm">
                              {post.title}
                            </div>
                            <div className="text-muted-foreground text-[10px] font-mono truncate">
                              /blog/{post.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground font-mono text-[11px]">
                        {post.readTimeMinutes || 5} min
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(post)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition ${
                            post.status === "published"
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              post.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {post.status}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-[11px]">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Draft"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            target="_blank"
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="View live post"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setImageModalPost(post);
                              setCustomPrompt("");
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Regenerate cover image"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(post)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Edit content"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post)}
                            className="rounded-lg p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition"
                            title="Delete article"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SPLIT-SCREEN MARKDOWN EDIT MODAL
         ───────────────────────────────────────────────────────────────────────────── */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md">
          <div className="w-full max-w-5xl rounded-3xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-neon" />
                <h3 className="font-display text-base font-bold">Edit Article Content</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border p-0.5 bg-background">
                  <button
                    onClick={() => setEditTab("edit")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      editTab === "edit" ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Markdown Editor
                  </button>
                  <button
                    onClick={() => setEditTab("preview")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      editTab === "preview" ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Live Preview
                  </button>
                </div>
                <button
                  onClick={() => setEditingPost(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editFormData.slug || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Excerpt (Meta Description)
                </label>
                <textarea
                  rows={2}
                  value={editFormData.excerpt || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, excerpt: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
                />
              </div>

              {editTab === "edit" ? (
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Content Markdown
                  </label>
                  <textarea
                    rows={16}
                    value={editFormData.content || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background p-4 font-mono text-xs text-foreground leading-relaxed focus:border-neon focus:outline-none"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background p-6 max-h-[50vh] overflow-y-auto prose dark:prose-invert max-w-none text-xs">
                  <div
                    ref={adminPreviewRef}
                    dangerouslySetInnerHTML={{
                      __html: parseAdminMarkdown(editFormData.content || ""),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/20">
              <button
                onClick={() => setEditingPost(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex items-center gap-1.5 rounded-xl bg-neon px-5 py-2 text-xs font-semibold text-primary-foreground shadow-neon hover:brightness-110 disabled:opacity-50"
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          REGENERATE COVER IMAGE MODAL
         ───────────────────────────────────────────────────────────────────────────── */}
      {imageModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-neon" />
                <h3 className="font-display text-base font-bold">Cover Image Generator</h3>
              </div>
              <button
                onClick={() => setImageModalPost(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <img
                src={imageModalPost.coverImage}
                alt="Current Cover"
                className="w-full h-48 object-cover"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Custom Styling Prompt (Optional)
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Minimalist 3D isometric database grid with glowing cyan accents"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setImageModalPost(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateImage}
                disabled={regeneratingImage}
                className="flex items-center gap-1.5 rounded-xl bg-neon px-5 py-2 text-xs font-semibold text-primary-foreground shadow-neon hover:brightness-110 disabled:opacity-50"
              >
                {regeneratingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate Cover
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Admin Fullscreen Mermaid Modal */}
      <MermaidViewerModal
        data={adminFullscreenDiagram}
        onClose={() => setAdminFullscreenDiagram(null)}
      />
    </div>
  );
}
