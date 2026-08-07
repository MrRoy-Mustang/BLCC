import { query } from './db.js';

export default async function handler(req, res) {
  const { method, query: queryParams } = req;
  const { action } = queryParams;

  // Retrieve tickets
  if (method === 'POST' && action === 'retrieve') {
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

      return res.json({ tickets: result.rows });
    } catch (error) {
      console.error('Retrieve tickets error:', error);
      return res.status(500).json({ error: 'Failed to retrieve tickets' });
    }
  }

  // Verify ticket
  if (method === 'POST' && action === 'verify') {
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

      return res.json({
        authorized: true,
        customerName: ticket.customer_name,
        passType: ticket.pass_type,
        tier: ticket.tier,
        priceFcfa: ticket.price_fcfa,
        packageDetails: ticket.package_details,
      });
    } catch (error) {
      console.error('Verify ticket error:', error);
      return res.status(500).json({ error: 'Failed to verify ticket' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
