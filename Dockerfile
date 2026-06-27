# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps: install all node_modules with Bun
# ─────────────────────────────────────────────────────────────────────────────
FROM oven/bun:1.2-slim AS deps

WORKDIR /app

# Copy package manifest and lockfile first for layer-cache efficiency
COPY package.json bun.lock bunfig.toml ./

# Install all dependencies (including devDependencies needed for the build)
# --frozen-lockfile ensures reproducibility
RUN bun install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder: compile the TanStack Start / Nitro app
# ─────────────────────────────────────────────────────────────────────────────
FROM oven/bun:1.2-slim AS builder

WORKDIR /app

# Re-use the installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source
COPY . .

# Build using the Cloud Run-compatible script (node-server Nitro preset)
# NITRO_PRESET is read by @lovable.dev/vite-tanstack-config / Nitro at build time
RUN NITRO_PRESET=node-server bun run build

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

# Nitro's node-server entry point
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
