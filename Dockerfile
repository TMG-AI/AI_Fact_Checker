FROM n8nio/n8n:latest

# Set environment variables for permissions
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

# Expose port
EXPOSE 5678

# Use the default n8n startup
CMD ["n8n"]
