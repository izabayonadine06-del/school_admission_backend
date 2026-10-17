const express = require('express');
const { randomBytes } = require('node:crypto');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { logActivity } = require('../utils/audit');
const { sendParentEmail } = require('../utils/email');

const router = express.Router();
const FINAL_STATUSES = ['ACCEPTED', 'CANCELLED'];
const REVIEW_STATUSES = ['UNDER_REVIEW', 'REQUIRES_CORRECTION', 'ACCEPTED', 'REJECTED'];
const TRADES = ['Software Development', 'Networking And Internet Technology', 'Computer Systems And Architecture', 'Accounting', 'Building Construction', 'Electronics And Telecommunication', 'Electrical Technology'];

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'HEADTEACHER') {
      const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : null;
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const requestedClass = typeof req.query.class === 'string' ? req.query.class.trim() : '';
      const from = typeof req.query.from === 'string' ? req.query.from : null;
      const to = typeof req.query.to === 'string' ? req.query.to : null;
      const allowedStatuses = ['PENDING', 'CANCELLED', ...REVIEW_STATUSES];
      if (status && !allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid application status filter' });
      if (search.length > 160 || requestedClass.length > 100) return res.status(400).json({ error: 'Search filters are too long' });
      if (from && !validDate(from)) return res.status(400).json({ error: 'from must be a valid YYYY-MM-DD date' });
      if (to && !validDate(to)) return res.status(400).json({ error: 'to must be a valid YYYY-MM-DD date' });
      const rawLimit = typeof req.query.limit === 'string' && /^\d+$/.test(req.query.limit) ? Number(req.query.limit) : 50;
      const rawOffset = typeof req.query.offset === 'string' && /^\d+$/.test(req.query.offset) ? Number(req.query.offset) : 0;
      const pageSize = Math.max(1, Math.min(rawLimit, 100));
      const pageOffset = Math.min(rawOffset, 100000);
      const result = await pool.query(
        `SELECT a.id, a.reference_number AS "referenceNumber", a.requested_class AS "requestedClass", a.level,
                a.admission_year AS "admissionYear",
                a.status, a.decision_comment AS "decisionComment", a.submitted_at AS "submittedAt",
                a.decision_at AS "decisionAt", s.id AS "studentId", s.full_name AS "studentName",
                u.full_name AS "parentName", u.email AS "parentEmail"
         FROM applications a
         JOIN students s ON s.id = a.student_id
         JOIN users u ON u.id = s.parent_id
         WHERE ($1::text IS NULL OR a.status = $1)
           AND ($2::text IS NULL OR s.full_name ILIKE $2 OR u.full_name ILIKE $2)
           AND ($3::text IS NULL OR a.requested_class ILIKE $3)
           AND ($4::date IS NULL OR a.submitted_at >= $4::date)
           AND ($5::date IS NULL OR a.submitted_at < $5::date + INTERVAL '1 day')
         ORDER BY a.submitted_at DESC
         LIMIT $6 OFFSET $7`,
        [status, search ? `%${search}%` : null, requestedClass ? `%${requestedClass}%` : null,
          from, to, pageSize, pageOffset]
      );
      return res.json({ applications: result.rows, pagination: { limit: pageSize, offset: pageOffset } });
    }

    if (req.user.role !== 'PARENT') return res.status(403).json({ error: 'You do not have permission to view applications' });
    const result = await pool.query(
      `SELECT a.id, a.reference_number AS "referenceNumber", a.requested_class AS "requestedClass", a.level,
              a.admission_year AS "admissionYear",
              a.status, a.decision_comment AS "decisionComment", a.submitted_at AS "submittedAt",
              a.decision_at AS "decisionAt", s.id AS "studentId", s.full_name AS "studentName"
       FROM applications a
       JOIN students s ON s.id = a.student_id
       WHERE s.parent_id = $1
       ORDER BY a.submitted_at DESC`,
      [req.user.id]
    );
    return res.json({ applications: result.rows });
  } catch (error) {
    return next(error);
  }
});

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
router.post('/', requireRole('PARENT'), async (req, res, next) => {
  const studentId = typeof req.body?.studentId === 'string' || typeof req.body?.studentId === 'number'
    ? String(req.body.studentId)
    : '';
  const requestedClass = typeof req.body?.requestedClass === 'string' ? req.body.requestedClass.trim() : '';
  const level = typeof req.body?.level === 'string' ? req.body.level.trim().toUpperCase() : '';
  const admissionYear = Number(req.body?.admissionYear);
  if (!/^[1-9]\d*$/.test(studentId)) return res.status(400).json({ error: 'A valid studentId is required' });
  if (!TRADES.includes(requestedClass)) return res.status(400).json({ error: 'Select a valid trade.' });
  if (!['L3', 'L4', 'L5'].includes(level)) return res.status(400).json({ error: 'A valid level is required (L3, L4, or L5).' });
  if (!Number.isInteger(admissionYear) || admissionYear < new Date().getFullYear() || admissionYear > 2100) return res.status(400).json({ error: 'Choose a valid available admission year.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const student = await client.query(
      'SELECT id FROM students WHERE id = $1 AND parent_id = $2 FOR UPDATE',
      [studentId, req.user.id]
    );
    if (student.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }

    const capacity = await client.query(
      `SELECT capacity FROM trade_capacities WHERE admission_year = $1 AND requested_class = $2 AND level = $3 FOR UPDATE`,
      [admissionYear, requestedClass, level]
    );
    if (!capacity.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Places for this trade, level, and year have not been set by the school.' });
    }
    const enrolled = await client.query(
      `SELECT COUNT(DISTINCT student_id)::integer AS count FROM applications
       WHERE admission_year = $1 AND requested_class = $2 AND level = $3 AND status = 'ACCEPTED'`,
      [admissionYear, requestedClass, level]
    );
    if (Number(enrolled.rows[0].count) >= Number(capacity.rows[0].capacity)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'There are no places remaining for this trade, level, and year.' });
    }

    const activeApplication = await client.query(
      `SELECT id FROM applications
       WHERE student_id = $1 AND status NOT IN ('REJECTED', 'CANCELLED')
       LIMIT 1 FOR UPDATE`,
      [studentId]
    );
    if (activeApplication.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This student already has an active application.' });
    }

    const referenceNumber = `ADM-${new Date().getUTCFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
    const result = await client.query(
      `INSERT INTO applications (reference_number, student_id, requested_class, level, admission_year)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, reference_number AS "referenceNumber", student_id AS "studentId",
                 requested_class AS "requestedClass", level, admission_year AS "admissionYear", status, submitted_at AS "submittedAt"`,
      [referenceNumber, studentId, requestedClass, level, admissionYear]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       SELECT id, 'NEW_APPLICATION', 'A new admission application is ready for review', 'APPLICATION', $1
       FROM users WHERE role = 'HEADTEACHER'`,
      [result.rows[0].id]
    );
    await logActivity(client, req.user.id, 'APPLICATION_SUBMITTED', 'APPLICATION', result.rows[0].id);
    await client.query('COMMIT');
    return res.status(201).json({ application: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});
