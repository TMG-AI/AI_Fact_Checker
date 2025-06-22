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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parse failed', detail: err.message });
    }

    try {
      const file = files.file;
      const sourceUrls = fields.sourceUrls || '';

      if (!file || !file[0]?.filepath) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileStream = fs.createReadStream(file[0].filepath);

      const formData = new FormData();
      formData.append('file', fileStream, file[0].originalFilename || 'upload.pdf');
      if (sourceUrls) formData.append('sourceUrls', sourceUrls);

      const response = await fetch('https://ai-fact-checker-5ksf.onrender.com/webhook/fact-check-upload', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const result = await response.json();
      return res.status(200).json(result);
    } catch (uploadErr) {
      return res.status(500).json({ error: 'Upload failed', detail: uploadErr.message });
    }
  });
}
