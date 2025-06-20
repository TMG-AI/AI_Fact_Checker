FROM n8nio/n8n:1.49.0

USER root

# Use Alpine's package manager instead of apt-get
RUN apk update && \
    apk add --no-cache curl jq grep sed

USER node
ENV N8N_USER_FOLDER=/home/node/.n8n

CMD ["n8n"]
