const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, data } = req.body;
    const notchReference = data?.reference;

    if (!notchReference) {
      return res.status(400).json({ error: 'Missing reference' });
    }

    if (event === 'payment.complete') {
      const result = await query(
        `UPDATE transactions 
         SET status = 'PAID' 
         WHERE (notchpay_trxref = $1 OR reference = $2) AND status = 'PENDING'
         RETURNING id, reference, customer_name, pass_type, amount`,
        [notchReference, notchReference]
      );

      if (result.rows.length === 1) {
        const transaction = result.rows[0];
        
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

        console.log('Ticket issued:', { ticketCode, reference: transaction.reference });
      }
    } else if (event === 'payment.failed' || event === 'payment.canceled') {
      await query(
        `UPDATE transactions 
         SET status = 'FAILED' 
         WHERE (notchpay_trxref = $1 OR reference = $2) AND status = 'PENDING'`,
        [notchReference, notchReference]
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
