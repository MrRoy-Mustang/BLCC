export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ref } = req.query;
  
  if (!ref || typeof ref !== 'string') {
    return res.status(400).send('Invalid reference');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  res.redirect(`${appUrl}/payment-status?ref=${ref}`);
}
