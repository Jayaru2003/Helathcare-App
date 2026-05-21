# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.json ./

# Copy all libs and services
COPY libs/ ./libs/
COPY services/auth/ ./services/auth/

# Install ALL dependencies including workspaces
RUN npm ci

# Build libs first then service
RUN npm run build -w libs/logger
RUN npm run build -w libs/errors
RUN npm run build -w libs/dto
RUN npm run build -w libs/kafka
RUN npm run build -w libs/middleware
RUN npm run build -w services/auth

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/services/auth/dist ./dist
COPY --from=builder /app/services/auth/package.json ./package.json

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q -O- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
