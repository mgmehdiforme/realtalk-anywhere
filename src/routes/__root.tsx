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
import { Menu, X } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DemoModalProvider, DemoButton } from "../lib/demo-modal";
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
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-neon px-4 py-2 text-sm font-medium text-primary-foreground shadow-neon">
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
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-neon px-4 py-2 text-sm font-medium text-primary-foreground shadow-neon"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
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
      { name: "description", content: "Work directly with the senior engineer Mehdi Golzari building your product. SaaS MVP, AI MVP, scaling and fractional CTO — no agencies, no middlemen." },
      { name: "author", content: "Mehdi Golzari" },
      { property: "og:title", content: "Senior Independent Technical Partner for SaaS Founders" },
      { property: "og:description", content: "Work directly with the senior engineer Mehdi Golzari building your product. SaaS MVP, AI MVP, scaling and fractional CTO — no agencies, no middlemen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Senior Independent Technical Partner for SaaS Founders" },
      { name: "twitter:description", content: "Work directly with the senior engineer Mehdi Golzari building your product. SaaS MVP, AI MVP, scaling and fractional CTO — no agencies, no middlemen." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ac23c38d-b692-43ac-863d-d0c7e38bfc5b" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ac23c38d-b692-43ac-863d-d0c7e38bfc5b" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
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
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NavBar() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/" as const, label: "Home", exact: true },
    { to: "/services" as const, label: "Offers" },
    { to: "/about" as const, label: "About" },
    { to: "/resume" as const, label: "Resume" },
    { to: "/contact" as const, label: "Contact" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neon shadow-neon">
            <span className="h-3 w-3 rounded-sm bg-background" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">MehdiGolzari<span className="text-neon-gradient">.dev</span></span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={l.exact ? { exact: true } : undefined}
              className="rounded-md px-3 py-2 text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSelect />
          <ThemeToggle />
          <DemoButton className="hidden sm:inline-flex">Book a Call</DemoButton>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-3 text-sm sm:px-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={l.exact ? { exact: true } : undefined}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "rounded-md px-3 py-3 text-foreground bg-muted" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 px-1 pb-1">
              <DemoButton className="w-full justify-center">Book a Call</DemoButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}


function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row sm:px-8">
        <div>© {new Date().getFullYear()} Mehdi Golzari · Independent Technical Partner</div>
        <div className="flex gap-4">
          <a className="hover:text-foreground" href="mailto:MehdiGolzari.official@gmail.com">Email</a>
          <a className="hover:text-foreground" href="https://wa.me/905019390465" target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="hover:text-foreground" href="https://linkedin.com/in/mehdigolzariofficial" target="_blank" rel="noreferrer">LinkedIn</a>
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
