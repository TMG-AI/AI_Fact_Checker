// /api/fact-check.js - Alternative approach using buffers instead of formidable

import FormData from 'form-data';
import fetch from 'node-fetch';

// Enable body parsing as raw
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  console.log('🚀 API called - Method:', req.method);
  console.log('🚀 Content-Type:', req.headers['content-type']);
  
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
    console.log('📋 Processing multipart data...');
    
    // Parse multipart data manually
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Must be multipart/form-data' });
    }

    // Get boundary from content-type
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found in content-type' });
    }

    console.log('📋 Boundary found:', boundary);

    // Read the raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    
    console.log('📋 Body size:', body.length);

    // Parse multipart data
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = [];
    let start = 0;
    
    while (true) {
      const boundaryIndex = body.indexOf(boundaryBuffer, start);
      if (boundaryIndex === -1) break;
      
      if (start > 0) {
        parts.push(body.slice(start, boundaryIndex));
      }
      start = boundaryIndex + boundaryBuffer.length;
    }

    console.log('📋 Found parts:', parts.length);

    // Find the file part
    let fileBuffer = null;
    let filename = 'document.pdf';
    
    for (const part of parts) {
      const partStr = part.toString('utf8', 0, Math.min(500, part.length));
      
      if (partStr.includes('Content-Disposition') && partStr.includes('filename')) {
        console.log('📄 Found file part');
        
        // Extract filename
        const filenameMatch = partStr.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
        
        // Find where headers end (double CRLF)
        const headerEndIndex = part.indexOf('\r\n\r\n');
        if (headerEndIndex !== -1) {
          // Extract file data (excluding trailing CRLF)
          fileBuffer = part.slice(headerEndIndex + 4, part.length - 2);
          console.log('📄 File extracted:', {
            filename,
            size: fileBuffer.length
          });
          break;
        }
      }
    }

    if (!fileBuffer) {
      console.log('❌ No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📦 Creating FormData for webhook...');
    
    // Create form data to send to webhook
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: filename,
      contentType: 'application/pdf'
    });

    console.log('🌐 Sending to webhook...');
    
    // Send to your Render webhook
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

    console.log('✅ Success! Returning data to frontend');
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
