import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Shield,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  LogOut,
  Upload,
  RefreshCw,
  AlertTriangle,
  Play,
  Trash2,
  Eye,
  Check,
  X,
  FileCode,
  Layers,
  Search,
  Archive,
  FolderArchive,
  HardDrive,
} from "lucide-react";
import {
  getLinkedInAdminStateAction,
  importLinkedInSessionAction,
  triggerLinkedInFeedRunAction,
  clearLinkedInSessionAction,
  extractLinkedInProfileArchiveAction,
} from "@/lib/linkedin-admin-functions";
import type { ProfileStatusResult } from "@/lib/linkedin-runner";
import type { LinkedInEngagementLog } from "@/lib/db";

export const Route = createFileRoute("/admin/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Feed Engagement Engine — MehdiGolzari.dev" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLinkedInDashboard,
});

function AdminLinkedInDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{
    authenticated: boolean;
    connected: boolean;
    profileStatus?: ProfileStatusResult;
    config: {
      lastImportedAt: string | null;
      accountInfo: { name?: string; headline?: string } | null;
      schedule: {
        enabled: boolean;
        morningHourUtc: number;
        afternoonHourUtc: number;
        maxPerDay: number;
      };
      logs: LinkedInEngagementLog[];
    } | null;
    stats: { publishedToday: number; totalPublished: number; totalSkipped: number };
  } | null>(null);

  const [running, setRunning] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [showBrowserWindow, setShowBrowserWindow] = useState(true);
  const [useImportedSession, setUseImportedSession] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractingArchive, setExtractingArchive] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [activeLogModal, setActiveLogModal] = useState<LinkedInEngagementLog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const data = await getLinkedInAdminStateAction();
      if (!data.authenticated) {
        navigate({ to: "/admin/login" });
        return;
      }
      setState(data as any);
    } catch (e) {
      console.error("Failed to load LinkedIn state:", e);
      navigate({ to: "/admin/login" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const res = await importLinkedInSessionAction({ data: { rawSessionJson: text } });

      if (res.success) {
        alert(
          `Session imported successfully! Connected as: ${res.accountInfo?.name || "LinkedIn User"} (${res.cookiesCount} cookies)`,
        );
        await loadData();
      } else {
        alert(`Import Error: ${res.error || "Failed to parse session file."}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to import session: ${err?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExtractArchive = async () => {
    setExtractingArchive(true);
    try {
      const res = await extractLinkedInProfileArchiveAction();
      if (res.success) {
        alert(
          `Profile Archive Extracted Successfully!\n\n${res.message}\n` +
            (res.fileCount ? `Files: ${res.fileCount}\n` : "") +
            (res.cookiesFound ? `Active Cookies: ${res.cookiesFound}` : ""),
        );
        await loadData();
      } else {
        alert(`Archive Extraction Failed: ${res.message || (res as any).error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Extract archive error:", err);
      alert(`Failed to extract profile archive: ${err?.message || "Unknown error"}`);
    } finally {
      setExtractingArchive(false);
    }
  };

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !file.name.endsWith(".zip") &&
      !file.name.endsWith(".tar.gz") &&
      !file.name.endsWith(".tgz")
    ) {
      alert("Please select a valid .zip or .tar.gz archive file.");
      return;
    }

    setUploadingZip(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/linkedin/upload-profile-zip", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const res = await response.json();
      if (res.success) {
        alert(
          `Profile Archive Replaced & Extracted Successfully!\n\n${res.message}\n` +
            (res.fileCount ? `Files: ${res.fileCount}\n` : "") +
            (res.cookiesFound ? `Active Cookies: ${res.cookiesFound}` : ""),
        );
        await loadData();
      } else {
        alert(`Profile ZIP Upload Failed: ${res.message || res.error || "Server error"}`);
      }
    } catch (err: any) {
      console.error("Profile zip upload error:", err);
      alert(`Upload failed: ${err?.message || "Network or server error"}`);
    } finally {
      setUploadingZip(false);
      if (zipFileInputRef.current) zipFileInputRef.current.value = "";
    }
  };

  const handleTriggerRun = async (dryRun: boolean = false) => {
    if (!state?.connected) {
      alert("Please import an active LinkedIn session first.");
      return;
    }

    if (dryRun) {
      setDryRunning(true);
    } else {
      setRunning(true);
    }

    try {
      const res = await triggerLinkedInFeedRunAction({
        data: {
          dryRun,
          showBrowser: showBrowserWindow,
          skipDailyLimit: true,
          useImportedSession,
        },
      });
      if (res.success && res.result) {
        if (res.result.status === "published") {
          alert(`Success! Published comment on post by ${res.result.targetPost?.authorName || "founder"}.`);
        } else if (res.result.status === "dry-run") {
          alert(`Dry Run Complete! Generated comment:\n\n"${res.result.comment}"`);
        } else if (res.result.status === "skipped") {
          alert(`Run skipped: ${res.result.reason || "No high-matching posts in feed today."}`);
        } else {
          alert(`Execution error: ${res.result.error || "Unknown error"}`);
        }
        await loadData();
      } else {
        alert(`Run failed: ${res.error || "Execution error"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to run LinkedIn feed automation.");
    } finally {
      setRunning(false);
      setDryRunning(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect and wipe the stored LinkedIn session?")) {
      return;
    }
    try {
      await clearLinkedInSessionAction();
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect session.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-neon" />
      </div>
    );
  }

  const logs = state?.config?.logs || [];
  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      log.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.postSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.searchQuery && log.searchQuery.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.sourceTrend && log.sourceTrend.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.generatedComment && log.generatedComment.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon text-primary-foreground shadow-neon">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display text-sm font-bold tracking-tight">
                LinkedIn Autonomous Engine
              </span>
              <span className="ml-2 rounded-full bg-neon/15 px-2 py-0.5 font-mono text-[10px] font-bold text-neon uppercase">
                Feed Scanner & CTO Copilot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/blog"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Blog Dashboard
            </Link>
            <Link
              to="/blog"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Public Site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 space-y-8">
        {/* KPI Metrics Header */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Session Status</span>
              {state?.connected ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xl font-bold font-display">
              {state?.connected ? (
                <span className="text-emerald-500">Connected</span>
              ) : (
                <span className="text-amber-500">Needs Profile</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 truncate">
              {state?.profileStatus?.hasExtracted
                ? `Chromium Profile Active (${state.profileStatus.extractedFileCount} files)`
                : state?.config?.accountInfo?.name || "No active session"}
            </div>
          </div>

          <div className="rounded-2xl border border-neon/20 bg-neon/5 p-5">
            <div className="flex items-center justify-between text-neon">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Outreach</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-neon">
              {state?.stats.publishedToday || 0} / {state?.config?.schedule?.maxPerDay || 2}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Cap: 2 comments max per 24h
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Published</span>
              <Sparkles className="h-4 w-4 text-neon" />
            </div>
            <div className="mt-2 text-2xl font-bold font-display">
              {state?.stats.totalPublished || 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              CTO-grade comments placed
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Feed Skips</span>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold font-display">
              {state?.stats.totalSkipped || 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Low-relevance skips (threshold &lt; 80)
            </div>
          </div>
        </div>

        {/* Action Hero: Trigger Runner */}
        <div className="rounded-3xl border-2 border-neon/30 bg-gradient-to-r from-card via-card/95 to-neon/10 p-6 sm:p-8 shadow-card relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-neon/15 px-2.5 py-0.5 text-[10px] font-bold text-neon uppercase tracking-wider border border-neon/20">
              <Sparkles className="h-3 w-3" /> Stealth Playwright + Gemini 3.7 (Google AI Search Grounding)
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Autonomous Search &amp; CTO Copilot
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Discovers live breaking tech debates via real-time Google Search grounding, dynamically formulates 
              high-intent search queries, evaluates posts against your Fractional CTO persona (zero recruiter posts, &ge; 80 threshold), 
              and crafts a concise, high-signal comment (40–75 words) with human typing jitter.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
            <button
              onClick={() => handleTriggerRun(false)}
              disabled={running || dryRunning || !state?.connected}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-50"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning Feed & Posting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Scan Feed & Comment Now
                </>
              )}
            </button>

            <button
              onClick={() => handleTriggerRun(true)}
              disabled={running || dryRunning || !state?.connected}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold hover:bg-muted transition disabled:opacity-50"
            >
              {dryRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neon" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-neon" />
              )}
              Dry Run (Test Without Posting)
            </button>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-1 py-1 sm:ml-auto">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={showBrowserWindow}
                  onChange={(e) => setShowBrowserWindow(e.target.checked)}
                  className="rounded border-border bg-background text-neon focus:ring-neon/30 h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                />
                <span>Show browser window</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground" title="Re-inject cookies from uploaded session JSON into the browser profile">
                <input
                  type="checkbox"
                  checked={useImportedSession}
                  onChange={(e) => setUseImportedSession(e.target.checked)}
                  className="rounded border-border bg-background text-neon focus:ring-neon/30 h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                />
                <span>Start with imported session</span>
              </label>
            </div>
          </div>
        </div>

        {/* Profile Cache Archive & Session Storage Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card 1: Chromium Profile Archive (.zip / .tar.gz) */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderArchive className="h-4 w-4 text-neon" />
                  <h3 className="font-display text-sm font-bold">Browser Profile Cache (.zip / .tar.gz)</h3>
                </div>
                {state?.profileStatus?.hasExtracted ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                    Cache Active
                  </span>
                ) : state?.profileStatus?.hasArchive ? (
                  <span className="rounded-full bg-neon/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-neon border border-neon/20">
                    Archive In Storage
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-500 border border-amber-500/20">
                    No Archive Found
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Persistent Chromium browser profile cache used by Playwright. Upload a new <code className="bg-muted px-1 rounded text-[10px]">.zip</code> to replace it, or extract the existing archive from Cloud Storage into local <code className="bg-muted px-1 rounded text-[10px]">/tmp</code> cache.
              </p>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-3.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Storage Archive:</span>
                <span className="font-medium text-foreground">
                  {state?.profileStatus?.hasArchive ? (
                    <span className="text-neon font-bold">
                      {state.profileStatus.archiveName} ({state.profileStatus.archiveSizeFormatted || ""})
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">None in /app/data</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Active Cache:</span>
                <span className="font-medium text-foreground">
                  {state?.profileStatus?.hasExtracted ? (
                    <span className="text-emerald-500 font-bold">
                      ✓ Ready ({state.profileStatus.extractedFileCount} files in Default/)
                    </span>
                  ) : (
                    <span className="text-amber-500">Not extracted yet</span>
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <input
                ref={zipFileInputRef}
                type="file"
                accept=".zip,.tar.gz,.tgz"
                onChange={handleZipUpload}
                className="hidden"
                id="profile-zip-upload-input"
              />

              <button
                onClick={handleExtractArchive}
                disabled={extractingArchive || uploadingZip || !state?.profileStatus?.hasArchive}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition disabled:opacity-50"
                title={state?.profileStatus?.hasArchive ? "Extract archive from /app/data to local /tmp profile cache" : "No archive available in storage"}
              >
                {extractingArchive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-neon" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 text-neon" />
                )}
                Extract Archive from Storage
              </button>

              <button
                onClick={() => zipFileInputRef.current?.click()}
                disabled={extractingArchive || uploadingZip}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neon/15 border border-neon/30 px-3.5 py-2 text-xs font-semibold text-neon hover:bg-neon/25 transition disabled:opacity-50"
                title="Upload and extract a new zipped Chromium profile archive (.zip)"
              >
                {uploadingZip ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Upload &amp; Replace Profile ZIP
              </button>
            </div>

            <div className="text-[10px] text-muted-foreground/80 font-mono bg-muted/30 p-2.5 rounded-xl border border-border/50">
              Persistent storage: <span className="text-foreground font-semibold">/app/data</span> &rarr; ephemeral profile: <span className="text-foreground font-semibold">/tmp/.linkedin-profile-cache</span>
            </div>
          </div>

          {/* Card 2: JSON Session Storage */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-neon" />
                  <h3 className="font-display text-sm font-bold">JSON Session State</h3>
                </div>
                {state?.connected && (
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-destructive hover:underline flex items-center gap-1"
                    title="Disconnect and clear stored session"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Disconnect
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Export session cookies array from local Playwright CLI using <code className="bg-muted px-1 rounded text-[10px]">npm run linkedin:login</code> and import the JSON file here.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-center space-y-3">
              <FileCode className="h-6 w-6 text-neon mx-auto opacity-80" />
              <div className="text-xs font-medium">
                {state?.config?.accountInfo?.name ? (
                  <div className="text-emerald-500 font-semibold">
                    ✓ Session Active ({state.config.accountInfo.name})
                  </div>
                ) : (
                  <div className="text-muted-foreground">Upload linkedin-session.json</div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="session-upload-input"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-neon" />
                )}
                {state?.config?.accountInfo?.name ? "Replace Session JSON" : "Import Session File"}
              </button>
            </div>

            <div className="text-[10px] text-muted-foreground/80 font-mono bg-muted/30 p-2.5 rounded-xl border border-border/50">
              Run locally: <span className="text-neon font-bold">npm run linkedin:login</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity by author, snippet, or comment..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs text-foreground focus:border-neon focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {["all", "published", "dry-run", "skipped", "failed"].map((status) => (
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

        {/* Engagement Activity Logs Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="border-b border-border px-5 py-3.5 bg-muted/20 flex items-center justify-between">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Engagement Audit Log ({filteredLogs.length} events)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Author / Target</th>
                  <th className="px-5 py-3.5">Post Excerpt</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      No engagement logs found yet. Click "Scan Feed & Comment Now" or "Dry Run" to
                      start.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition">
                      <td className="px-5 py-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {log.searchQuery && (
                          <div className="inline-flex items-center gap-1 rounded bg-neon/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-neon mb-1 border border-neon/20">
                            🔍 {log.searchQuery}
                          </div>
                        )}
                        <div className="font-semibold text-foreground truncate max-w-[180px]">
                          {log.authorName}
                        </div>
                        {log.authorHeadline && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                            {log.authorHeadline}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-muted-foreground max-w-sm line-clamp-2 leading-relaxed">
                          {log.postSnippet}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                            log.relevanceScore >= 80
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {log.relevanceScore}/100
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            log.status === "published"
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                              : log.status === "dry-run"
                                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                                : log.status === "skipped"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {log.postUrl && log.postUrl.startsWith("http") && (
                            <a
                              href={log.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                              title="Open original post on LinkedIn"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setActiveLogModal(log)}
                            className="rounded-lg p-1.5 text-neon hover:bg-neon/10 transition"
                            title="View full comment & rationale"
                          >
                            <Eye className="h-3.5 w-3.5" />
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

      {/* Detail Inspection Modal */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-neon" />
                <h3 className="font-display text-sm font-bold">Engagement Log Details</h3>
              </div>
              <button
                onClick={() => setActiveLogModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {activeLogModal.sourceTrend && (
                <div className="rounded-2xl border border-neon/30 bg-neon/5 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neon">
                      <Sparkles className="h-3 w-3" /> Live Google Search Trend Grounding
                    </span>
                    {activeLogModal.searchQuery && (
                      <span className="rounded-md bg-neon/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-neon border border-neon/20">
                        "{activeLogModal.searchQuery}"
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-foreground font-medium">
                    {activeLogModal.sourceTrend}
                  </div>
                  {activeLogModal.relevanceAngle && (
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">CTO Strategic Angle:</span>{" "}
                      {activeLogModal.relevanceAngle}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-muted-foreground font-semibold uppercase text-[10px]">
                  Author & Target
                </label>
                <div className="mt-0.5 font-medium text-foreground">
                  {activeLogModal.authorName} — {activeLogModal.authorHeadline}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-semibold uppercase text-[10px]">
                  Post Excerpt
                </label>
                <div className="mt-0.5 p-3 rounded-xl bg-background border border-border text-muted-foreground leading-relaxed">
                  {activeLogModal.postSnippet}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-semibold uppercase text-[10px]">
                  AI Relevance Rationale ({activeLogModal.relevanceScore}/100)
                </label>
                <div className="mt-0.5 text-foreground font-medium">
                  {activeLogModal.relevanceReason}
                </div>
              </div>

              {activeLogModal.generatedComment && (
                <div>
                  <label className="text-neon font-semibold uppercase text-[10px]">
                    Generated CTO Comment ({activeLogModal.status})
                  </label>
                  <div className="mt-0.5 p-4 rounded-xl bg-neon/5 border border-neon/30 text-foreground leading-relaxed font-sans text-xs">
                    {activeLogModal.generatedComment}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              {activeLogModal.postUrl && activeLogModal.postUrl.startsWith("http") ? (
                <a
                  href={activeLogModal.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-neon hover:underline font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Post on LinkedIn
                </a>
              ) : (
                <div />
              )}
              <button
                onClick={() => setActiveLogModal(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
