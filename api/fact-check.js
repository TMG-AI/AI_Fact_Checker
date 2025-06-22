import formidable from 'formidable';
import { Readable } from 'stream';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parsing error', detail: err.message });
    }

    try {
      const file = files.file?.[0];
      const sourceUrls = fields.sourceUrls?.[0] || '';

      if (!file || !file.filepath) {
        return res.status(400).json({ error: 'No valid file found in upload' });
      }

      const fs = await import('fs');
      const fileStream = fs.createReadStream(file.filepath);

      const formData = new FormData();
      formData.append('file', fileStream, { filename: file.originalFilename, contentType: file.mimetype });
      formData.append('sourceUrls', sourceUrls);

      const response = await fetch('https://ai-fact-checker-5ksf.onrender.com/webhook/fact-check-upload', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      const result = await response.json();
      return res.status(200).json(result);
    } catch (uploadErr) {
      return res.status(500).json({ error: 'Upload failed', detail: uploadErr.message });
    }
  });
}
