# -----------------------------
# Builder Stage
# -----------------------------
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json tsconfig.json ./

# Copy full monorepo
COPY libs ./libs
COPY services ./services

# Install deps
RUN npm ci

# 🔥 IMPORTANT: Generate Prisma client BEFORE build
RUN npx prisma generate --schema=services/patient/prisma/schema.prisma

# Build shared libraries
RUN npm run build -w libs/logger
RUN npm run build -w libs/errors
RUN npm run build -w libs/dto
RUN npm run build -w libs/kafka
RUN npm run build -w libs/middleware

# Build patient service
RUN npm run build -w services/patient


# -----------------------------
# Production Stage
# -----------------------------
FROM node:20-alpine AS production

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/services/patient/dist ./dist
COPY --from=builder /app/services/patient/prisma ./prisma
# ⚡ CRITICAL FIX: Mirror schema at the exact path baked into the generated Prisma client
# The builder-stage client resolves: node_modules/.prisma/client → ../../services/patient/prisma
# Without this directory, Prisma's query engine throws at runtime → blank 500 response
COPY --from=builder /app/services/patient/prisma ./services/patient/prisma
COPY --from=builder /app/services/patient/package.json ./package.json

# Optional: reduce image size
ENV NODE_ENV=production

EXPOSE 3002

CMD ["node", "dist/index.js"]