const { query } = require('../db');
const crypto = require('crypto');

function generateTicketCode() {
  const digits = Array.from(crypto.randomBytes(3), (b) => (b % 10).toString()).join('');
  return `TKT-BLCC-${digits}`;
}

function generateQrHash(ticketCode) {
  const secret = process.env.QR_SECRET || 'your-qr-secret-change-in-production';
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${ticketCode}.${nonce}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Missing reference' });
    }

    const result = await query(
      `UPDATE transactions
       SET status = 'PAID'
       WHERE reference = $1 AND status = 'PENDING'
       RETURNING id, reference, customer_name, pass_type, amount`,
      [reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or already processed' });
    }

    const transaction = result.rows[0];

    const ticketCode = generateTicketCode();
    const qrHash = generateQrHash(ticketCode);

    const packageDetailsMap = {
      STANDARD: 'Standard Entry',
      REGULAR_VIP: 'VIP Bracelet — 3-Day Pass',
      CARRE_BRONZE: 'PACK YANNICK NOAH BRONZE',
      CARRE_OR: 'PACK YANNICK NOAH OR',
      CARRE_DIAMANT: 'PACK YANNICK NOAH DIAMANT',
    };
    const packageDetails = packageDetailsMap[transaction.pass_type] || 'Standard Entry';

    await query(
      `INSERT INTO tickets (ticket_code, transaction_id, qr_hash, status, tier, price_fcfa, package_details)
       VALUES ($1, $2, $3, 'ISSUED', $4, $5, $6)`,
      [ticketCode, transaction.id, qrHash, transaction.pass_type, transaction.amount, packageDetails]
    );

    console.log('Ticket issued (simulated):', { ticketCode, reference: transaction.reference });

    res.json({
      success: true,
      ticketCode,
      reference: transaction.reference,
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({ error: 'Failed to simulate payment' });
  }
}
