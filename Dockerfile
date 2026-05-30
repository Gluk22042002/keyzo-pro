FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

RUN addgroup -g 1001 -S keyzo && adduser -S keyzo -u 1001 -G keyzo

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY public ./public
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/logs && chown -R keyzo:keyzo /app

USER keyzo

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"

STOPSIGNAL SIGTERM

CMD ["node", "server/index.js"]
