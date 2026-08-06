const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { qrHash } = req.body;

    if (!qrHash) {
      return res.status(400).json({ error: 'Missing QR hash' });
    }

    const result = await query(
      `SELECT tk.*, t.customer_name, t.pass_type
       FROM tickets tk
       JOIN transactions t ON tk.transaction_id = t.id
       WHERE tk.qr_hash = $1`,
      [qrHash]
    );

    if (result.rows.length === 0) {
      return res.json({ authorized: false, reason: 'INVALID' });
    }

    const ticket = result.rows[0];

    if (ticket.ticket_status === 'USED') {
      return res.json({ authorized: false, reason: 'ALREADY_USED', scannedAt: ticket.scanned_at });
    }

    if (ticket.ticket_status === 'REVOKED') {
      return res.json({ authorized: false, reason: 'REVOKED' });
    }

    await query(
      `UPDATE tickets
       SET status = 'USED', scanned_at = CURRENT_TIMESTAMP, scanned_by = 'bouncer'
       WHERE id = $1`,
      [ticket.id]
    );

    res.json({
      authorized: true,
      customerName: ticket.customer_name,
      passType: ticket.pass_type,
      tier: ticket.tier,
      priceFcfa: ticket.price_fcfa,
      packageDetails: ticket.package_details,
    });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({ error: 'Failed to verify ticket' });
  }
}
