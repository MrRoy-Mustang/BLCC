import sqlite3 from 'sqlite3';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const db = new sqlite3.Database(dbPath);

export async function query(text: string, params?: any[]): Promise<{ rows: any[] }> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    // Convert PostgreSQL parameter syntax ($1, $2) to SQLite (?)
    let sql = text;
    if (params && params.length > 0) {
      let paramIndex = 1;
      sql = text.replace(/\$\d+/g, () => '?');
    }
    
    db.all(sql, params || [], (err, rows) => {
      const duration = Date.now() - start;
      console.log('Executed query', { text: sql, duration, rows: rows?.length });
      
      if (err) {
        reject(err);
      } else {
        resolve({ rows: rows || [] });
      }
    });
  });
}

export async function getClient() {
  return db;
}
