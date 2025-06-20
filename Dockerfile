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

# Set environment
ENV N8N_USER_FOLDER=/home/node/.n8n \
    N8N_PORT=5678 \
    N8N_PROTOCOL=http \
    NODE_ENV=production

# Expose n8n port
EXPOSE 5678

# Start n8n
CMD ["n8n"]
