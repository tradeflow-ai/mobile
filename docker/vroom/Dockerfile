# TradeFlow VROOM Routing Engine
# 
# This Dockerfile builds a containerized VROOM routing engine for TradeFlow's
# proprietary routing optimization capabilities. VROOM provides advanced
# Vehicle Routing Problem (VRP) solving with time windows and capacity constraints.

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    cmake \
    git \
    libcrypto3 \
    libssl3 \
    openssl-dev \
    pkgconfig

# Create app directory
WORKDIR /app

# Clone and build VROOM
RUN git clone https://github.com/VROOM-Project/vroom.git . && \
    git checkout v1.14.0

# Install VROOM dependencies and build
RUN make

# Install Node.js dependencies for API server
COPY package*.json ./
RUN npm install --production

# Copy configuration files
COPY config/ ./config/

# Copy API server
COPY server.js ./

# Create non-root user
RUN addgroup -g 1001 -S vroom && \
    adduser -S vroom -u 1001

# Change ownership of app directory
RUN chown -R vroom:vroom /app

USER vroom

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the VROOM API server
CMD ["node", "server.js"] 