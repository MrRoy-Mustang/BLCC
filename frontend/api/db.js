const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const pool = getPool();
  try {
    const result = await pool.query(sql, params);
    return { rows: result.rows };
  } catch (error) {
    throw error;
  }
}

module.exports = { query, getPool };
