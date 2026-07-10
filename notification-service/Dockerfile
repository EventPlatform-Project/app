FROM node:18-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

ENV NODE_ENV=production
EXPOSE 9000

CMD ["node", "src/server.js"]
