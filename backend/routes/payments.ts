import { Router } from 'express';
import { query } from '../utils/db';
import { initializePayment } from '../utils/notchpay';
import crypto from 'crypto';

const router = Router();

// Generate transaction reference
function generateReference(): string {
  return `BLCC-TX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

// Generate ticket code
function generateTicketCode(): string {
  const digits = Array.from(crypto.randomBytes(3), (b) => (b % 10).toString()).join('');
  return `TKT-BLCC-${digits}`;
}

// Generate QR hash
function generateQrHash(ticketCode: string): string {
  const secret = process.env.QR_SECRET || 'your-qr-secret-change-in-production';
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${ticketCode}.${nonce}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

// Pricing
const PRICES = {
  STANDARD: 3000,
  REGULAR_VIP: 8000,
  CARRE_BRONZE: 50000,
  CARRE_OR: 150000,
  CARRE_DIAMANT: 250000,
};

// Initialize payment
router.post('/initialize', async (req, res) => {
  try {
    const { customerName, customerPhone, passType } = req.body;

    if (!customerName || !customerPhone || !passType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validPassTypes = ['STANDARD', 'REGULAR_VIP', 'CARRE_BRONZE', 'CARRE_OR', 'CARRE_DIAMANT'];
    if (!validPassTypes.includes(passType)) {
      return res.status(400).json({ error: 'Invalid pass type' });
    }

    const amount = PRICES[passType as keyof typeof PRICES];
    const reference = generateReference();
    const customerEmail = `${customerPhone.replace(/[^0-9]/g, '')}@blcc.local`;

    // Create transaction record
    await query(
      `INSERT INTO transactions (reference, customer_name, customer_phone, pass_type, amount, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [reference, customerName, customerPhone, passType, amount]
    );

    // Initialize Notch Pay payment
    const notchResponse = await initializePayment({
      amount,
      currency: 'XAF',
      reference,
      customerName,
      customerPhone,
      customerEmail,
      description: `BLCC Ticket - ${passType}`,
    });

    if (!notchResponse.authorization_url) {
      await query(`UPDATE transactions SET status = 'FAILED' WHERE reference = $1`, [reference]);
      return res.status(500).json({ error: 'Failed to initialize payment' });
    }

    // Update transaction with Notch Pay reference
    if (notchResponse.transaction?.reference) {
      await query(
        `UPDATE transactions SET notchpay_trxref = $1 WHERE reference = $2`,
        [notchResponse.transaction.reference, reference]
      );
    }

    res.json({
      reference,
      authorizationUrl: notchResponse.authorization_url,
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Callback from Notch Pay
router.get('/callback', async (req, res) => {
  const { ref } = req.query;
  
  if (!ref || typeof ref !== 'string') {
    return res.status(400).send('Invalid reference');
  }

  // Redirect to frontend with reference
  res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/payment-status?ref=${ref}`);
});

// Webhook from Notch Pay
router.post('/webhook', async (req, res) => {
  try {
    const { verifyWebhookSignature } = await import('../utils/notchpay');
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-notch-signature'] as string;

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;
    const notchReference = data?.reference;

    if (!notchReference) {
      return res.status(400).json({ error: 'Missing reference' });
    }

    if (event === 'payment.complete') {
      // Update transaction status
      const result = await query(
        `UPDATE transactions 
         SET status = 'PAID' 
         WHERE (notchpay_trxref = $1 OR reference = $1) AND status = 'PENDING'
         RETURNING id, reference, customer_name, pass_type, amount`,
        [notchReference]
      );

      if (result.rows.length === 1) {
        const transaction = result.rows[0];
        
        // Generate ticket
        const ticketCode = generateTicketCode();
        const qrHash = generateQrHash(ticketCode);
        
        const packageDetailsMap: Record<string, string> = {
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
         WHERE (notchpay_trxref = $1 OR reference = $1) AND status = 'PENDING'`,
        [notchReference]
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Check transaction status
router.get('/status/:ref', async (req, res) => {
  try {
    const { ref } = req.params;
    
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
});

export default router;
