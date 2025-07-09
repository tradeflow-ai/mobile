# TradeFlow LangGraph Backend
# 
# This Dockerfile creates a containerized Node.js environment for running
# LangGraph AI agents that are incompatible with React Native.

FROM node:18-alpine

# Install system dependencies (if needed for LangChain)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S langgraph && \
    adduser -S langgraph -u 1001

# Change ownership of app directory
RUN chown -R langgraph:langgraph /app

USER langgraph

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the backend service
CMD ["npm", "start"] 