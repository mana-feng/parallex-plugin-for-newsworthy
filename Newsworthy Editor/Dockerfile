# Frontend Dockerfile - Supports development and production modes

# Development mode
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy configuration files
COPY vite.config.js ./
COPY index.html ./
COPY jsconfig.json ./
COPY eslint.config.js ./

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production environment uses nginx
FROM nginx:alpine AS production

# Copy build artifacts to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration file (if custom configuration is needed)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
