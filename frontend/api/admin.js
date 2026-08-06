const { query } = require('./db');

export default async function handler(req, res) {
  const { method, query: queryParams } = req;
  const path = req.url?.split('?')[0] || '';

  // Stats
  if (path === '/api/admin/stats' && method === 'GET') {
    try {
      const revenueResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'PAID'`
      );

      const standardResult = await query(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
         FROM transactions 
         WHERE status = 'PAID' AND pass_type IN ('STANDARD', 'REGULAR_VIP')`
      );

      const vipResult = await query(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
         FROM transactions 
         WHERE status = 'PAID' AND pass_type LIKE 'CARRE_%'`
      );

      const gateResult = await query(
        `SELECT COUNT(*) as scanned FROM tickets WHERE status = 'USED'`
      );

      const stats = {
        totalRevenue: parseInt(revenueResult.rows[0].total),
        standard: {
          count: parseInt(standardResult.rows[0].count),
          total: parseInt(standardResult.rows[0].total),
        },
        vip: {
          count: parseInt(vipResult.rows[0].count),
          total: parseInt(vipResult.rows[0].total),
        },
        gate: {
          scanned: parseInt(gateResult.rows[0].scanned),
          capacity: 500,
        },
      };

      return res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  // Bouncers
  if (path === '/api/admin/bouncers') {
    if (method === 'GET') {
      try {
        const result = await query(
          `SELECT id, name, created_at FROM bouncers ORDER BY created_at DESC`
        );
        return res.json({ bouncers: result.rows });
      } catch (error) {
        console.error('Get bouncers error:', error);
        return res.status(500).json({ error: 'Failed to fetch bouncers' });
      }
    } else if (method === 'POST') {
      try {
        const { name, pin } = req.body;

        if (!name || !pin) {
          return res.status(400).json({ error: 'Missing name or pin' });
        }

        if (pin.length !== 4 || isNaN(Number(pin))) {
          return res.status(400).json({ error: 'PIN must be 4 digits' });
        }

        const result = await query(
          `INSERT INTO bouncers (name, access_pin) VALUES ($1, $2) RETURNING id, name, created_at`,
          [name, pin]
        );

        return res.json({ bouncer: result.rows[0] });
      } catch (error) {
        console.error('Create bouncer error:', error);
        return res.status(500).json({ error: 'Failed to create bouncer' });
      }
    } else if (method === 'DELETE') {
      try {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Missing bouncer id' });
        }

        await query(`DELETE FROM bouncers WHERE id = $1`, [id]);
        return res.json({ success: true });
      } catch (error) {
        console.error('Delete bouncer error:', error);
        return res.status(500).json({ error: 'Failed to delete bouncer' });
      }
    }
  }

  // Transactions
  if (path === '/api/admin/transactions' && method === 'GET') {
    try {
      const { q } = queryParams;
      
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
      
      return res.json({ transactions });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  // Export
  if (path === '/api/admin/export' && method === 'GET') {
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
      return res.send(csv);
    } catch (error) {
      console.error('Export error:', error);
      return res.status(500).json({ error: 'Failed to export data' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
