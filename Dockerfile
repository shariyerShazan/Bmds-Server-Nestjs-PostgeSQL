# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Build application (runs: nest build && node fix-prisma.js)
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/package.json ./package.json

# Copy prisma folder for migrations and config for datasource URL
COPY prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3333

# Run migrations then start the server
CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy && node dist/src/main"]
