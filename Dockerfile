# Build stage
FROM node:20-slim AS builder

# Install OpenSSL for Prisma, wget for downloading, and other build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install ngrok v3 binary directly (handles both AMD64 and ARM64)
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"; \
    elif [ "$ARCH" = "arm64" ]; then \
        NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz"; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    wget -q $NGROK_URL -O /tmp/ngrok.tgz && \
    tar -xzf /tmp/ngrok.tgz -C /usr/local/bin && \
    chmod +x /usr/local/bin/ngrok && \
    rm /tmp/ngrok.tgz && \
    ngrok --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for Prisma)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Production stage
FROM node:20-slim

# Install dumb-init for proper signal handling, netcat for health checks, and OpenSSL for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    netcat-openbsd \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy ngrok binary from builder stage
COPY --from=builder /usr/local/bin/ngrok /usr/local/bin/ngrok
RUN chmod +x /usr/local/bin/ngrok

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nodejs

# Set working directory
WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application and generated Prisma Client from builder
# get the pre-generated client without needing prisma devDependency
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy source code and copy prisma schema for migrations
COPY --chown=nodejs:nodejs . .
COPY --chown=nodejs:nodejs prisma ./prisma

USER nodejs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "index.js"]