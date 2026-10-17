const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  const limit = Number.parseInt(req.query.limit, 10);
  const pageSize = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 50;
  try {
    const result = await pool.query(
      `SELECT id, notification_type AS type, message,
              related_record_type AS "relatedRecordType", related_record_id AS "relatedRecordId",
              created_at AS "createdAt", read_at AS "readAt"
       FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, pageSize]
    );
    return res.json({ notifications: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid notification id' });
  try {
    const result = await pool.query(
      `UPDATE notifications SET read_at = COALESCE(read_at, NOW())
       WHERE id = $1 AND recipient_id = $2
       RETURNING id, read_at AS "readAt"`,
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Notification not found' });
    return res.json({ notification: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;