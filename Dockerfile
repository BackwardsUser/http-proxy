FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY build ./build
COPY routes ./routes
COPY development ./development

CMD ["node", "build/index.js"]