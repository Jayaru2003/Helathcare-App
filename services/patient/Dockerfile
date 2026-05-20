# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY libs/ ./libs/
COPY services/patient/ ./services/patient/

RUN npm ci --workspaces --if-present

RUN npm run build -w @healthbridge/logger
RUN npm run build -w @healthbridge/errors
RUN npm run build -w @healthbridge/middleware
RUN npm run build -w @healthbridge/dto
RUN cd services/patient && npx prisma generate
RUN npm run build -w @healthbridge/patient

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S healthbridge -u 1001

WORKDIR /app

COPY --from=builder --chown=healthbridge:nodejs /app/services/patient/dist ./dist
COPY --from=builder --chown=healthbridge:nodejs /app/services/patient/package.json ./
COPY --from=builder --chown=healthbridge:nodejs /app/services/patient/prisma ./prisma
COPY --from=builder --chown=healthbridge:nodejs /app/node_modules/.prisma/patient-client ./node_modules/@prisma/client

RUN npm install --production --ignore-scripts 2>/dev/null; true

USER healthbridge

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]
