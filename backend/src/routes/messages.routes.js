const express = require('express');
const { randomUUID } = require('node:crypto');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { sendParentEmail } = require('../utils/email');

const router = express.Router();
router.use(requireAuth);

function validConversationId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readMessageBody(body) {
  return typeof body?.content === 'string' ? body.content.trim() : '';
}

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT m.conversation_id AS "conversationId",
              u.full_name AS "otherParticipant",
              MAX(m.sent_at) AS "lastMessageAt",
              COUNT(*) FILTER (WHERE m.recipient_id = $1 AND m.read_at IS NULL) AS "unreadCount"
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
       WHERE m.sender_id = $1 OR m.recipient_id = $1
       GROUP BY m.conversation_id, u.full_name
       ORDER BY MAX(m.sent_at) DESC`,
      [req.user.id]
    );
    return res.json({ conversations: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireRole('PARENT'), async (req, res, next) => {
  const content = readMessageBody(req.body);
  if (!content || content.length > 5000) return res.status(400).json({ error: 'content is required and must be 5000 characters or fewer' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const headteacher = await client.query(
      `SELECT id FROM users WHERE role = 'HEADTEACHER' ORDER BY id LIMIT 1`
    );
    if (headteacher.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'The school has not set up a headteacher account yet' });
    }

    const conversationId = randomUUID();
    const inserted = await client.query(
      `INSERT INTO messages (sender_id, recipient_id, conversation_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id AS "conversationId", content, sent_at AS "sentAt"`,
      [req.user.id, headteacher.rows[0].id, conversationId, content]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       VALUES ($1, 'NEW_MESSAGE', 'A parent sent you a message', 'MESSAGE', $2)`,
      [headteacher.rows[0].id, inserted.rows[0].id]
    );
    await client.query('COMMIT');
    return res.status(201).json({ message: inserted.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.get('/:conversationId', async (req, res, next) => {
  const { conversationId } = req.params;
  if (!validConversationId(conversationId)) return res.status(400).json({ error: 'Invalid conversation id' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT m.id, m.sender_id AS "senderId", m.recipient_id AS "recipientId",
              m.content, m.sent_at AS "sentAt", m.read_at AS "readAt",
              sender.full_name AS "senderName"
       FROM messages m
       JOIN users sender ON sender.id = m.sender_id
       WHERE m.conversation_id = $1 AND (m.sender_id = $2 OR m.recipient_id = $2)
       ORDER BY m.sent_at`,
      [conversationId, req.user.id]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Conversation not found' });
    }
    await client.query(
      `UPDATE messages SET read_at = NOW()
       WHERE conversation_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
      [conversationId, req.user.id]
    );
    await client.query('COMMIT');
    return res.json({ conversationId, messages: result.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/:conversationId', async (req, res, next) => {
  const { conversationId } = req.params;
  if (!validConversationId(conversationId)) return res.status(400).json({ error: 'Invalid conversation id' });
  const content = readMessageBody(req.body);
  if (!content || content.length > 5000) return res.status(400).json({ error: 'content is required and must be 5000 characters or fewer' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const conversation = await client.query(
      `SELECT sender_id, recipient_id FROM messages
       WHERE conversation_id = $1 AND (sender_id = $2 OR recipient_id = $2)
       ORDER BY sent_at DESC LIMIT 1`,
      [conversationId, req.user.id]
    );
    if (conversation.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const latest = conversation.rows[0];
    const recipientId = String(latest.sender_id) === String(req.user.id) ? latest.recipient_id : latest.sender_id;
    const inserted = await client.query(
      `INSERT INTO messages (sender_id, recipient_id, conversation_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id AS "conversationId", content, sent_at AS "sentAt"`,
      [req.user.id, recipientId, conversationId, content]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       VALUES ($1, 'NEW_MESSAGE', 'You received a new message', 'MESSAGE', $2)`,
      [recipientId, inserted.rows[0].id]
    );
    await client.query('COMMIT');
    let emailSent = false;
    if (req.user.role === 'HEADTEACHER') {
      try {
        const parent = await pool.query(
          "SELECT full_name AS \"parentName\", email FROM users WHERE id = $1 AND role = 'PARENT'",
          [recipientId]
        );
        if (parent.rowCount) {
          emailSent = await sendParentEmail({
            to: parent.rows[0].email,
            parentName: parent.rows[0].parentName,
            subject: 'New message from BTR Rwamiko TSS',
            message: content
          });
        }
      } catch (emailError) {
        console.error('Could not email parent message:', emailError.message);
      }
    }
    return res.status(201).json({ message: inserted.rows[0], emailSent });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
