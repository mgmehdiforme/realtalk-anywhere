import React, { useState, useEffect } from "react";
import {
  X,
  FileDown,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { submitArticleLeadAction } from "@/lib/admin-functions";

interface DownloadBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    slug: string;
    title: string;
    category?: string;
  };
}

export function DownloadBriefModal({ isOpen, onClose, post }: DownloadBriefModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Founder / CEO");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMsg("");
      setIsSubmitting(false);
      // Pre-fill email from localStorage if returning founder
      const savedEmail = localStorage.getItem("founder_lead_email");
      const savedName = localStorage.getItem("founder_lead_name");
      if (savedEmail) setEmail(savedEmail);
      if (savedName) setName(savedName);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid work email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Submit lead to database
      const res = await submitArticleLeadAction({
        data: {
          email: email.trim(),
          name: name.trim() || undefined,
          role,
          articleSlug: post.slug,
          articleTitle: post.title,
          pillar: post.category,
          source: "brief_modal",
        },
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to record request. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // 2. Remember lead details for frictionless future downloads
      localStorage.setItem("founder_lead_email", email.trim());
      if (name.trim()) localStorage.setItem("founder_lead_name", name.trim());

      const url = res.downloadUrl || `/api/blog/brief?slug=${encodeURIComponent(post.slug)}`;
      setDownloadUrl(url);
      setIsSuccess(true);
      setIsSubmitting(false);

      // 3. Trigger native file download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${post.slug}-executive-architecture-brief.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 4. Auto-close after 3.5 seconds
      setTimeout(() => {
        onClose();
      }, 3500);
    } catch (err: any) {
      console.error("Lead submission error:", err);
      // Fallback: direct download even if backend action failed
      const fallbackUrl = `/api/blog/brief?slug=${encodeURIComponent(post.slug)}`;
      window.location.href = fallbackUrl;
      setIsSuccess(true);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-neon/40 bg-card p-6 sm:p-8 shadow-2xl backdrop-blur-2xl z-10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Glow Accent Circles */}
        <div className="absolute -top-20 -right-20 h-44 w-44 rounded-full bg-neon/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-neon-2/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 grid h-8 w-8 place-items-center rounded-full border border-border bg-background/80 text-muted-foreground hover:border-neon hover:text-foreground transition cursor-pointer"
          title="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="py-6 text-center space-y-5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-neon">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold text-foreground">
                Your Executive Brief is Downloading!
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Check your browser downloads. We've compiled the 2-page architecture summary and
                pre-development checklist for you.
              </p>
            </div>

            {downloadUrl && (
              <div className="pt-2">
                <a
                  href={downloadUrl}
                  download={`${post.slug}-executive-architecture-brief.pdf`}
                  className="text-xs font-semibold text-neon hover:underline inline-flex items-center gap-1.5"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Click here if download didn't start automatically</span>
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-border/80 text-[11px] text-muted-foreground">
              Need a personalized architecture review?{" "}
              <a href="/contact?topic=triage" className="text-neon hover:underline font-semibold">
                Book a 30-min triage call →
              </a>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-3 py-0.5 font-mono text-[10px] font-bold text-neon uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                <span>Executive Architecture Brief (PDF)</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug">
                Download the 2-Page Executive Brief
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                Key architectural decisions, non-negotiable standards, and pre-development checklist
                for <span className="text-foreground font-medium">"{post.title}"</span>.
              </p>
            </div>

            {/* Feature Highlights Pills */}
            <div className="rounded-2xl border border-border bg-background/60 p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-neon shrink-0" />
                <span>2-Page Condensed Investor & CTO Architecture Summary</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-neon shrink-0" />
                <span>Non-Negotiable Architecture Rules & Codebase Boundaries</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-neon shrink-0" />
                <span>Printable Founder Pre-Development Due Diligence Checklist</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Work Email <span className="text-neon">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@startup.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Your Name <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Alex Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">Your Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon transition"
                  >
                    <option value="Founder / CEO">Founder / CEO</option>
                    <option value="Technical Co-Founder">Technical Co-Founder</option>
                    <option value="CTO / VP Engineering">CTO / VP Engineering</option>
                    <option value="Senior Architect / Engineer">Senior Architect / Engineer</option>
                    <option value="Investor / Board Member">Investor / Board Member</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neon px-5 py-3 font-display text-xs font-bold text-primary-foreground shadow-neon hover:bg-neon/90 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing PDF Brief...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    <span>Download Free Executive Brief (PDF)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                <ShieldCheck className="h-3 w-3 text-neon" />
                <span>Zero spam. Direct architecture insights by Mehdi Golzari.</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
