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
  console.log('🚀 API called - Method:', req.method);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Configure formidable to use /tmp directory (required for Vercel)
    console.log('📝 Configuring formidable...');
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    console.log('📋 Parsing form...');
    // Parse the incoming form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Form parse error:', err);
          reject(err);
        } else {
          console.log('✅ Form parsed - Fields:', Object.keys(fields), 'Files:', Object.keys(files));
          resolve([fields, files]);
        }
      });
    });

    // Get the uploaded file
    const uploadedFile = files.file || files.pdf || Object.values(files)[0];
    
    if (!uploadedFile) {
      console.log('❌ No file found - Available files:', Object.keys(files));
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📄 File found:', {
      name: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
      path: uploadedFile.filepath
    });

    // Create form data to send to Render
    console.log('📦 Creating FormData for webhook...');
    const formData = new FormData();
    const fileStream = fs.createReadStream(uploadedFile.filepath);
    
    formData.append('file', fileStream, {
      filename: uploadedFile.originalFilename || 'document.pdf',
      contentType: uploadedFile.mimetype || 'application/pdf'
    });

    console.log('🌐 Sending to webhook...');
    // Send to your Render webhook (corrected URL)
    const renderResponse = await fetch('https://ai-fact-checker-5ksf.onrender.com/webhook/fact-check-upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('📊 Webhook response:', renderResponse.status, renderResponse.statusText);

    if (!renderResponse.ok) {
      const errorText = await renderResponse.text();
      console.error('❌ Webhook failed:', renderResponse.status, errorText);
      return res.status(500).json({ 
        error: 'Webhook failed', 
        details: errorText,
        status: renderResponse.status 
      });
    }

    // Get the response data
    const responseText = await renderResponse.text();
    console.log('📥 Webhook response text length:', responseText.length);
    
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError.message);
      console.log('Raw response preview:', responseText.substring(0, 500));
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
    console.error('💥 Caught error:', error.message);
    console.error('💥 Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
