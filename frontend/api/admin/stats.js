const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
