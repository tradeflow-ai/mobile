# TradeFlow VROOM Routing Engine
# 
# Production VROOM service with compiled binary
# Multi-stage build: compile VROOM binary then copy to runtime image

# Build stage - Compile VROOM binary
FROM ubuntu:20.04 AS builder

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies for VROOM
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libboost-all-dev \
    libasio-dev \
    libssl-dev \
    pkg-config \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for build
WORKDIR /build

# Clone VROOM source code
RUN git clone --depth 1 --branch v1.14.0 https://github.com/VROOM-Project/vroom.git

# Build VROOM binary
WORKDIR /build/vroom
RUN make

# Verify binary was created
RUN ls -la bin/ && test -f bin/vroom

# Runtime stage - Node.js server with VROOM binary
FROM node:18-alpine AS runtime

# Install curl for health checks and runtime dependencies
RUN apk add --no-cache curl libstdc++

# Create app directory
WORKDIR /app

# Create bin directory and copy VROOM binary from builder stage
RUN mkdir -p bin
COPY --from=builder /build/vroom/bin/vroom /app/bin/vroom

# Make VROOM binary executable
RUN chmod +x /app/bin/vroom

# Install Node.js dependencies for API server
COPY package*.json ./
RUN npm install --production

# Copy API server
COPY server.js ./
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S vroom && \
    adduser -S vroom -u 1001

# Change ownership of app directory
RUN chown -R vroom:vroom /app

USER vroom

# Set environment variables
ENV VROOM_BIN_PATH=/app/bin/vroom
ENV VROOM_PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the VROOM API server
CMD ["node", "server.js"] 