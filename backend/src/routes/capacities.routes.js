const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { logActivity } = require('../utils/audit');

const router = express.Router();
const TRADES = ['Software Development', 'Networking And Internet Technology', 'Computer Systems And Architecture', 'Accounting', 'Building Construction', 'Electronics And Telecommunication', 'Electrical Technology'];
const LEVELS = ['L3', 'L4', 'L5'];

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  const year = req.query.year === undefined ? new Date().getFullYear() : Number(req.query.year);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return res.status(400).json({ error: 'year must be between 2020 and 2100' });
  try {
    const result = await pool.query(
      `SELECT c.id, c.admission_year AS "admissionYear", c.requested_class AS "requestedClass", c.level,
              c.capacity, COALESCE(enrolled.count, 0)::integer AS enrolled,
              GREATEST(c.capacity - COALESCE(enrolled.count, 0), 0)::integer AS remaining,
              c.updated_at AS "updatedAt"
       FROM trade_capacities c
       LEFT JOIN (
         SELECT admission_year, requested_class, level, COUNT(DISTINCT student_id)::integer AS count
         FROM applications WHERE status = 'ACCEPTED'
         GROUP BY admission_year, requested_class, level
       ) enrolled ON enrolled.admission_year = c.admission_year
                 AND enrolled.requested_class = c.requested_class AND enrolled.level = c.level
       WHERE c.admission_year = $1
       ORDER BY c.requested_class, c.level`,
      [year]
    );
    return res.json({ year, capacities: result.rows });
  } catch (error) { return next(error); }
});

router.put('/', requireRole('HEADTEACHER'), async (req, res, next) => {
  const year = Number(req.body?.admissionYear);
  const requestedClass = typeof req.body?.requestedClass === 'string' ? req.body.requestedClass.trim() : '';
  const level = typeof req.body?.level === 'string' ? req.body.level.trim().toUpperCase() : '';
  const rawCapacity = req.body?.capacity;
  const capacity = Number(rawCapacity);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return res.status(400).json({ error: 'Admission year must be between 2020 and 2100.' });
  if (!TRADES.includes(requestedClass)) return res.status(400).json({ error: 'Select a valid trade.' });
  if (!LEVELS.includes(level)) return res.status(400).json({ error: 'Select a valid level.' });
  if (rawCapacity === undefined || rawCapacity === null || rawCapacity === '' || !Number.isInteger(capacity) || capacity < 0 || capacity > 10000) return res.status(400).json({ error: 'Capacity must be a whole number between 0 and 10000.' });
  try {
    const result = await pool.query(
      `INSERT INTO trade_capacities (admission_year, requested_class, level, capacity, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (admission_year, requested_class, level)
       DO UPDATE SET capacity = EXCLUDED.capacity, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING id, admission_year AS "admissionYear", requested_class AS "requestedClass", level,
                 capacity, updated_at AS "updatedAt"`,
      [year, requestedClass, level, capacity, req.user.id]
    );
    await logActivity(pool, req.user.id, 'TRADE_CAPACITY_UPDATED', 'TRADE_CAPACITY', result.rows[0].id,
      { admissionYear: year, requestedClass, level, capacity });
    return res.json({ capacity: result.rows[0] });
  } catch (error) { return next(error); }
});

module.exports = router;
