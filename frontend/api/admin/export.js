const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query(
      `SELECT t.reference, t.customer_name, t.customer_phone, t.pass_type, t.amount, t.status, t.created_at,
              tk.ticket_code, tk.status as ticket_status
       FROM transactions t
       LEFT JOIN tickets tk ON t.id = tk.transaction_id
       ORDER BY t.created_at DESC`
    );

    const csv = [
      'Reference,Customer Name,Customer Phone,Pass Type,Amount,Status,Ticket Code,Ticket Status,Created At',
      ...result.rows.map(row => 
        `"${row.reference}","${row.customer_name}","${row.customer_phone}","${row.pass_type}",${row.amount},"${row.status}","${row.ticket_code || ''}","${row.ticket_status || ''}","${row.created_at}"`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=blcc-transactions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
}
