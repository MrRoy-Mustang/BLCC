import { Router } from 'express';
import { query } from '../utils/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Bouncer login
router.post('/bouncer/login', async (req, res) => {
  try {
    const { name, pin } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ error: 'Name and PIN required' });
    }

    const result = await query(
      `SELECT id, name, access_pin FROM bouncers WHERE name = $1`,
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const bouncer = result.rows[0];
    const isValid = await bcrypt.compare(pin, bouncer.access_pin);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { role: 'bouncer', id: bouncer.id, name: bouncer.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: 'bouncer', name: bouncer.name });
  } catch (error) {
    console.error('Bouncer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout (client-side only, just for completeness)
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

export default router;
