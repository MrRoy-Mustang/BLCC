const { query } = require('./db');
const crypto = require('crypto');

function generateReference() {
  return `BLCC-TX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

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
  const { method, query: queryParams } = req;
  const path = req.url?.split('?')[0] || '';

  // Health check
  if (path === '/api/health' && method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Initialize payment
  if (path === '/api/payments/initialize' && method === 'POST') {
    try {
      const { customerName, customerPhone, passType } = req.body;

      if (!customerName || !customerPhone || !passType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const validPassTypes = ['STANDARD', 'REGULAR_VIP', 'CARRE_BRONZE', 'CARRE_OR', 'CARRE_DIAMANT'];
      if (!validPassTypes.includes(passType)) {
        return res.status(400).json({ error: 'Invalid pass type' });
      }

      const PRICES = {
        STANDARD: 3000,
        REGULAR_VIP: 8000,
        CARRE_BRONZE: 50000,
        CARRE_OR: 150000,
        CARRE_DIAMANT: 250000,
      };

      const amount = PRICES[passType];
      const reference = generateReference();
      const customerEmail = `${customerPhone.replace(/[^0-9]/g, '')}@blcc.local`;

      await query(
        `INSERT INTO transactions (reference, customer_name, customer_phone, pass_type, amount, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
        [reference, customerName, customerPhone, passType, amount]
      );

      const notchpayResponse = await fetch(`${process.env.NOTCHPAY_API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': process.env.NOTCHPAY_PRIVATE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          reference: reference,
          currency: 'XAF',
        }),
      });

      const notchpayData = await notchpayResponse.json();

      if (!notchpayResponse.ok) {
        throw new Error(`Notch Pay error: ${notchpayData.message || 'Unknown error'}`);
      }

      return res.json({
        reference,
        authorizationUrl: notchpayData.authorization_url || notchpayData.link,
      });
    } catch (error) {
      console.error('Payment initialization error:', error.message);
      return res.status(500).json({ error: 'Failed to initialize payment', details: error.message });
    }
  }

  // Payment callback
  if (path === '/api/payments/callback' && method === 'GET') {
    const { ref } = queryParams;
    
    if (!ref || typeof ref !== 'string') {
      return res.status(400).send('Invalid reference');
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    return res.redirect(`${appUrl}/payment-status?ref=${ref}`);
  }

  // Simulate payment completion
  if (path === '/api/payments/simulate-complete' && method === 'POST') {
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

      return res.json({
        success: true,
        ticketCode,
        reference: transaction.reference,
      });
    } catch (error) {
      console.error('Simulate payment error:', error);
      return res.status(500).json({ error: 'Failed to simulate payment' });
    }
  }

  // Payment status check
  if (path.startsWith('/api/payments/status/') && method === 'GET') {
    try {
      const ref = path.split('/').pop();

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

      return res.json({
        status: result.rows[0].status,
        ticketCode: result.rows[0].ticket_code,
      });
    } catch (error) {
      console.error('Status check error:', error);
      return res.status(500).json({ error: 'Failed to check status' });
    }
  }

  // Webhook
  if (path === '/api/payments/webhook' && method === 'POST') {
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

      return res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
