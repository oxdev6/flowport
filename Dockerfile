# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:18-bullseye AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# --- Runtime stage ---
FROM node:18-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start:web"]
