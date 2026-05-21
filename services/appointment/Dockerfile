FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY libs/ ./libs/
COPY services/appointment/ ./services/appointment/
RUN npm ci
RUN npm run build -w libs/logger
RUN npm run build -w libs/errors
RUN npm run build -w libs/dto
RUN npm run build -w libs/kafka
RUN npm run build -w libs/middleware
RUN cd services/appointment && npx prisma generate
RUN npm run build -w services/appointment

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/services/appointment/dist ./dist
COPY --from=builder /app/services/appointment/package.json ./package.json
COPY --from=builder /app/services/appointment/prisma ./prisma
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=60s \
  CMD wget -q -O- http://localhost:3003/health || exit 1
CMD ["node", "dist/index.js"]
