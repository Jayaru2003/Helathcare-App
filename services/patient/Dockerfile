FROM node:20-alpine AS builder

WORKDIR /app

# Root files
COPY package.json package-lock.json tsconfig.json ./

# Monorepo folders
COPY libs/ ./libs/
COPY services/patient/ ./services/patient/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npm run db:generate -w @healthbridge/patient

# Build shared libs
RUN npm run build -w libs/logger
RUN npm run build -w libs/errors
RUN npm run build -w libs/dto
RUN npm run build -w libs/kafka
RUN npm run build -w libs/middleware

# Build patient service
RUN npm run build -w services/patient

# =========================
# Production stage
# =========================

FROM node:20-alpine AS production

WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built libs
COPY --from=builder /app/libs ./libs

# Copy built app
COPY --from=builder /app/services/patient/dist ./dist

# Copy package.json
COPY --from=builder /app/services/patient/package.json ./package.json

# Copy Prisma schema
COPY --from=builder /app/services/patient/prisma ./prisma

EXPOSE 3002

CMD ["node", "dist/index.js"]