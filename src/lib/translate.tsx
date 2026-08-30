import { useEffect, useRef, useState } from "react";
import { Globe, Check, Loader2 } from "lucide-react";

const LANGS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

function setTranslationCookie(langCode: string) {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (!host) return;

  if (langCode === "en") {
    const expired = "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans${expired}`;
    document.cookie = `googtrans${expired} domain=${host};`;
    document.cookie = `googtrans${expired} domain=.${host};`;
    const parts = host.split(".");
    if (parts.length >= 2) {
      const root = parts.slice(-2).join(".");
      document.cookie = `googtrans${expired} domain=.${root};`;
    }
  } else {
    const val = `/en/${langCode}`;
    document.cookie = `googtrans=${val}; path=/;`;
    document.cookie = `googtrans=${val}; path=/; domain=${host};`;
    document.cookie = `googtrans=${val}; path=/; domain=.${host};`;
    const parts = host.split(".");
    if (parts.length >= 2) {
      const root = parts.slice(-2).join(".");
      document.cookie = `googtrans=${val}; path=/; domain=.${root};`;
    }
  }
}

export function LanguageSelect() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read current language from cookie
    const match = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/);
    if (match && match[1]) {
      setCurrent(match[1].toLowerCase());
    }
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectLanguage = (code: string) => {
    if (code === current && !loading) {
      setOpen(false);
      return;
    }

    setOpen(false);
    setLoading(true);
    setCurrent(code);
    setTranslationCookie(code);

    // Try live DOM trigger via Google Translate combo box
    const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  };

  const activeLang = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        aria-label="Select language"
        className="notranslate inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-neon" />
        ) : (
          <Globe className="h-3.5 w-3.5 text-neon" />
        )}
        <span className="text-sm leading-none">{activeLang.flag}</span>
        <span className="hidden sm:inline font-semibold">{loading ? "Translating…" : activeLang.label}</span>
      </button>

      {loading && (
        <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-transparent pointer-events-none">
          <div className="h-full w-1/3 animate-[slide-in-right_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-neon to-transparent" />
        </div>
      )}

      {open && (
        <div className="notranslate absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-2xl z-50 py-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => selectLanguage(l.code)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition ${
                l.code === current
                  ? "bg-neon/15 text-neon font-bold"
                  : "text-foreground/90 hover:bg-muted font-medium"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm leading-none">{l.flag}</span>
                <span>{l.label}</span>
              </span>
              {l.code === current && <Check className="h-3.5 w-3.5 text-neon" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
