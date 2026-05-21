FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY libs/ ./libs/
COPY services/patient/ ./services/patient/
RUN npm ci
RUN npm run db:generate -w @healthbridge/patient
RUN npm run build -w libs/logger
RUN npm run build -w libs/errors
RUN npm run build -w libs/dto
RUN npm run build -w libs/kafka
RUN npm run build -w libs/middleware
RUN npm run build -w services/patient

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/services/patient/dist ./dist
COPY --from=builder /app/services/patient/package.json ./package.json
COPY --from=builder /app/services/patient/prisma ./prisma
EXPOSE 3002
CMD ["node", "dist/index.js"]
