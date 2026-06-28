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

# Copy only the Nitro output (self-contained — no node_modules needed)
COPY --from=builder /app/.output ./.output

# Copy PDFKit standard font metrics so standard fonts can resolve in ESM environment
COPY --from=builder /app/node_modules/pdfkit/js/data /app/node_modules/pdfkit/js/data

# Nitro's node-server entry point
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
