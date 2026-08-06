const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    
    let sql = `
      SELECT t.id, t.reference, t.customer_name, t.customer_phone, t.pass_type, t.amount, t.status,
             tk.status as ticket_status, tk.ticket_code
      FROM transactions t
      LEFT JOIN tickets tk ON t.id = tk.transaction_id
    `;
    
    let params = [];
    
    if (q) {
      sql += ` WHERE t.customer_name ILIKE $1 OR t.customer_phone ILIKE $1 OR t.reference ILIKE $1`;
      params.push(`%${q}%`);
    }
    
    sql += ` ORDER BY t.created_at DESC LIMIT 100`;
    
    const result = await query(sql, params);
    
    const transactions = result.rows.map(row => ({
      id: row.id,
      reference: row.reference,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      passType: row.pass_type,
      amount: row.amount,
      status: row.status,
      ticket: row.ticket_code ? {
        status: row.ticket_status,
        ticketCode: row.ticket_code
      } : null
    }));
    
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}
