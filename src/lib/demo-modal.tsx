import { createContext, useContext, useState, type ReactNode } from "react";
import { MessageCircle, Mail, X, ClipboardCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

const PHONE = "905019390465";
const EMAIL = "MehdiGolzari.official@gmail.com";
const MESSAGE =
  "Hi Mehdi! I'd like to book a free discovery call to discuss building/scaling my SaaS or AI product.";

const Ctx = createContext<{ open: () => void } | null>(null);

export function useDemoModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("DemoModalProvider missing");
  return ctx;
}

export function DemoModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  const waHref = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent("Discovery Call Request — MehdiGolzari.dev")}&body=${encodeURIComponent(MESSAGE)}`;

  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
          style={{ background: "oklch(0 0 0 / 55%)" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-7 shadow-card animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-1 text-xs font-medium uppercase tracking-widest text-neon-gradient">
              Free discovery call
            </div>
            <h2 className="text-2xl font-semibold">Talk directly to the engineer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No sales team. No project managers. Select an option below to begin.
            </p>

            {/* Highly Recommended Scoping Callout Card */}
            <div className="mt-5 rounded-2xl border border-neon/30 bg-gradient-to-r from-neon/15 to-primary/5 p-4 sm:p-5 relative overflow-hidden shadow-card">
              <div className="absolute top-0 right-0 rounded-bl-lg bg-neon/20 px-2.5 py-0.5 font-mono text-[9px] font-bold text-neon uppercase tracking-wider">
                Highly Recommended
              </div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ClipboardCheck className="h-4.5 w-4.5 text-neon" />
                Build Your Execution Blueprint First
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Create your personalized Go-to-Launch Blueprint™ before our session. Building your blueprint first clarifies your MVP scope and highlights technical risks so we can spend our time designing execution strategies.
              </p>
              <div className="mt-4">
                <Link
                  to="/blueprint"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-neon px-5 py-3 text-xs font-bold text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  Build My Blueprint ⚡
                </Link>
              </div>
            </div>

            {/* Separator */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-4 text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Or contact directly</span>
              <div className="flex-grow border-t border-border" />
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5 font-mono text-[11px] leading-relaxed text-foreground/80">
              "{MESSAGE}"
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary hover:bg-muted px-5 py-3 text-xs font-semibold transition"
                >
                  <MessageCircle className="h-4 w-4 text-neon" />
                  WhatsApp
                </a>
                <a
                  href={mailHref}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary hover:bg-muted px-5 py-3 text-xs font-semibold transition"
                >
                  <Mail className="h-4 w-4 text-neon" />
                  Email
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>+90 501 939 0465</div>
              <div className="text-right">{EMAIL}</div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function DemoButton({
  className = "",
  children = "Book Discovery Call",
  onClick,
}: { className?: string; children?: ReactNode; onClick?: () => void }) {
  const { open } = useDemoModal();
  return (
    <button
      onClick={() => { onClick?.(); open(); }}
      className={
        "inline-flex items-center justify-center rounded-xl bg-neon px-5 py-3 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 " +
        className
      }
    >
      {children}
    </button>
  );
}
