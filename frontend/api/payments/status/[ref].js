const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ref } = req.query;

    const result = await query(
      `SELECT t.status, tk.ticket_code
       FROM transactions t
       LEFT JOIN tickets tk ON t.id = tk.transaction_id
       WHERE t.reference = $1`,
      [ref]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      status: result.rows[0].status,
      ticketCode: result.rows[0].ticket_code,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
}
