const { Client } = require('pg');
require('dotenv').config();

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function createDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL in backend/.env before creating the database.');
  }

  const targetUrl = new URL(process.env.DATABASE_URL);
  const databaseName = decodeURIComponent(targetUrl.pathname.slice(1));
  if (!databaseName) {
    throw new Error('DATABASE_URL must include the target database name.');
  }

  targetUrl.pathname = '/postgres';
  const client = new Client({ connectionString: targetUrl.toString() });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName]
    );

    if (result.rowCount > 0) {
      console.log(`Database already exists: ${databaseName}`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    console.log(`Created database: ${databaseName}`);
  } finally {
    await client.end();
  }
}

createDatabase().catch((error) => {
  console.error('Database creation failed:', error.message);
  process.exitCode = 1;
});
