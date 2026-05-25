# ─── Builder Stage ───
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Set the public backend API gateway endpoint baked in at build time
ENV NEXT_PUBLIC_API_URL=http://healthbridge-alb-1173736657.ap-southeast-2.elb.amazonaws.com
RUN npm run build

# ─── Production Stage ───
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

EXPOSE 3008
CMD ["npm", "run", "start"]
