// /api/fact-check.js
import formidable from 'formidable';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Disable body parsing so we can handle multipart/form-data ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Immediate logging to confirm function starts
  console.log('🎯 FUNCTION STARTED - Method:', req.method);
  console.log('🎯 Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    console.log('✅ CORS headers set');

    if (req.method === 'OPTIONS') {
      console.log('✅ OPTIONS request handled');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log(`❌ Method not allowed: ${req.method}`);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('✅ Method validation passed');

    console.log('🚀 Starting file processing...');
    
    // Test if we can access /tmp directory
    try {
      const fs = require('fs');
      if (!fs.existsSync('/tmp')) {
        console.log('❌ /tmp directory does not exist');
      } else {
        console.log('✅ /tmp directory exists');
      }
    } catch (tmpError) {
      console.log('❌ Error checking /tmp:', tmpError.message);
    }
    
    // Configure formidable to use /tmp directory (required for Vercel)
    console.log('📝 Configuring formidable...');
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    console.log('✅ Formidable configured');

    console.log('📝 Starting form parsing...');
    
    // Parse the incoming form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Form parsing error:', err);
          reject(err);
        } else {
          console.log('✅ Form parsed successfully');
          console.log('📋 Fields:', Object.keys(fields));
          console.log('📁 Files:', Object.keys(files));
          resolve([fields, files]);
        }
      });
    });

    // Get the uploaded file
    const uploadedFile = files.file || files.pdf || Object.values(files)[0];
    
    if (!uploadedFile) {
      console.log('❌ No file found in upload');
      console.log('Available files:', Object.keys(files));
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📄 File details:', {
      originalName: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
      path: uploadedFile.filepath
    });

    // Check if file exists and is readable
    if (!fs.existsSync(uploadedFile.filepath)) {
      console.error('❌ File does not exist at:', uploadedFile.filepath);
      return res.status(500).json({ error: 'File processing failed' });
    }

    // Create form data to send to Render
    const formData = new FormData();
    const fileStream = fs.createReadStream(uploadedFile.filepath);
    
    formData.append('file', fileStream, {
      filename: uploadedFile.originalFilename || 'document.pdf',
      contentType: uploadedFile.mimetype || 'application/pdf'
    });

    console.log('🌐 Sending to Render webhook...');
    
    // Send to your Render webhook
    const renderResponse = await fetch('https://factcheck-dev-1.onrender.com/webhook/factcheck', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('📊 Render response status:', renderResponse.status);
    console.log('📊 Render response headers:', Object.fromEntries(renderResponse.headers.entries()));

    if (!renderResponse.ok) {
      const errorText = await renderResponse.text();
      console.error('❌ Render webhook error:', {
        status: renderResponse.status,
        statusText: renderResponse.statusText,
        body: errorText
      });
      return res.status(500).json({ 
        error: 'Webhook failed', 
        details: errorText,
        status: renderResponse.status 
      });
    }

    // Get the response data
    const responseText = await renderResponse.text();
    console.log('📥 Raw response from Render:', responseText.substring(0, 500) + '...');

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.log('Raw response that failed to parse:', responseText);
      return res.status(500).json({ 
        error: 'Invalid JSON response from webhook',
        rawResponse: responseText.substring(0, 1000) // First 1000 chars for debugging
      });
    }

    // Clean up the temporary file
    try {
      fs.unlinkSync(uploadedFile.filepath);
      console.log('🗑️ Temporary file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up temp file:', cleanupError.message);
    }

    console.log('✅ Success! Returning data to frontend');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 CAUGHT ERROR AT TOP LEVEL');
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Try to send a response
    try {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    } catch (responseError) {
      console.error('💥 Could not even send error response:', responseError);
      return res.status(500).end('Critical error');
    }
  }
}
