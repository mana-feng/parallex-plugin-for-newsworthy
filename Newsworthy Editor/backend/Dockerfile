# Backend Dockerfile
FROM node:20-alpine

# Install necessary system dependencies (better-sqlite3 requires build tools, curl for health check)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory (for storing database files)
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["node", "server.js"]
