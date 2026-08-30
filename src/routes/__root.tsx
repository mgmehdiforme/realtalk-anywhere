import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DemoModalProvider, DemoButton, useDemoModal } from "../lib/demo-modal";
import { ThemeProvider, ThemeToggle } from "../lib/theme";
import { LanguageSelect } from "../lib/translate";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-neon-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-neon px-4 py-2 text-sm font-medium text-primary-foreground shadow-neon"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-neon px-4 py-2 text-sm font-medium text-primary-foreground shadow-neon"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Senior Independent Technical Partner for SaaS Founders" },
      {
        name: "description",
        content:
          "Work directly with the senior engineer Mehdi Golzari building your product. SaaS MVP, AI MVP, scaling and fractional CTO — no agencies, no middlemen.",
      },
      { name: "author", content: "Mehdi Golzari" },
      { property: "og:title", content: "Senior Independent Technical Partner for SaaS Founders" },
      {
        property: "og:description",
        content:
          "Work directly with the senior engineer Mehdi Golzari building your product. SaaS MVP, AI MVP, scaling and fractional CTO — no agencies, no middlemen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Senior Independent Technical Partner for SaaS Founders" },
      {
        name: "twitter:description",
        content:
          "Work directly with the senior engineer Mehdi Golzari building your product. SaaS MVP, AI MVP, scaling and fractional CTO — no agencies, no middlemen.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ac23c38d-b692-43ac-863d-d0c7e38bfc5b",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ac23c38d-b692-43ac-863d-d0c7e38bfc5b",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Hidden persistent Google Translate element */}
        <div id="google_translate_element" style={{ display: "none" }} aria-hidden="true" />
        {children}
        <Scripts />

        {/* Google Translate Init & Loader */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.googleTranslateElementInit = function() {
                if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                  new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,nl,de,sv,da,no,fr,es',
                    autoDisplay: false,
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                  }, 'google_translate_element');
                }
              };

              function loadGoogleTranslateScript() {
                if (window._gtScriptLoaded) return;
                window._gtScriptLoaded = true;
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                document.head.appendChild(s);
              }

              // Load immediately if translated cookie is present, otherwise load on idle/interaction
              if (document.cookie.indexOf('googtrans=') !== -1 && document.cookie.indexOf('googtrans=/en/en') === -1) {
                loadGoogleTranslateScript();
              } else if ('requestIdleCallback' in window) {
                requestIdleCallback(loadGoogleTranslateScript, { timeout: 3500 });
              } else {
                window.addEventListener('load', loadGoogleTranslateScript);
              }
            `,
          }}
        />

        {/* Google Tag Manager (Deferred to idle to prevent render blocking) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-1CT57YD43D');

              function loadGtagScript() {
                if (window._gtagLoaded) return;
                window._gtagLoaded = true;
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://www.googletagmanager.com/gtag/js?id=G-1CT57YD43D';
                document.head.appendChild(s);
              }

              if ('requestIdleCallback' in window) {
                requestIdleCallback(loadGtagScript, { timeout: 3000 });
              } else {
                window.addEventListener('load', loadGtagScript);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const links = [
    { to: "/" as const, label: "Home", exact: true },
    { to: "/services" as const, label: "Offers" },
    { to: "/blog" as const, label: "Blog" },
    { to: "/about" as const, label: "About" },
    { to: "/resume" as const, label: "Resume" },
    { to: "/contact" as const, label: "Contact" },
    { to: "/blueprint" as const, label: "Go-to-Launch Blueprint™" },
  ];

  // Dynamic scroll listener for modern sticky UI/UX
  useEffect(() => {
    const handleScroll = () => {
      const isPastThreshold = window.scrollY > 15;
      setScrolled(isPastThreshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/80 bg-background/85 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl py-0.5"
          : "border-b border-border/40 bg-background/60 backdrop-blur-lg py-1.5"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 transition-all duration-300 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        <Link to="/" className="flex min-w-0 items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-neon shadow-neon transition-transform duration-200 group-hover:scale-105">
            <span className="h-3 w-3 rounded-sm bg-background" />
          </span>
          <span className="truncate font-display text-base font-semibold tracking-tight">
            MehdiGolzari<span className="text-neon-gradient">.dev</span>
          </span>
        </Link>

        {/* Desktop Modern Pill Nav */}
        <nav className="hidden items-center gap-1 text-sm md:flex rounded-full border border-border/50 bg-card/60 p-1 shadow-xs backdrop-blur-md">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={l.exact ? { exact: true } : undefined}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground"
              activeProps={{
                className:
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground bg-background shadow-xs border border-border/60",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSelect />
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            <DemoButton>Book a Call</DemoButton>
          </div>

          <div className="md:hidden">
            <LanguageSelect />
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-neon text-primary-foreground shadow-neon transition hover:brightness-110 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-in sidebar — portaled to body to escape header's backdrop-filter containing block */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className={`fixed inset-0 z-[100] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
            aria-hidden={!open}
          >
            <div
              onClick={() => setOpen(false)}
              className={`absolute inset-0 bg-foreground/30 backdrop-blur-md transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
            />
            <aside
              className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-border bg-background/95 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
                <span className="font-display text-sm font-semibold tracking-tight text-muted-foreground">
                  Menu
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 text-base">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    activeOptions={l.exact ? { exact: true } : undefined}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "rounded-lg px-4 py-3 text-foreground bg-muted font-semibold" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="flex shrink-0 items-center gap-2 border-t border-border px-5 py-4">
                <ThemeToggle />
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </header>
  );
}

function Footer() {
  const { open } = useDemoModal();
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 text-sm text-muted-foreground sm:flex-row sm:px-8">
        <div className="flex flex-col gap-1">
          <div>© {new Date().getFullYear()} Mehdi Golzari · Independent Technical Partner</div>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <a className="hover:text-foreground" href="mailto:MehdiGolzari.official@gmail.com">
              Email
            </a>
            <a
              className="hover:text-foreground"
              href="https://wa.me/905019390465"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <a
              href="https://linkedin.com/in/mehdigolzariofficial"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              LinkedIn
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-left sm:items-end">
          <Link to="/blog" className="hover:text-foreground">
            Technical Blog
          </Link>
          <Link to="/founder-to-launch-framework" className="hover:text-foreground">
            Founder-to-Launch Framework™
          </Link>
          <Link to="/blueprint" className="hover:text-foreground">
            Go-to-Launch Blueprint™
          </Link>
          <button
            onClick={open}
            className="hover:text-foreground cursor-pointer bg-transparent border-0 p-0 text-muted-foreground font-sans text-sm text-left sm:text-right"
          >
            Book Discovery Call
          </button>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DemoModalProvider>
          <div className="flex min-h-screen flex-col">
            <NavBar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </DemoModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
