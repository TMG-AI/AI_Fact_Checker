# Dockerfile for Render - n8n with shell tools
FROM n8nio/n8n:latest

# Install shell tools needed for your agents (e.g., curl, grep, jq, etc.)
USER root
RUN apt-get update && \
    apt-get install -y curl jq grep sed && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER node

# Ensure workflows and credentials persist
ENV N8N_USER_FOLDER=/home/node/.n8n

# Default CMD
CMD ["n8n"]
