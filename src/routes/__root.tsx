import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DemoModalProvider, DemoButton } from "../lib/demo-modal";

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
      { title: "Universal Voice Translator — Real-time translation for any Windows app" },
      { name: "description", content: "Break the language barrier in any Windows app. Real-time voice translation over Discord, Google Meet, WhatsApp and more." },
      { name: "author", content: "Mehdi Golzari" },
      { property: "og:title", content: "Universal Voice Translator for Windows" },
      { property: "og:description", content: "Real-time voice translation for Discord, Google Meet, WhatsApp and any Windows app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neon shadow-neon">
            <span className="h-3 w-3 rounded-sm bg-background" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">UVT</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
          >
            Universal Voice Translator
          </Link>
          <Link
            to="/resume"
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
          >
            Resume
          </Link>
        </nav>
        <DemoButton className="hidden sm:inline-flex">Request Demo</DemoButton>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row sm:px-8">
        <div>© {new Date().getFullYear()} Mehdi Golzari · Universal Voice Translator</div>
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
      <DemoModalProvider>
        <div className="flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </DemoModalProvider>
    </QueryClientProvider>
  );
}
