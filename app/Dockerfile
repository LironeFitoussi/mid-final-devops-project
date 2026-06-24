# Provided, valid Dockerfile — the CI (Layer 5) builds the deployed image from this.
FROM node:20-alpine

# App listens here; Kubernetes Service/probes target 8080.
ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source.
COPY server.js ./
COPY public ./public

# Run as the unprivileged user that ships with the node image.
USER node

EXPOSE 8080

# Container-level health check (Kubernetes also probes /healthz).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "server.js"]
