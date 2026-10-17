async function logActivity(client, userId, action, entityType, entityId, details = {}) {
  try {
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [userId, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Could not write activity log:', error.message);
  }
}

module.exports = { logActivity };