import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Form parse failed', detail: err.message });
    }

    try {
      console.log('Fields:', fields);
      console.log('Files:', files);

      const file = files.file?.[0];
      if (!file) {
        console.error('Missing uploaded file');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileStream = fs.createReadStream(file.filepath);
      const formData = new FormData();

      formData.append('file', fileStream, file.originalFilename || 'upload.pdf');
      formData.append('sourceUrls', fields.sourceUrls?.[0] || '');

      const response = await fetch('https://ai-fact-checker-5ksf.onrender.com/webhook/fact-check-upload', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const resultText = await response.text();
      console.log('Render webhook response:', resultText);

      try {
        const result = JSON.parse(resultText);
        return res.status(200).json(result);
      } catch (jsonErr) {
        console.error('Failed to parse JSON:', jsonErr.message);
        return res.status(502).json({ error: 'Invalid response from backend', raw: resultText });
      }
    } catch (uploadErr) {
      console.error('Upload failed:', uploadErr);
      return res.status(500).json({ error: 'Upload failed', detail: uploadErr.message });
    }
  });
}
