const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config();
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationNames = (await fs.readdir(path.join(__dirname, 'migrations')))
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const migrationName of migrationNames) {
      const alreadyApplied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [migrationName]
      );
      if (alreadyApplied.rowCount > 0) continue;

      const migration = await fs.readFile(path.join(__dirname, 'migrations', migrationName), 'utf8');
      await client.query(migration);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migrationName]);
      console.log(`Applied migration: ${migrationName}`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
});
