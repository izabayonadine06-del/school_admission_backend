require('dotenv').config();
const app = require('./app');
const pool = require('./db/pool');

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`School admission API listening on port ${port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
