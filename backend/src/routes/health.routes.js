const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      service: 'school-admission-api',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check could not reach PostgreSQL:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      service: 'school-admission-api'
    });
  }
});

module.exports = router;
