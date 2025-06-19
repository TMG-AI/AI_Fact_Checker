# AI Fact Checker & Source Verification

A public-facing fact-checking workflow that allows users to upload PDF documents and optional source URLs for comprehensive AI-powered verification.

## 🌐 Live Demo

Visit the live application: [AI Fact Checker](https://TMG-AI.github.io/AI_Fact_Checker)

## 🔧 System Overview

- **Frontend**: Responsive HTML/CSS/JavaScript deployed via GitHub Pages
- **Backend**: n8n workflow deployed on Railway
- **Processing**: PDF text extraction with AI-powered claim verification
- **Integration**: Webhook-based submission system

## ✨ Features

- **Source-First Verification**: Checks provided sources first, then supplements with web research
- **Citation Analysis**: Verifies that citations actually support the claims made
- **Multi-AI Validation**: Cross-verification with conflict resolution for accuracy
- **Detailed Reporting**: Professional reports with source quality assessment

## 🚀 How It Works

1. **Upload & Parse**: Users upload PDF documents and optional source URLs
2. **Source Verification**: AI verifies claims against provided sources
3. **Comprehensive Research**: Additional verification using authoritative sources
4. **Detailed Report**: Users receive comprehensive analysis results

## 📁 Project Structure

```
AI_Fact_Checker/
├── index.html          # Main web interface
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── .n8n/              # n8n workflows (local only)
    └── workflows/
        └── AI_Fact_Check___Live.json
```

## 🛠️ Local Development

The n8n workflow runs locally using Docker with pdf-parse support:

```bash
# Local n8n setup (not tracked in git)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

## 🔗 Webhook Integration

The frontend connects to the n8n workflow via webhook:
- **Test URL**: `https://aifactchecker-production.up.railway.app:5678/webhook-test/02187aa1-b852-469f-bf19-5eed43e92011`
- **Production URL**: `https://aifactchecker-production.up.railway.app/webhook/02187aa1-b852-469f-bf19-5eed43e92011`

## 📝 Notes

- The `.n8n/` folder contains workflow definitions but is excluded from git
- PDF processing requires pdf-parse module in the n8n environment
- GitHub Pages automatically deploys from the main branch

---

© 2025 The Messina Group. All rights reserved.
