const express = require('express');
const { randomBytes } = require('node:crypto');
const pool = require('../db/pool');
const { hashPassword, verifyPassword } = require('../utils/password');
const { requireAuth, hashToken } = require('../middleware/auth.middleware');

const router = express.Router();
const SESSION_LIFETIME_DAYS = 7;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateRegistration(body) {
  const errors = [];
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
  const address = typeof body.address === 'string' ? body.address.trim() : null;
  const password = typeof body.password === 'string' ? body.password : '';

  if (fullName.length < 2 || fullName.length > 160) errors.push('fullName must be between 2 and 160 characters');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required');
  if (phone && phone.length > 32) errors.push('phone must be 32 characters or fewer');
  if (address && address.length > 2000) errors.push('address must be 2000 characters or fewer');
  if (password.length < 9 || password.length > 128) errors.push('password must be between 12 and 128 characters');

  return { errors, fullName, email, phone: phone || null, address: address || null, password };
}

async function createSession(client, userId) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  await client.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 day'))`,
    [userId, tokenHash, SESSION_LIFETIME_DAYS]
  );
  return token;
}

router.post('/register', async (req, res, next) => {
  const { errors, fullName, email, phone, address, password } = validateRegistration(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await hashPassword(password);
    const inserted = await client.query(
      `INSERT INTO users (full_name, email, phone, address, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'PARENT')
       RETURNING id, full_name AS "fullName", email, phone, address, role, created_at AS "createdAt"`,
      [fullName, email, phone, address, passwordHash]
    );
    const user = inserted.rows[0];
    const token = await createSession(client, user.id);
    await client.query('COMMIT');
    return res.status(201).json({ user, token, expiresInDays: SESSION_LIFETIME_DAYS });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const found = await pool.query(
      'SELECT id, full_name AS "fullName", email, phone, address, role, password_hash FROM users WHERE email = $1',
      [email]
    );
    if (found.rowCount === 0 || !(await verifyPassword(password, found.rows[0].password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = found.rows[0];
    const token = await createSession(pool, user.id);
    delete user.password_hash;
    return res.json({ user, token, expiresInDays: SESSION_LIFETIME_DAYS });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

router.post('/initial-password', async (req, res, next) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[A-Za-z0-9_-]{40,}$/.test(token) || password.length < 12 || password.length > 128) {
    return res.status(400).json({ error: 'Use a valid setup link and a password between 12 and 128 characters.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT user_id FROM account_setup_tokens WHERE token_hash=$1 AND expires_at > NOW() FOR UPDATE`,
      [hashToken(token)]
    );
    if (!found.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This password setup link is invalid or expired. Contact the school for a new link.' });
    }
    const passwordHash = await hashPassword(password);
    await client.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [passwordHash, found.rows[0].user_id]);
    await client.query('DELETE FROM account_setup_tokens WHERE user_id=$1', [found.rows[0].user_id]);
    await client.query('COMMIT');
    return res.json({ message: 'Password created. You can now sign in with your parent email.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally { client.release(); }
});


router.patch('/me', requireAuth, async (req, res, next) => {
  const body = req.body || {};
  const updates = [];
  const values = [];
  const columns = { fullName: 'full_name', email: 'email', phone: 'phone' };

  if (Object.prototype.hasOwnProperty.call(body, 'fullName')) {
    const value = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    if (value.length < 2 || value.length > 160) return res.status(400).json({ error: 'fullName must be between 2 and 160 characters' });
    values.push(value);
    updates.push(`full_name = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'email')) {
    const value = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return res.status(400).json({ error: 'A valid email is required' });
    values.push(value);
    updates.push(`email = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'address')) {
    const value = body.address === null ? null : (typeof body.address === 'string' ? body.address.trim() : undefined);
    if (value === undefined || (value && value.length > 2000)) return res.status(400).json({ error: 'address must be a string of 2000 characters or fewer, or null' });
    values.push(value || null);
    updates.push(`address = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
    const value = body.phone === null ? null : (typeof body.phone === 'string' ? body.phone.trim() : undefined);
    if (value === undefined || (value && value.length > 32)) return res.status(400).json({ error: 'phone must be a string of 32 characters or fewer, or null' });
    values.push(value || null);
    updates.push(`phone = $${values.length}`);
  }
  if (updates.length === 0) return res.status(400).json({ error: 'Provide at least one profile field to update' });

  values.push(req.user.id);
  try {
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, full_name AS "fullName", email, phone, address, role, created_at AS "createdAt"`,
      values
    );
    return res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists' });
    return next(error);
  }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (!currentPassword || newPassword.length < 12 || newPassword.length > 128) {
    return res.status(400).json({ error: 'Current password is required; new password must be 12 to 128 characters' });
  }

  try {
    const found = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (found.rowCount === 0 || !(await verifyPassword(currentPassword, found.rows[0].password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const newHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [req.user.id, req.sessionTokenHash]);
    return res.json({ message: 'Password changed. Other sessions have been signed out.' });
  } catch (error) {
    return next(error);
  }
});
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [req.sessionTokenHash]);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
