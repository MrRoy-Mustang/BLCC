const { query } = require('../db');
const crypto = require('crypto');

function generateReference() {
  return `BLCC-TX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    console.log('Creating transaction:', { reference, customerName, customerPhone, passType, amount });

    await query(
      `INSERT INTO transactions (reference, customer_name, customer_phone, pass_type, amount, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [reference, customerName, customerPhone, passType, amount]
    );

    console.log('Transaction created successfully');

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
    console.log('Notch Pay response:', notchpayData);

    if (!notchpayResponse.ok) {
      throw new Error(`Notch Pay error: ${notchpayData.message || 'Unknown error'}`);
    }

    res.json({
      reference,
      authorizationUrl: notchpayData.authorization_url || notchpayData.link,
    });
  } catch (error) {
    console.error('Payment initialization error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to initialize payment', details: error.message });
  }
}
