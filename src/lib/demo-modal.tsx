import { createContext, useContext, useState, type ReactNode } from "react";
import { MessageCircle, Mail, X } from "lucide-react";

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
              No sales team. No project managers. Pick a channel — your message is pre-filled.
            </p>

            <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 font-mono text-sm leading-relaxed text-foreground/90">
              "{MESSAGE}"
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-center gap-2 rounded-xl bg-neon px-5 py-3.5 font-semibold text-primary-foreground shadow-neon transition hover:brightness-110"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
              <a
                href={mailHref}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3.5 font-semibold text-secondary-foreground transition hover:bg-muted"
              >
                <Mail className="h-5 w-5" />
                Email
              </a>
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
}: { className?: string; children?: ReactNode }) {
  const { open } = useDemoModal();
  return (
    <button
      onClick={open}
      className={
        "inline-flex items-center justify-center rounded-xl bg-neon px-5 py-3 text-sm font-semibold text-primary-foreground shadow-neon transition hover:brightness-110 " +
        className
      }
    >
      {children}
    </button>
  );
}
