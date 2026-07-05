# Provided, valid Dockerfile — the CI (Layer 5) builds the deployed image from this.
# Multi-stage MERN build: build the React client, compile the TS server, then ship
# a slim runtime that serves both on :8080.

# 1) Build the React client -> static assets
FROM node:20-alpine AS client-build
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# 2) Compile the Express + TypeScript server -> dist/
FROM node:20-alpine AS server-build
WORKDIR /server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# 3) Runtime image (production deps only)
FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled server + built client assets (served as static by Express).
COPY --from=server-build /server/dist ./dist
COPY --from=client-build /client/dist ./public

USER node
EXPOSE 8080

# Container-level health check (Kubernetes also probes /healthz).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "dist/index.js"]
