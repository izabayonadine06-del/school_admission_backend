
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (error) => {
  console.error(
    'Unexpected PostgreSQL pool error:',
    error.message
  );
});

module.exports = pool;
