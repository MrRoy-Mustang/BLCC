const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerPhone, ticketCode } = req.body;

    if (!customerPhone && !ticketCode) {
      return res.status(400).json({ error: 'Missing phone number or ticket code' });
    }

    let result;
    if (ticketCode) {
      result = await query(
        `SELECT t.*, tk.ticket_code, tk.qr_hash, tk.status as ticket_status, tk.tier, tk.price_fcfa, tk.package_details
         FROM transactions t
         JOIN tickets tk ON t.id = tk.transaction_id
         WHERE tk.ticket_code = $1 AND t.status = 'PAID'`,
        [ticketCode]
      );
    } else {
      result = await query(
        `SELECT t.*, tk.ticket_code, tk.qr_hash, tk.status as ticket_status, tk.tier, tk.price_fcfa, tk.package_details
         FROM transactions t
         JOIN tickets tk ON t.id = tk.transaction_id
         WHERE t.customer_phone = $1 AND t.status = 'PAID'
         ORDER BY t.created_at DESC`,
        [customerPhone]
      );
    }

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Retrieve tickets error:', error);
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
}
