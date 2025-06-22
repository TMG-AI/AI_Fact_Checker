export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const formData = new FormData();
    const file = req.body.file;
    const sourceUrls = req.body.sourceUrls;

    formData.append('file', file);
    if (sourceUrls) formData.append('sourceUrls', sourceUrls);

    const response = await fetch('https://ai-fact-checker-5ksf.onrender.com/webhook/fact-check-upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
