# ✅ Start from the official n8n full image with shell access
FROM n8nio/n8n:1.49.0

# ✅ Switch to root to install shell tools (your agents need these)
USER root
RUN apt-get update && \
    apt-get install -y curl jq grep sed && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ✅ Go back to node user
USER node

# ✅ Set data folder (safe default)
ENV N8N_USER_FOLDER=/home/node/.n8n

# ✅ Start n8n (this fixes the “command not found” error)
CMD ["n8n"]
