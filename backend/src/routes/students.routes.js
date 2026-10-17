const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth, requireRole('PARENT'));

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name AS "fullName", date_of_birth AS "dateOfBirth",
              gender, address, previous_school AS "previousSchool", created_at AS "createdAt"
       FROM students WHERE parent_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ students: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const body = req.body || {};
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const dateOfBirth = body.dateOfBirth;
  const gender = typeof body.gender === 'string' ? body.gender.trim() : null;
  const address = typeof body.address === 'string' ? body.address.trim() : null;
  const previousSchool = typeof body.previousSchool === 'string' ? body.previousSchool.trim() : null;
  const errors = [];

  if (fullName.length < 2 || fullName.length > 160) errors.push('fullName must be between 2 and 160 characters');
  if (!validDate(dateOfBirth) || dateOfBirth > new Date().toISOString().slice(0, 10)) errors.push('dateOfBirth must be a valid past or present date in YYYY-MM-DD format');
  if (gender && gender.length > 30) errors.push('gender must be 30 characters or fewer');
  if (address && address.length > 2000) errors.push('address must be 2000 characters or fewer');
  if (previousSchool && previousSchool.length > 200) errors.push('previousSchool must be 200 characters or fewer');
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  try {
    const result = await pool.query(
      `INSERT INTO students (parent_id, full_name, date_of_birth, gender, address, previous_school)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name AS "fullName", date_of_birth AS "dateOfBirth",
                 gender, address, previous_school AS "previousSchool", created_at AS "createdAt"`,
      [req.user.id, fullName, dateOfBirth, gender || null, address || null, previousSchool || null]
    );
    return res.status(201).json({ student: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});


router.patch('/:id', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid student id' });
  const body = req.body || {};
  const values = [];
  const updates = [];

  if (Object.prototype.hasOwnProperty.call(body, 'fullName')) {
    const value = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    if (value.length < 2 || value.length > 160) return res.status(400).json({ error: 'fullName must be between 2 and 160 characters' });
    values.push(value);
    updates.push(`full_name = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'dateOfBirth')) {
    if (!validDate(body.dateOfBirth) || body.dateOfBirth > new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: 'dateOfBirth must be a valid past or present date in YYYY-MM-DD format' });
    }
    values.push(body.dateOfBirth);
    updates.push(`date_of_birth = $${values.length}`);
  }
  for (const [field, column, maxLength] of [['gender', 'gender', 30], ['address', 'address', 2000], ['previousSchool', 'previous_school', 200]]) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field] === null ? null : (typeof body[field] === 'string' ? body[field].trim() : undefined);
    if (value === undefined || (value && value.length > maxLength)) {
      return res.status(400).json({ error: `${field} must be a string of ${maxLength} characters or fewer, or null` });
    }
    values.push(value || null);
    updates.push(`${column} = $${values.length}`);
  }
  if (updates.length === 0) return res.status(400).json({ error: 'Provide at least one student field to update' });

  values.push(req.params.id, req.user.id);
  try {
    const result = await pool.query(
      `UPDATE students SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length - 1} AND parent_id = $${values.length}
       RETURNING id, full_name AS "fullName", date_of_birth AS "dateOfBirth",
                 gender, address, previous_school AS "previousSchool", updated_at AS "updatedAt"`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    return res.json({ student: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});
router.get('/:id', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid student id' });

  try {
    const result = await pool.query(
      `SELECT id, full_name AS "fullName", date_of_birth AS "dateOfBirth",
              gender, address, previous_school AS "previousSchool", created_at AS "createdAt"
       FROM students WHERE id = $1 AND parent_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    return res.json({ student: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;