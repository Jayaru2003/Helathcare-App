FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY libs/ ./libs/
COPY services/prescription/ ./services/prescription/
RUN npm ci
RUN npm run build -w libs/logger
RUN npm run build -w libs/errors
RUN npm run build -w libs/dto
RUN npm run build -w libs/kafka
RUN npm run build -w libs/middleware
RUN npm run build -w services/prescription

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/services/prescription/dist ./dist
COPY --from=builder /app/services/prescription/package.json ./package.json
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=60s \
  CMD wget -q -O- http://localhost:3004/health || exit 1
CMD ["node", "dist/index.js"]
