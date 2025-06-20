# Start from Alpine-based n8n image with shell support
FROM n8nio/n8n:1.24.1

# Switch to root to install shell tools needed by your agents
USER root

# Use Alpine’s package manager to install CLI tools
RUN apk add --no-cache curl jq grep sed

# Return to n8n user
USER node

# Set port dynamically for Render (Render sets $PORT env var)
ENV N8N_PORT=$PORT
ENV WEBHOOK_URL=https://ai-fact-checker-5ksf.onrender.com/
ENV N8N_HOST=0.0.0.0
ENV N8N_PROTOCOL=http

# Start n8n on correct port
CMD ["n8n", "start"]
