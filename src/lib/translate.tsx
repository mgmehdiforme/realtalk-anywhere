import { useEffect, useRef, useState } from "react";
import { Globe, Check, Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

const LANGS = [
  { code: "en", label: "English", flag: "EN" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
];

const INCLUDED = LANGS.map((l) => l.code).join(",");

function setCookie(name: string, value: string) {
  const host = window.location.hostname;
  document.cookie = `${name}=${value};path=/`;
  document.cookie = `${name}=${value};path=/;domain=.${host}`;
  const parts = host.split(".");
  if (parts.length > 1) {
    const root = parts.slice(-2).join(".");
    document.cookie = `${name}=${value};path=/;domain=.${root}`;
  }
}

export function LanguageSelect() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    // Track current selection from cookie
    const m = document.cookie.match(/googtrans=\/[a-z]+\/([a-z-]+)/);
    if (m) setCurrent(m[1]);

    if (loaded.current) return;
    loaded.current = true;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: INCLUDED,
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element",
        );
      }
    };

    const s = document.createElement("script");
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);

    // Aggressively hide the Google Translate banner whenever it gets injected
    const killBanner = () => {
      document
        .querySelectorAll<HTMLElement>(
          ".goog-te-banner-frame, iframe.goog-te-banner-frame, iframe.skiptranslate",
        )
        .forEach((el) => {
          el.style.display = "none";
          el.style.visibility = "hidden";
          el.style.height = "0";
        });
      if (document.body.style.top) document.body.style.top = "";
      if (document.documentElement.style.top) document.documentElement.style.top = "";
    };
    const observer = new MutationObserver(killBanner);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const id = window.setInterval(killBanner, 400);
    return () => {
      observer.disconnect();
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (code: string) => {
    if (code === current) {
      setOpen(false);
      return;
    }
    setCurrent(code);
    setOpen(false);
    setLoading(true);
    if (code === "en") {
      setCookie("googtrans", "");
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } else {
      setCookie("googtrans", `/en/${code}`);
    }
    setTimeout(() => window.location.reload(), 150);
  };

  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      {/* Hidden Google widget container */}
      <div id="google_translate_element" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden />

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose language"
        className="notranslate inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{active.flag}</span>
        <span className="hidden sm:inline">{active.label}</span>
      </button>

      {open && (
        <div className="notranslate absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-foreground/90 transition hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </span>
              {l.code === current && <Check className="h-4 w-4 text-neon" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
