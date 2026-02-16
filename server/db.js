const { Pool } = require('pg');

// Railway setzt DATABASE_URL automatisch
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL nicht gesetzt!');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Tabellen erstellen beim Start
const initDb = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        color VARCHAR(20) DEFAULT '#dc2626',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        console.log('Database initialized');
    } catch (error) {
        console.error('Database init error:', error);
    }
};

module.exports = { pool, initDb };
