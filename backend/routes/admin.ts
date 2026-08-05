import { Router } from 'express';
import { query } from '../utils/db';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    const token = jwt.sign(
      { role: 'admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: 'admin' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get statistics
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [standard, vip, scanned, totalIssued] = await Promise.all([
      query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'PAID' AND pass_type = 'STANDARD'`),
      query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'PAID' AND pass_type = 'REGULAR_VIP'`),
      query(`SELECT COUNT(*) as count FROM tickets WHERE status = 'USED'`),
      query(`SELECT COUNT(*) as count FROM tickets`),
    ]);

    const capacity = Number(process.env.EVENT_CAPACITY) || totalIssued.rows[0].count;

    res.json({
      totalRevenue: (standard.rows[0].total || 0) + (vip.rows[0].total || 0),
      standard: { count: standard.rows[0].count, total: standard.rows[0].total || 0 },
      vip: { count: vip.rows[0].count, total: vip.rows[0].total || 0 },
      gate: { scanned: scanned.rows[0].count, capacity },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get transactions with search
router.get('/transactions', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    
    let queryText = `
      SELECT t.id, t.reference, t.customer_name, t.customer_phone, t.pass_type, 
             t.amount, t.status, t.created_at, tk.status as ticket_status, tk.ticket_code
      FROM transactions t
      LEFT JOIN tickets tk ON t.id = tk.transaction_id
    `;
    const params: any[] = [];

    if (q && typeof q === 'string') {
      queryText += ` WHERE t.customer_name ILIKE $1 OR t.customer_phone ILIKE $1 OR t.reference ILIKE $1`;
      params.push(`%${q}%`);
    }

    queryText += ` ORDER BY t.created_at DESC LIMIT 200`;

    const result = await query(queryText, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Export transactions as CSV
router.get('/export', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT t.reference, t.customer_name, t.customer_phone, t.pass_type, 
              t.amount, t.status, tk.status as ticket_status, t.created_at
       FROM transactions t
       LEFT JOIN tickets tk ON t.id = tk.transaction_id
       ORDER BY t.created_at DESC`
    );

    const header = ['Reference', 'Customer', 'Phone', 'Pass Type', 'Amount (XAF)', 'Payment Status', 'Ticket Status', 'Created At'];
    const rows = result.rows.map((row: any) => [
      row.reference,
      row.customer_name,
      row.customer_phone,
      row.pass_type,
      String(row.amount),
      row.status,
      row.ticket_status || '—',
      row.created_at.toISOString(),
    ]);

    const csv = [header.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="blcc-ledger-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Get bouncers
router.get('/bouncers', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, name, created_at FROM bouncers ORDER BY created_at DESC`
    );
    res.json({ bouncers: result.rows });
  } catch (error) {
    console.error('Bouncers error:', error);
    res.status(500).json({ error: 'Failed to fetch bouncers' });
  }
});

// Create bouncer
router.post('/bouncers', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, pin } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ error: 'Name and PIN required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    const accessPin = await bcrypt.hash(pin, 10);

    const result = await query(
      `INSERT INTO bouncers (name, access_pin) VALUES ($1, $2) RETURNING id, name, created_at`,
      [name, accessPin]
    );

    res.json({ ok: true, bouncer: result.rows[0] });
  } catch (error) {
    console.error('Create bouncer error:', error);
    res.status(500).json({ error: 'Failed to create bouncer' });
  }
});

// Delete bouncer
router.delete('/bouncers', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Bouncer ID required' });
    }

    await query(`DELETE FROM bouncers WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete bouncer error:', error);
    res.status(500).json({ error: 'Failed to delete bouncer' });
  }
});

export default router;
