# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps: install all node_modules with NPM
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS deps

WORKDIR /app

# Copy package manifest and lockfile first for layer-cache efficiency
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for the build)
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder: compile the TanStack Start / Nitro app
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Re-use the installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source
COPY . .

# Build using the Cloud Run-compatible script (node-server Nitro preset)
# NITRO_PRESET is read by @lovable.dev/vite-tanstack-config / Nitro at build time
ENV NITRO_PRESET=node-server
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner: minimal production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
# Cloud Run injects PORT; default to 3000 for local testing
ENV PORT=3000
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV LINKEDIN_HEADLESS=true

# Install system libraries and utilities for Chromium Playwright execution
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    tar \
    gzip \
    unzip \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# Copy only the Nitro output (self-contained — no full node_modules needed)
COPY --from=builder /app/.output ./.output

# Copy PDFKit standard font metrics so standard fonts can resolve in ESM environment
COPY --from=builder /app/node_modules/pdfkit/js/data ./node_modules/pdfkit/js/data

# Copy Playwright runtime modules required for headless browser automation
COPY --from=builder /app/node_modules/playwright ./node_modules/playwright
COPY --from=builder /app/node_modules/playwright-core ./node_modules/playwright-core

# Nitro's node-server entry point
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
