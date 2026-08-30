# MehdiGolzari.dev (realtalk-anywhere)

> **High-Performance SSR Web Application & Autonomous AI Thought Leadership Platform** for Mehdi Golzari (Senior Independent Technical Partner & Fractional CTO for SaaS & AI Founders).

---

## 🌟 Key Capabilities

- **Founder-to-Launch Framework™:** Interactive 7-phase methodology guiding early-stage founders from concept discovery to market scale.
- **Go-to-Launch Blueprint™:** 6-step interactive AI scoping engine powered by Qwen 3.7 Plus that generates personalized startup roadmaps and downloadable multi-page PDF reports.
- **Autonomous AI Blog Engine:** Autonomous 4-stage technical publishing pipeline powered by **Google Gemini Deep Research** and **Gemini 2.0 / 3.7 Flash**, executing every 48 hours via Cloud Scheduler.
- **Admin Management Portal (`/admin/blog`):** Secured with HMAC-SHA256 session tokens, featuring real-time KPI metrics, manual generation triggers, a split-screen live markdown editor, and cover image generator.
- **Modern Sticky Navigation:** Compacts on scroll with frosted glass backdrop blur and floating pill active navigation.
- **Dynamic SEO & Syndication:** Automated `/sitemap.xml`, OpenGraph/Twitter meta cards, and Schema.org `TechArticle` / `BreadcrumbList` JSON-LD structured data.

---

## 📚 Technical Documentation

- 📖 **[Autonomous AI Blog Engine Documentation](./AUTONOMOUS_AI_BLOG_ENGINE.md)** — Complete specification of the 4-stage pipeline, Gemini Deep Research agent, vector hero graphics, admin portal, and GCP Cloud Scheduler automation.

---

## 🛠️ Technology Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) + Vite
- **UI & Styling:** React 19, Tailwind CSS v4, Radix UI primitives, Lucide Icons, OKLCH Color Palette
- **Server & SSR:** Nitro 3, H3
- **AI & LLM Providers:**
  - Google Gemini API (`generativelanguage.googleapis.com`) — Gemini 2.0 / 3.7 Flash & Deep Research Agent with Google Search Grounding
  - Alibaba Cloud ModelStudio — Qwen 3.7 Plus (`qwen3.7-plus`)
- **PDF Generation:** PDFKit
- **Markdown Rendering:** Marked + Custom Prose Typography
- **Hosting & Infrastructure:** Google Cloud Run (Region: `europe-west1`), Google Cloud Storage FUSE Mount (`/app/data`), Google Cloud Scheduler

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript typecheck
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## ⚙️ Google Cloud Deployment

Automated provisioning scripts are available in the [`scripts/`](./scripts/) directory:

```powershell
# PowerShell (Windows)
.\scripts\setup-gcp-full.ps1

# Bash (Linux / Cloud Shell)
./scripts/setup-gcp-full.sh
```
