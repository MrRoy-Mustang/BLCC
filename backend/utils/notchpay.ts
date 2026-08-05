// Simplified Notch Pay integration
const NOTCHPAY_API_URL = process.env.NOTCHPAY_API_URL || 'https://api.notchpay.co';
const NOTCHPAY_SECRET_KEY = process.env.NOTCHPAY_SECRET_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

if (!NOTCHPAY_SECRET_KEY) {
  throw new Error('NOTCHPAY_SECRET_KEY is required');
}

export interface NotchPayPaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  description: string;
}

export interface NotchPayPaymentResponse {
  status: string;
  message?: string;
  authorization_url?: string;
  transaction?: {
    id?: string;
    reference?: string;
    amount?: number;
    status?: string;
  };
}

export async function initializePayment(data: NotchPayPaymentRequest): Promise<NotchPayPaymentResponse> {
  console.log('Initializing Notch Pay payment:', {
    amount: data.amount,
    currency: data.currency,
    reference: data.reference,
  });

  try {
    const response = await fetch(`${NOTCHPAY_API_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': NOTCHPAY_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        reference: data.reference,
        email: data.customerEmail,
        customer: {
          name: data.customerName,
          phone: data.customerPhone,
        },
        description: data.description,
        callback: `${APP_URL}/api/payments/callback?ref=${data.reference}`,
      }),
    });

    const result = await response.json() as NotchPayPaymentResponse;
    
    console.log('Notch Pay response:', {
      status: response.status,
      resultStatus: result.status,
      hasAuthUrl: !!result.authorization_url,
    });

    if (!response.ok) {
      throw new Error(result.message || `Notch Pay error: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Notch Pay initialization error:', error);
    throw error;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const NOTCHPAY_HASH = process.env.NOTCHPAY_HASH;
  
  if (!NOTCHPAY_HASH) {
    console.error('NOTCHPAY_HASH is not configured');
    return false;
  }

  if (!signature) {
    console.error('Missing webhook signature');
    return false;
  }

  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', NOTCHPAY_HASH)
    .update(rawBody)
    .digest('hex');

  const isValid = signature.toLowerCase() === expected.toLowerCase();
  
  if (!isValid) {
    console.error('Webhook signature verification failed');
  }

  return isValid;
}
