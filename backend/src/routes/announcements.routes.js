const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { logActivity } = require('../utils/audit');
const { sendParentEmail } = require('../utils/email');

const router = express.Router();
router.use(requireAuth);


async function notifyParentsOfAnnouncement(client, announcementId, title, content) {
  const inserted = await client.query(
    `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
     SELECT u.id, 'NEW_ANNOUNCEMENT', $1, 'ANNOUNCEMENT', $2
     FROM users u
     WHERE u.role = 'PARENT' AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.recipient_id = u.id AND n.related_record_type = 'ANNOUNCEMENT'
           AND n.related_record_id = $2 AND n.notification_type = 'NEW_ANNOUNCEMENT'
       )
     RETURNING recipient_id AS "recipientId"`,
    [`New school announcement: ${title}`, announcementId]
  );
  if (!inserted.rowCount) return { emailSentCount: 0, emailRecipientCount: 0 };
  const parents = await client.query(
    'SELECT full_name AS "parentName", email FROM users WHERE id = ANY($1::bigint[])',
    [inserted.rows.map((row) => row.recipientId)]
  );
  const results = await Promise.all(parents.rows.map(async (parent) => {
    try {
      return await sendParentEmail({
        to: parent.email,
        parentName: parent.parentName,
        subject: `New school announcement: ${title}`,
        message: `New school announcement: ${title}\n\n${content}`
      });
    } catch (error) {
      console.error('Could not email school announcement:', error.message);
      return false;
    }
  }));
  return {
    emailSentCount: results.filter(Boolean).length,
    emailRecipientCount: parents.rowCount
  };
}
router.get('/', async (req, res, next) => {
  try {
    const isHeadteacher = req.user.role === 'HEADTEACHER';
    const result = await pool.query(
      `SELECT a.id, a.title, a.content, a.is_published AS "isPublished",
              a.published_at AS "publishedAt", a.created_at AS "createdAt",
              u.full_name AS "authorName"
       FROM announcements a JOIN users u ON u.id = a.author_id
       WHERE ($1::boolean OR a.is_published = TRUE)
       ORDER BY COALESCE(a.published_at, a.created_at) DESC`,
      [isHeadteacher]
    );
    return res.json({ announcements: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireRole('HEADTEACHER'), async (req, res, next) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  const publish = req.body?.publish === true;
  const errors = [];
  if (!title || title.length > 200) errors.push('title is required and must be 200 characters or fewer');
  if (!content || content.length > 20000) errors.push('content is required and must be 20000 characters or fewer');
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, content, author_id, is_published, published_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN NOW() ELSE NULL END)
       RETURNING id, title, content, is_published AS "isPublished", published_at AS "publishedAt"`,
      [title, content, req.user.id, publish]
    );
    const delivery = publish ? await notifyParentsOfAnnouncement(pool, result.rows[0].id, title, content) : null;
    await logActivity(pool, req.user.id, 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT', result.rows[0].id, { published: publish });
    return res.status(201).json({ announcement: result.rows[0], ...(delivery || {}) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', requireRole('HEADTEACHER'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid announcement id' });
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!title || title.length > 200 || !content || content.length > 20000) {
    return res.status(400).json({ error: 'A title (up to 200 characters) and content (up to 20000 characters) are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE announcements SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, content, is_published AS "isPublished", published_at AS "publishedAt"`,
      [title, content, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Announcement not found' });
    await logActivity(pool, req.user.id, 'ANNOUNCEMENT_UPDATED', 'ANNOUNCEMENT', req.params.id);
    return res.json({ announcement: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/publish', requireRole('HEADTEACHER'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid announcement id' });
  if (typeof req.body?.published !== 'boolean') return res.status(400).json({ error: 'published must be true or false' });

  try {
    const result = await pool.query(
      `UPDATE announcements
       SET is_published = $1,
           published_at = CASE WHEN $1 THEN COALESCE(published_at, NOW()) ELSE NULL END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, title, content, is_published AS "isPublished", published_at AS "publishedAt"`,
      [req.body.published, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Announcement not found' });
    const delivery = req.body.published
      ? await notifyParentsOfAnnouncement(pool, result.rows[0].id, result.rows[0].title, result.rows[0].content)
      : null;
    await logActivity(pool, req.user.id, 'ANNOUNCEMENT_PUBLISH_STATUS_CHANGED', 'ANNOUNCEMENT', req.params.id, { published: req.body.published });
    return res.json({ announcement: result.rows[0], ...(delivery || {}) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
