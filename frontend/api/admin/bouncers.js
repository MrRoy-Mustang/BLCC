const { query } = require('../db');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT id, name, created_at FROM bouncers ORDER BY created_at DESC`
      );
      res.json({ bouncers: result.rows });
    } catch (error) {
      console.error('Get bouncers error:', error);
      res.status(500).json({ error: 'Failed to fetch bouncers' });
    }
  } else if (req.method === 'POST') {
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

      res.json({ bouncer: result.rows[0] });
    } catch (error) {
      console.error('Create bouncer error:', error);
      res.status(500).json({ error: 'Failed to create bouncer' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing bouncer id' });
      }

      await query(`DELETE FROM bouncers WHERE id = $1`, [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete bouncer error:', error);
      res.status(500).json({ error: 'Failed to delete bouncer' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
