const { createHash } = require('node:crypto');
const pool = require('../db/pool');

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]{40,})$/);
  if (!match) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const tokenHash = hashToken(match[1]);
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name AS "fullName", u.email, u.phone, u.address, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = result.rows[0];
    req.sessionTokenHash = tokenHash;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole, hashToken };