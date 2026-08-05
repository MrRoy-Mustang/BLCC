const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const crypto = require('crypto');

dotenv.config();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Helper function for database queries
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return { rows: result.rows };
  } catch (error) {
    throw error;
  }
}

// Generate transaction reference
function generateReference() {
  return `BLCC-TX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

// Generate ticket code
function generateTicketCode() {
  const digits = Array.from(crypto.randomBytes(3), (b) => (b % 10).toString()).join('');
  return `TKT-BLCC-${digits}`;
}

// Generate QR hash
function generateQrHash(ticketCode) {
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize payment
app.post('/api/payments/initialize', async (req, res) => {
  try {
    console.log('Payment initialization request:', req.body);
    const { customerName, customerPhone, passType } = req.body;

    if (!customerName || !customerPhone || !passType) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validPassTypes = ['STANDARD', 'REGULAR_VIP', 'CARRE_BRONZE', 'CARRE_OR', 'CARRE_DIAMANT'];
    if (!validPassTypes.includes(passType)) {
      console.log('Invalid pass type:', passType);
      return res.status(400).json({ error: 'Invalid pass type' });
    }

    const amount = PRICES[passType];
    const reference = generateReference();
    const customerEmail = `${customerPhone.replace(/[^0-9]/g, '')}@blcc.local`;

    console.log('Creating transaction:', { reference, customerName, customerPhone, passType, amount });

    // Create transaction record
    await query(
      `INSERT INTO transactions (reference, customer_name, customer_phone, pass_type, amount, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [reference, customerName, customerPhone, passType, amount]
    );

    console.log('Transaction created successfully');

    // For testing, redirect to frontend payment simulation page
    // In production, this would call Notch Pay API and return real authorization URL
    res.json({
      reference,
      authorizationUrl: `${process.env.APP_URL || 'http://localhost:5173'}/payment-status?ref=${reference}`,
    });
  } catch (error) {
    console.error('Payment initialization error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to initialize payment', details: error.message });
  }
});

// Callback from Notch Pay
app.get('/api/payments/callback', (req, res) => {
  const { ref } = req.query;
  
  if (!ref || typeof ref !== 'string') {
    return res.status(400).send('Invalid reference');
  }

  // Redirect to frontend with reference
  res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/payment-status?ref=${ref}`);
});

// Simulate payment completion (for testing only)
app.post('/api/payments/simulate-complete', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Missing reference' });
    }

    // Update transaction status
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

    // Generate ticket
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
});

// Webhook from Notch Pay
app.post('/api/payments/webhook', async (req, res) => {
  try {
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
         WHERE (notchpay_trxref = $1 OR reference = $2) AND status = 'PENDING'
         RETURNING id, reference, customer_name, pass_type, amount`,
        [notchReference, notchReference]
      );

      if (result.rows.length === 1) {
        const transaction = result.rows[0];
        
        // Generate ticket
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
});

// Check transaction status
app.get('/api/payments/status/:ref', async (req, res) => {
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

// Retrieve tickets by phone
app.post('/api/tickets/retrieve', async (req, res) => {
  try {
    const { customerPhone, ticketCode } = req.body;

    if (!customerPhone && !ticketCode) {
      return res.status(400).json({ error: 'Missing phone number or ticket code' });
    }

    let result;
    if (ticketCode) {
      // Retrieve by ticket code
      result = await query(
        `SELECT t.*, tk.ticket_code, tk.qr_hash, tk.status as ticket_status, tk.tier, tk.price_fcfa, tk.package_details
         FROM transactions t
         JOIN tickets tk ON t.id = tk.transaction_id
         WHERE tk.ticket_code = $1 AND t.status = 'PAID'`,
        [ticketCode]
      );
    } else {
      // Retrieve by phone number
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
});

// Verify ticket QR (for bouncer)
app.post('/api/tickets/verify', async (req, res) => {
  try {
    const { qrHash } = req.body;

    if (!qrHash) {
      return res.status(400).json({ error: 'Missing QR hash' });
    }

    // Find ticket by QR hash
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

    // Mark ticket as used
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
