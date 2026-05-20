# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json* ./
COPY tsconfig.json ./

# Copy libs
COPY libs/ ./libs/

# Copy service
COPY services/api-gateway/ ./services/api-gateway/

# Install all dependencies
RUN npm ci --workspaces --if-present

# Build libs first
RUN npm run build -w @healthbridge/logger
RUN npm run build -w @healthbridge/errors
RUN npm run build -w @healthbridge/middleware

# Build service
RUN npm run build -w @healthbridge/api-gateway

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S healthbridge -u 1001

WORKDIR /app

COPY --from=builder --chown=healthbridge:nodejs /app/services/api-gateway/dist ./dist
COPY --from=builder --chown=healthbridge:nodejs /app/services/api-gateway/package.json ./
COPY --from=builder --chown=healthbridge:nodejs /app/libs/logger/dist ./node_modules/@healthbridge/logger/dist
COPY --from=builder --chown=healthbridge:nodejs /app/libs/errors/dist ./node_modules/@healthbridge/errors/dist
COPY --from=builder --chown=healthbridge:nodejs /app/libs/middleware/dist ./node_modules/@healthbridge/middleware/dist

RUN npm install --production --ignore-scripts 2>/dev/null; true

USER healthbridge

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
