# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY src ./src
COPY routes ./routes

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/routes ./routes

RUN npm ci --only=production

CMD ["node", "dist/index.js"]