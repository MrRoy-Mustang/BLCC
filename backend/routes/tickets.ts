import { Router } from 'express';
import { query } from '../utils/db';
import { AuthRequest, authenticate, requireBouncer } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Verify QR signature
function verifyQrSignature(qrHash: string): boolean {
  const secret = process.env.QR_SECRET || 'your-qr-secret-change-in-production';
  const parts = qrHash.split('.');
  
  if (parts.length !== 3) return false;
  
  const [ticketCode, nonce, signature] = parts;
  const expected = crypto.createHmac('sha256', secret)
    .update(`${ticketCode}.${nonce}`)
    .digest('hex');
  
  return signature === expected;
}

// Retrieve tickets by phone number
router.post('/retrieve', async (req, res) => {
  try {
    const { customerPhone } = req.body;

    if (!customerPhone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const result = await query(
      `SELECT t.reference, t.customer_name, t.pass_type, t.created_at, tk.ticket_code
       FROM transactions t
       LEFT JOIN tickets tk ON t.id = tk.transaction_id
       WHERE t.customer_phone = $1 AND t.status = 'PAID'
       ORDER BY t.created_at DESC`,
      [customerPhone.trim()]
    );

    const tickets = result.rows
      .filter((row: any) => row.ticket_code)
      .map((row: any) => ({
        ticketCode: row.ticket_code,
        customerName: row.customer_name,
        passType: row.pass_type,
        createdAt: row.created_at,
      }));

    res.json({ tickets, count: tickets.length });
  } catch (error) {
    console.error('Ticket retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

// Verify ticket (bouncer only)
router.post('/verify', authenticate, requireBouncer, async (req: AuthRequest, res) => {
  try {
    const { qrHash } = req.body;

    if (!qrHash) {
      return res.status(400).json({ outcome: 'INVALID' });
    }

    if (!verifyQrSignature(qrHash)) {
      return res.json({ outcome: 'INVALID' });
    }

    // Atomic update to prevent double scanning
    const result = await query(
      `UPDATE tickets 
       SET status = 'USED', scanned_at = NOW(), scanned_by = $1
       WHERE qr_hash = $2 AND status = 'ISSUED'
       RETURNING ticket_code, tier, price_fcfa, package_details,
         (SELECT customer_name FROM transactions WHERE id = tickets.transaction_id) as customer_name`,
      [req.user?.id, qrHash]
    );

    if (result.rows.length === 1) {
      const ticket = result.rows[0];
      return res.json({
        outcome: 'AUTHORIZED',
        customerName: ticket.customer_name,
        passType: ticket.tier,
        tier: ticket.tier,
        priceFcfa: ticket.price_fcfa,
        packageDetails: ticket.package_details,
      });
    }

    // Check if already used
    const existing = await query(
      `SELECT status, scanned_at FROM tickets WHERE qr_hash = $1`,
      [qrHash]
    );

    if (existing.rows.length === 0) {
      return res.json({ outcome: 'INVALID' });
    }

    if (existing.rows[0].status === 'USED') {
      return res.json({
        outcome: 'ALREADY_USED',
        scannedAt: existing.rows[0].scanned_at,
      });
    }

    return res.json({ outcome: 'INVALID' });
  } catch (error) {
    console.error('Ticket verification error:', error);
    res.status(500).json({ outcome: 'INVALID' });
  }
});

export default router;
