// /api/fact-check.js - The working version before we added too much debugging

import formidable from 'formidable';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

// Disable body parsing so we can handle multipart/form-data ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Configure formidable to use /tmp directory (required for Vercel)
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    // Parse the incoming form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    // Get the uploaded file
    const uploadedFile = files.file || files.pdf || Object.values(files)[0];
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create form data to send to Render
    const formData = new FormData();
    const fileStream = fs.createReadStream(uploadedFile.filepath);
    
    formData.append('file', fileStream, {
      filename: uploadedFile.originalFilename || 'document.pdf',
      contentType: uploadedFile.mimetype || 'application/pdf'
    });

    // Send to your Render webhook (corrected URL)
    const renderResponse = await fetch('https://ai-fact-checker-5ksf.onrender.com/webhook/fact-check-upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!renderResponse.ok) {
      const errorText = await renderResponse.text();
      return res.status(500).json({ 
        error: 'Webhook failed', 
        details: errorText,
        status: renderResponse.status 
      });
    }

    // Get the response data
    const responseText = await renderResponse.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(500).json({ 
        error: 'Invalid JSON response from webhook',
        rawResponse: responseText.substring(0, 1000)
      });
    }

    // Clean up the temporary file
    try {
      fs.unlinkSync(uploadedFile.filepath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return res.status(200).json(responseData);

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
