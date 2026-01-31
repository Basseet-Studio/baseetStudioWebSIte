# Build stage
FROM node:20-alpine AS builder

# Install Hugo Extended and Go
ARG HUGO_VERSION=0.155.1
ARG GO_VERSION=1.24.0
RUN apk add --no-cache \
    wget \
    ca-certificates \
    libc6-compat \
    libstdc++ \
    go \
    git && \
    wget -O /tmp/hugo.tar.gz https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz && \
    tar -xzf /tmp/hugo.tar.gz -C /tmp && \
    mv /tmp/hugo /usr/bin/hugo && \
    chmod +x /usr/bin/hugo && \
    rm -rf /tmp/*

# Verify Hugo is installed
RUN hugo version

WORKDIR /app

# Copy all project files first (needed for postinstall script)
COPY . .

# Install Node dependencies (this will run postinstall script)
RUN npm ci

# Initialize and vendor Hugo modules
RUN hugo mod get -u && hugo mod vendor

# Build the site with production baseURL (root path for Coolify)
ENV HUGO_BASEURL=/
RUN npm run build

# Production stage - Serve with Nginx
FROM nginx:alpine

# Copy built site from builder
COPY --from=builder /app/public /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
