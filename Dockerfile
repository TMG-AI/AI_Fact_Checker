# Use Debian base for shell tools support
FROM node:18-slim

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl jq grep sed gnupg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install n8n globally
RUN npm install --global n8n

# Create custom startup script with server timeout configuration
RUN echo '#!/bin/bash\n\
# Configure Node.js server timeouts before starting n8n\n\
export NODE_OPTIONS="--max-old-space-size=4096 --require /app/timeout-config.js"\n\
exec n8n "$@"' > /app/start-n8n.sh && \
chmod +x /app/start-n8n.sh

# Create timeout configuration module
RUN echo 'const http = require("http");\n\
const https = require("https");\n\
\n\
// Override HTTP server creation to set timeouts\n\
const originalCreateServer = http.createServer;\n\
http.createServer = function(...args) {\n\
  const server = originalCreateServer.apply(this, args);\n\
  server.keepAliveTimeout = 300000; // 5 minutes\n\
  server.headersTimeout = 310000;   // Slightly longer than keepAliveTimeout\n\
  server.requestTimeout = 600000;   // 10 minutes\n\
  server.timeout = 600000;          // 10 minutes for socket inactivity\n\
  console.log("✅ HTTP server timeouts configured for long connections");\n\
  return server;\n\
};\n\
\n\
// Also override HTTPS server creation\n\
const originalCreateSecureServer = https.createServer;\n\
https.createServer = function(...args) {\n\
  const server = originalCreateSecureServer.apply(this, args);\n\
  server.keepAliveTimeout = 300000;\n\
  server.headersTimeout = 310000;\n\
  server.requestTimeout = 600000;\n\
  server.timeout = 600000;\n\
  console.log("✅ HTTPS server timeouts configured for long connections");\n\
  return server;\n\
};' > /app/timeout-config.js

# Set environment
ENV N8N_USER_FOLDER=/home/node/.n8n \
    N8N_PORT=5678 \
    N8N_PROTOCOL=http \
    NODE_ENV=production \
    EXECUTIONS_TIMEOUT=600 \
    EXECUTIONS_TIMEOUT_MAX=600 \
    EXECUTIONS_MODE=queue

# Expose n8n port
EXPOSE 5678

# Start n8n with custom configuration
CMD ["/app/start-n8n.sh"]
