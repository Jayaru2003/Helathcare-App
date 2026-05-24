FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY libs/ ./libs/
COPY services/appointment/ ./services/appointment/
RUN npm ci
RUN npm run db:generate -w @healthbridge/appointment
RUN npm run build -w libs/logger
RUN npm run build -w libs/errors
RUN npm run build -w libs/dto
RUN npm run build -w libs/kafka
RUN npm run build -w libs/middleware
RUN npm run build -w services/appointment

FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/services/appointment/dist ./dist
COPY --from=builder /app/services/appointment/package.json ./package.json
COPY --from=builder /app/services/appointment/prisma ./prisma
# ⚡ CRITICAL FIX: Mirror schema at the exact path baked into the generated Prisma client
# The builder-stage client resolves: node_modules/.prisma/client → ../../services/appointment/prisma
# Without this directory, Prisma's query engine throws at runtime → blank 500 response
COPY --from=builder /app/services/appointment/prisma ./services/appointment/prisma
EXPOSE 3003
CMD ["node", "dist/index.js"]