router.patch('/:id', requireRole('PARENT'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid application id' });
  const requestedClass = typeof req.body?.requestedClass === 'string' ? req.body.requestedClass.trim() : '';
  const level = typeof req.body?.level === 'string' ? req.body.level.trim().toUpperCase() : '';
  if (!TRADES.includes(requestedClass)) return res.status(400).json({ error: 'Select a valid trade.' });
  if (!['L3', 'L4', 'L5'].includes(level)) return res.status(400).json({ error: 'A valid level is required (L3, L4, or L5).' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT a.id, a.status, a.student_id AS "studentId", s.parent_id AS "parentId",
              s.full_name AS "fullName", s.date_of_birth AS "dateOfBirth", s.gender,
              s.address, s.previous_school AS "previousSchool"
       FROM applications a JOIN students s ON s.id = a.student_id
       WHERE a.id = $1 AND s.parent_id = $2 FOR UPDATE OF a, s`,
      [req.params.id, req.user.id]
    );
    if (!current.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Application not found' }); }
    if (current.rows[0].status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Only pending applications can be updated by a parent.' });
    }
    const currentStudent = current.rows[0];
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : currentStudent.fullName;
    const dateOfBirth = req.body?.dateOfBirth === undefined ? currentStudent.dateOfBirth : req.body.dateOfBirth;
    const gender = req.body?.gender === undefined ? currentStudent.gender : req.body.gender;
    const address = req.body?.address === undefined ? currentStudent.address : req.body.address;
    const previousSchool = req.body?.previousSchool === undefined ? currentStudent.previousSchool : req.body.previousSchool;
    if (fullName.length < 2 || fullName.length > 160) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Student name must be between 2 and 160 characters.' }); }
    if (!validDate(String(dateOfBirth).slice(0, 10)) || String(dateOfBirth).slice(0, 10) > new Date().toISOString().slice(0, 10)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'A valid date of birth is required.' }); }
    if (gender !== null && (typeof gender !== 'string' || gender.trim().length > 30)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Gender must be 30 characters or fewer.' }); }
    if (address !== null && (typeof address !== 'string' || address.trim().length > 2000)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Address must be 2000 characters or fewer.' }); }
    if (previousSchool !== null && (typeof previousSchool !== 'string' || previousSchool.trim().length > 200)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Previous school must be 200 characters or fewer.' }); }
    await client.query(
      `UPDATE students SET full_name = $1, date_of_birth = $2, gender = $3, address = $4,
                           previous_school = $5, updated_at = NOW() WHERE id = $6`,
      [fullName, String(dateOfBirth).slice(0, 10), typeof gender === 'string' ? gender.trim() || null : null,
        typeof address === 'string' ? address.trim() || null : null,
        typeof previousSchool === 'string' ? previousSchool.trim() || null : null, currentStudent.studentId]
    );
    const updated = await client.query(
      `UPDATE applications SET requested_class = $1, level = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, reference_number AS "referenceNumber", requested_class AS "requestedClass", level,
                 status, submitted_at AS "submittedAt"`,
      [requestedClass, level, req.params.id]
    );
    await logActivity(client, req.user.id, 'APPLICATION_UPDATED', 'APPLICATION', req.params.id, { requestedClass, level });
    await client.query('COMMIT');
    return res.json({ application: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }
});

router.post('/:id/cancel', requireRole('PARENT'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid application id' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT a.id, a.status, s.full_name AS "studentName" FROM applications a
       JOIN students s ON s.id = a.student_id WHERE a.id = $1 AND s.parent_id = $2 FOR UPDATE OF a`,
      [req.params.id, req.user.id]
    );
    if (!current.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Application not found' }); }
    if (current.rows[0].status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Only pending applications can be cancelled.' });
    }
    const updated = await client.query(
      `UPDATE applications SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1 RETURNING id, reference_number AS "referenceNumber", status`,
      [req.params.id]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       SELECT id, 'APPLICATION_CANCELLED', $1, 'APPLICATION', $2 FROM users WHERE role = 'HEADTEACHER'`,
      [`A parent cancelled the application for ${current.rows[0].studentName}`, req.params.id]
    );
    await logActivity(client, req.user.id, 'APPLICATION_CANCELLED', 'APPLICATION', req.params.id);
    await client.query('COMMIT');
    return res.json({ application: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }
});

router.get('/:id', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid application id' });

  try {
    const isHeadteacher = req.user.role === 'HEADTEACHER';
    const result = await pool.query(
      `SELECT a.id, a.reference_number AS "referenceNumber", a.requested_class AS "requestedClass", a.level,
              a.admission_year AS "admissionYear", a.status, a.decision_comment AS "decisionComment", a.submitted_at AS "submittedAt",
              a.decision_at AS "decisionAt", s.id AS "studentId", s.full_name AS "studentName",
              s.date_of_birth AS "dateOfBirth", s.gender, s.address, s.previous_school AS "previousSchool",
              u.full_name AS "parentName", u.email AS "parentEmail", u.phone AS "parentPhone"
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.parent_id
       WHERE a.id = $1 AND ($2::boolean OR s.parent_id = $3)`,
      [req.params.id, isHeadteacher, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Application not found' });
    return res.json({ application: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});


router.post('/:id/resubmit', requireRole('PARENT'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid application id' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT a.id, a.status, s.parent_id AS "parentId"
       FROM applications a JOIN students s ON s.id = a.student_id
       WHERE a.id = $1 FOR UPDATE OF a`,
      [req.params.id]
    );
    if (current.rowCount === 0 || String(current.rows[0].parentId) !== String(req.user.id)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }
    if (current.rows[0].status !== 'REQUIRES_CORRECTION') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Only applications that require correction can be resubmitted' });
    }
    const updated = await client.query(
      `UPDATE applications
       SET status = 'PENDING', reviewer_id = NULL, decision_comment = NULL,
           decision_at = NULL, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, reference_number AS "referenceNumber", status, submitted_at AS "submittedAt"`,
      [req.params.id]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       SELECT id, 'APPLICATION_RESUBMITTED', 'A parent resubmitted an application for review', 'APPLICATION', $1
       FROM users WHERE role = 'HEADTEACHER'`,
      [req.params.id]
    );
    await logActivity(client, req.user.id, 'APPLICATION_RESUBMITTED', 'APPLICATION', req.params.id);
    await client.query('COMMIT');
    return res.json({ application: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});
router.patch('/:id/status', requireRole('HEADTEACHER'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid application id' });
  const status = typeof req.body?.status === 'string' ? req.body.status.toUpperCase() : '';
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : null;
  if (!REVIEW_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'status must be UNDER_REVIEW, REQUIRES_CORRECTION, ACCEPTED, or REJECTED' });
  }
  if (['REQUIRES_CORRECTION', 'REJECTED'].includes(status) && !comment) {
    return res.status(400).json({ error: 'A comment is required for correction requests and rejections' });
  }
  if (comment && comment.length > 2000) return res.status(400).json({ error: 'comment must be 2000 characters or fewer' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT a.id, a.status, a.student_id AS "studentId", a.requested_class AS "requestedClass", a.level, a.admission_year AS "admissionYear",
              s.parent_id, s.full_name AS "studentName",
              u.full_name AS "parentName", u.email AS "parentEmail"
       FROM applications a JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.parent_id
       WHERE a.id = $1 FOR UPDATE OF a`,
      [req.params.id]
    );
    if (current.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }
    if (FINAL_STATUSES.includes(current.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'A final admission decision cannot be changed' });
    }

    if (status === 'ACCEPTED' && current.rows[0].status !== 'ACCEPTED') {
      const record = current.rows[0];
      const capacity = await client.query(
        `SELECT capacity FROM trade_capacities WHERE admission_year = $1 AND requested_class = $2 AND level = $3 FOR UPDATE`,
        [record.admissionYear, record.requestedClass, record.level]
      );
      if (!capacity.rowCount) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Set available places for this year, trade, and level before accepting this application.' });
      }
      const enrolled = await client.query(
        `SELECT COUNT(DISTINCT student_id)::integer AS count FROM applications
         WHERE admission_year = $1 AND requested_class = $2 AND level = $3
           AND status = 'ACCEPTED' AND student_id <> $4`,
        [record.admissionYear, record.requestedClass, record.level, record.studentId]
      );
      if (Number(enrolled.rows[0].count) >= Number(capacity.rows[0].capacity)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'There are no places remaining for this trade, level, and year.' });
      }
    }

    const updated = await client.query(
      `UPDATE applications
       SET status = $1::varchar, reviewer_id = $2, decision_comment = $3,
           decision_at = CASE WHEN $1::varchar IN ('ACCEPTED', 'REJECTED') THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $4
      RETURNING id, reference_number AS "referenceNumber", admission_year AS "admissionYear", status,
                 decision_comment AS "decisionComment", decision_at AS "decisionAt"`,
      [status, req.user.id, comment || null, req.params.id]
    );
    const notice = `Your Application  now ${status}${comment ? `: ${comment}` : '.'}`;
    await client.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       VALUES ($1, 'APPLICATION_UPDATE', $2, 'APPLICATION', $3)`,
      [current.rows[0].parent_id, notice, req.params.id]
    );
    await logActivity(client, req.user.id, 'APPLICATION_STATUS_CHANGED', 'APPLICATION', req.params.id, { from: current.rows[0].status, to: status });
    await client.query('COMMIT');
    let emailSent = false;
    try {
      emailSent = await sendParentEmail({
        to: current.rows[0].parentEmail,
        parentName: current.rows[0].parentName,
        subject: `Application update for ${current.rows[0].studentName}`,
        message: notice
      });
    } catch (emailError) {
      console.error('Could not email application update:', emailError.message);
    }
    return res.json({ application: updated.rows[0], emailSent });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Application review rollback failed:', rollbackError.message);
    }
    console.error('Application review save failed:', {
      code: error.code,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      message: error.message
    });
    return next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
