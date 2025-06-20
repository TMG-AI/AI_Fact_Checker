# Use n8n with Debian and root access
FROM n8nio/n8n:1.68.1-root

USER root

# Install required shell tools
RUN apt-get update && \
    apt-get install -y curl jq grep sed && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Back to n8n user
USER node

# Start n8n normally
CMD ["n8n"]
