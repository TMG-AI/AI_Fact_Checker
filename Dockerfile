# Use the Debian-based n8n image to get apt-get support
FROM n8nio/n8n:1.49.0-debian

# Switch to root to install tools
USER root

# Install shell tools
RUN apt-get update && \
    apt-get install -y curl jq grep sed && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Switch back to node user
USER node

# Set working directory for n8n
ENV N8N_USER_FOLDER=/home/node/.n8n

# Start n8n
CMD ["n8n"]
