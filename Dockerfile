FROM n8nio/n8n:latest

USER root

# Install any additional dependencies if needed
RUN apk add --no-cache git

USER node

# Set work directory
WORKDIR /home/node

# Expose n8n port
EXPOSE 5678

# Start n8n
CMD ["n8n", "start"]
