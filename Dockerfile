FROM n8nio/n8n:latest

USER root
RUN apt-get update && \
    apt-get install -y curl jq grep sed && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER node

ENV N8N_PORT=${PORT}
ENV N8N_HOST=0.0.0.0
ENV N8N_PROTOCOL=http

CMD ["n8n"]
