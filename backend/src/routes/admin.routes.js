const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { sendDisciplineEmail, sendParentEmail } = require('../utils/email');
const { randomBytes } = require('node:crypto');
const { hashPassword } = require('../utils/password');
const { hashToken } = require('../middleware/auth.middleware');
const { logActivity } = require('../utils/audit');
const fs = require('node:fs/promises');
const path = require('node:path');

const router = express.Router();
router.use(requireAuth, requireRole('HEADTEACHER'));

router.get('/public-admissions', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, reference_number AS "referenceNumber", parent_name AS "parentName",
              parent_email AS "parentEmail", parent_phone AS "parentPhone", parent_address AS "parentAddress",
              student_name AS "studentName", date_of_birth AS "dateOfBirth", gender,
              student_address AS "studentAddress", previous_school AS "previousSchool",
              requested_class AS "requestedClass", level, status, decision_comment AS "decisionComment",
              submitted_at AS "submittedAt", parent_user_id AS "parentUserId",
              student_id AS "studentId", application_id AS "applicationId",
              (SELECT COALESCE(json_agg(json_build_object('id',d.id,'documentType',d.document_type,
                'originalFilename',d.original_filename,'mimeType',d.mime_type)), '[]'::json)
               FROM public_admission_documents d WHERE d.request_id=public_admission_requests.id) AS documents
       FROM public_admission_requests ORDER BY submitted_at DESC LIMIT 200`
    );
    return res.json({ admissions: result.rows });
  } catch (error) { return next(error); }
});

router.get('/public-admissions/:id/documents/:documentId', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id) || !/^[1-9]\d*$/.test(req.params.documentId)) return res.status(400).json({ error: 'Invalid document identifier' });
  try {
    const result = await pool.query(
      `SELECT d.storage_key,d.original_filename FROM public_admission_documents d
       WHERE d.id=$1 AND d.request_id=$2`, [req.params.documentId, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Application document not found' });
    const directory = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../storage/documents'));
    const key = result.rows[0].storage_key;
    if (!/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(key)) return res.status(500).json({ error: 'Invalid document storage record' });
    const filePath = path.resolve(directory, key);
    if (!filePath.startsWith(directory + path.sep)) return res.status(500).json({ error: 'Invalid document storage record' });
    await fs.access(filePath);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.download(filePath, result.rows[0].original_filename);
  } catch (error) { return next(error); }
});

router.patch('/public-admissions/:id', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid admission request id' });
  const status = typeof req.body?.status === 'string' ? req.body.status.toUpperCase() : '';
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : null;
  const reviewStatuses = ['UNDER_REVIEW', 'REQUIRES_CORRECTION', 'ACCEPTED', 'REJECTED'];
  if (!reviewStatuses.includes(status)) return res.status(400).json({ error: 'Invalid public application review status' });
  if (['REQUIRES_CORRECTION', 'REJECTED'].includes(status) && !comment) return res.status(400).json({ error: 'A comment is required for correction requests and rejections' });
  if (comment && comment.length > 2000) return res.status(400).json({ error: 'comment must be 2000 characters or fewer' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM public_admission_requests WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!current.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Public application not found' }); }
    if (['ACCEPTED', 'REJECTED'].includes(current.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'A final admission decision cannot be changed' });
    }
    const updated = await client.query(
      `UPDATE public_admission_requests
       SET status=$1::varchar, decision_comment=$2, reviewer_id=$3,
           decision_at=CASE WHEN $1::varchar IN ('ACCEPTED','REJECTED') THEN NOW() ELSE NULL END
       WHERE id=$4
       RETURNING id, reference_number AS "referenceNumber", parent_email AS "parentEmail",
                 parent_name AS "parentName", student_name AS "studentName", status,
                 decision_comment AS "decisionComment", decision_at AS "decisionAt", parent_user_id AS "parentUserId"`,
      [status, comment || null, req.user.id, req.params.id]
    );
    const item = updated.rows[0];
    const notice = `Admission request ${item.referenceNumber} for ${item.studentName} is now ${status.replaceAll('_', ' ').toLowerCase()}${comment ? `: ${comment}` : '.'}`;
    if (item.parentUserId) {
      await client.query(
        `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
         VALUES ($1, 'APPLICATION_UPDATE', $2, 'PUBLIC_ADMISSION', $3)`,
        [item.parentUserId, notice, item.id]
      );
    }
    await logActivity(client, req.user.id, 'PUBLIC_ADMISSION_STATUS_CHANGED', 'PUBLIC_ADMISSION', item.id, { from: current.rows[0].status, to: status });
    await client.query('COMMIT');
    let emailSent = false;
    try { emailSent = await sendParentEmail({ to: item.parentEmail, parentName: item.parentName, subject: `Admission request ${status.replaceAll('_', ' ').toLowerCase()}`, message: notice }); }
    catch (emailError) { console.error('Could not email public admission decision:', emailError.message); }
    return res.json({ admission: item, emailSent });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally { client.release(); }
});

router.post('/public-admissions/:id/create-account', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid admission request id' });
  const client = await pool.connect();
  let setupToken = null;
  let parentEmail = '';
  let parentName = '';
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM public_admission_requests WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!found.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Admission request not found' }); }
    const request = found.rows[0];
    if (request.status !== 'ACCEPTED') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Accept the admission request before creating the parent account.' }); }
    let parentId = request.parent_user_id;
    let createdAccount = false;
    const existing = await client.query('SELECT id, role FROM users WHERE email=$1', [request.parent_email.toLowerCase()]);
    if (existing.rowCount) {
      if (existing.rows[0].role !== 'PARENT') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'This email belongs to a non-parent account. Resolve the account conflict before continuing.' }); }
      parentId = existing.rows[0].id;
    } else if (!parentId) {
      const temporaryPassword = randomBytes(48).toString('base64url');
      const passwordHash = await hashPassword(temporaryPassword);
      const user = await client.query(
        `INSERT INTO users (full_name,email,phone,address,password_hash,role) VALUES ($1,$2,$3,$4,$5,'PARENT') RETURNING id`,
        [request.parent_name, request.parent_email.toLowerCase(), request.parent_phone, request.parent_address, passwordHash]
      );
      parentId = user.rows[0].id;
      createdAccount = true;
      setupToken = randomBytes(32).toString('base64url');
      await client.query(
        `INSERT INTO account_setup_tokens (token_hash,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '24 hours')`,
        [hashToken(setupToken), parentId]
      );
    }

    let studentId = request.student_id;
    if (!studentId) {
      const student = await client.query(
        `INSERT INTO students (parent_id,full_name,date_of_birth,gender,address,previous_school) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [parentId, request.student_name, request.date_of_birth, request.gender, request.student_address, request.previous_school]
      );
      studentId = student.rows[0].id;
    }
    let applicationId = request.application_id;
    if (!applicationId) {
      const ref = `ADM-${randomBytes(5).toString('hex').toUpperCase()}`;
      const application = await client.query(
        `INSERT INTO applications (reference_number,student_id,requested_class,level,status,reviewer_id,decision_comment,decision_at)
         VALUES ($1,$2,$3,$4,'ACCEPTED',$5,$6,NOW()) RETURNING id`,
        [ref, studentId, request.requested_class, request.level || 'L3', req.user.id, request.decision_comment]
      );
      applicationId = application.rows[0].id;
      await client.query(
        `INSERT INTO documents (application_id,document_type,storage_key,original_filename,mime_type)
         SELECT $1,document_type,storage_key,original_filename,mime_type FROM public_admission_documents WHERE request_id=$2`,
        [applicationId, request.id]
      );
    }
    await client.query('UPDATE public_admission_requests SET parent_user_id=$1, student_id=$2, application_id=$3 WHERE id=$4', [parentId, studentId, applicationId, request.id]);
    await client.query('COMMIT');
    parentEmail = request.parent_email;
    parentName = request.parent_name;
    let emailSent = false;
    if (setupToken) {
      const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup-password?token=${encodeURIComponent(setupToken)}`;
      try {
        emailSent = await sendParentEmail({ to: parentEmail, parentName, subject: 'Set up your BTR parent account', message: `The headteacher accepted your application. Set your password within 24 hours using this secure link:\n\n${url}` });
      } catch (emailError) { console.error('Could not email parent account setup link:', emailError.message); }
    }
    return res.json({ accountCreated: createdAccount, studentCreated: Boolean(studentId), emailSent, parentEmail });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this parent email already exists. Refresh the request and try again.' });
    return next(error);
  } finally { client.release(); }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const [counts, statuses, activity] = await Promise.all([
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM users WHERE role = 'PARENT') AS parents,
           (SELECT COUNT(DISTINCT a.student_id) FROM applications a WHERE a.status = 'ACCEPTED') AS students,
           (SELECT COUNT(*) FROM applications) AS applications,
           (SELECT COUNT(*) FROM applications WHERE status = 'PENDING') AS pending,
           (SELECT COUNT(*) FROM applications WHERE status = 'ACCEPTED') AS accepted,
           (SELECT COUNT(*) FROM applications WHERE status = 'REJECTED') AS rejected,
           (SELECT COUNT(*) FROM messages WHERE recipient_id = $1 AND read_at IS NULL) AS unreadMessages`,
        [req.user.id]
      ),
      pool.query('SELECT status, COUNT(*) AS count FROM applications GROUP BY status ORDER BY status'),
      pool.query(
        `SELECT l.id, l.action, l.entity_type AS "entityType", l.entity_id AS "entityId",
                l.details, l.created_at AS "createdAt", u.full_name AS "userName"
         FROM activity_logs l LEFT JOIN users u ON u.id = l.user_id
         ORDER BY l.created_at DESC LIMIT 10`
      )
    ]);
    return res.json({ statistics: counts.rows[0], applicationsByStatus: statuses.rows, recentActivity: activity.rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/reports/activity', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.action, l.entity_type AS "entityType", l.entity_id AS "entityId",
              l.details, l.created_at AS "createdAt", u.full_name AS "userName"
       FROM activity_logs l LEFT JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC, l.id DESC`
    );
    return res.json({ logs: result.rows });
  } catch (error) {
    return next(error);
  }
});
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

router.get('/reports/admissions', async (req, res, next) => {
  const from = req.query.from || null;
  const to = req.query.to || null;
  const requestedClass = typeof req.query.class === 'string' ? req.query.class.trim() : null;
  if (from && !validDate(from)) return res.status(400).json({ error: 'from must be a valid YYYY-MM-DD date' });
  if (to && !validDate(to)) return res.status(400).json({ error: 'to must be a valid YYYY-MM-DD date' });
  if (requestedClass && requestedClass.length > 100) return res.status(400).json({ error: 'class must be 100 characters or fewer' });

  const filters = [from, to, requestedClass || null];
  const where = `WHERE ($1::date IS NULL OR a.submitted_at >= $1::date)
                 AND ($2::date IS NULL OR a.submitted_at < $2::date + INTERVAL '1 day')
                 AND ($3::text IS NULL OR a.requested_class = $3)`;
  try {
    if (req.query.format === 'csv') {
      const result = await pool.query(
        `SELECT a.reference_number, s.full_name AS student_name, u.full_name AS parent_name,
                a.requested_class, a.status, a.submitted_at
         FROM applications a JOIN students s ON s.id = a.student_id
         JOIN users u ON u.id = s.parent_id ${where}
         ORDER BY a.submitted_at DESC LIMIT 5000`,
        filters
      );
      const rows = [
        ['Reference', 'Student', 'Parent', 'Requested class', 'Status', 'Submitted at'],
        ...result.rows.map((row) => [row.reference_number, row.student_name, row.parent_name,
          row.requested_class, row.status, row.submitted_at?.toISOString()])
      ];
      const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="admission-report.csv"');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.send(csv);
    }

    const [statuses, classes] = await Promise.all([
      pool.query(
        `SELECT a.status, COUNT(*) AS count FROM applications a ${where}
         GROUP BY a.status ORDER BY a.status`, filters
      ),
      pool.query(
        `SELECT a.requested_class AS "requestedClass", COUNT(*) AS count
         FROM applications a ${where}
         GROUP BY a.requested_class ORDER BY a.requested_class`, filters
      )
    ]);
    return res.json({ filters: { from, to, requestedClass }, applicationsByStatus: statuses.rows, applicationsByClass: classes.rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/parents', async (req, res, next) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Number.parseInt(req.query.limit, 10);
  const pageSize = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 50;
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name AS "fullName", u.email, u.phone, u.address,
              u.created_at AS "createdAt", COUNT(s.id) AS "studentCount"
       FROM users u LEFT JOIN students s ON s.parent_id = u.id
       WHERE u.role = 'PARENT'
         AND ($1::text = '' OR u.full_name ILIKE $2 OR u.email ILIKE $2 OR u.phone ILIKE $2)
       GROUP BY u.id ORDER BY u.created_at DESC LIMIT $3`,
      [search, `%${search}%`, pageSize]
    );
    return res.json({ parents: result.rows });
  } catch (error) {
    return next(error);
  }
});


router.get('/students', async (req, res, next) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Number.parseInt(req.query.limit, 10);
  const pageSize = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 50;
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (s.id) s.id, s.full_name AS "fullName", s.date_of_birth AS "dateOfBirth",
              a.requested_class AS "schoolClass", a.level AS "level", u.id AS "parentId",
              u.full_name AS "parentName", u.email AS "parentEmail"
       FROM students s JOIN users u ON u.id = s.parent_id
       JOIN applications a ON a.student_id = s.id AND a.status = 'ACCEPTED'
       WHERE ($1::text = '' OR s.full_name ILIKE $2 OR u.full_name ILIKE $2 OR u.email ILIKE $2)
       ORDER BY s.id, a.decision_at DESC NULLS LAST, a.submitted_at DESC
       LIMIT $3`,
      [search, `%${search}%`, pageSize]
    );
    return res.json({ students: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.patch('/students/:studentId/parent', async (req, res, next) => {
  const { studentId } = req.params;
  const parentId = typeof req.body?.parentId === 'string' || typeof req.body?.parentId === 'number'
    ? String(req.body.parentId) : '';
  if (!/^[1-9]\d*$/.test(studentId) || !/^[1-9]\d*$/.test(parentId)) {
    return res.status(400).json({ error: 'A valid student and parent are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const parent = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'PARENT'", [parentId]);
    if (!parent.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Parent account not found.' });
    }
    const currentStudent = await client.query('SELECT id, parent_id AS "parentId" FROM students WHERE id = $1 FOR UPDATE', [studentId]);
    if (!currentStudent.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found.' });
    }
    if (String(currentStudent.rows[0].parentId) === parentId) {
      await client.query('COMMIT');
      return res.json({ student: { id: studentId, parentId }, unchanged: true });
    }
    const updated = await client.query(
      'UPDATE students SET parent_id = $1 WHERE id = $2 RETURNING id, full_name AS "fullName", parent_id AS "parentId"',
      [parentId, studentId]
    );
    if (!updated.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found.' });
    }
    await client.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       VALUES ($1, 'STUDENT_ASSIGNED', $2, 'STUDENT', $3)`,
      [parentId, `${updated.rows[0].fullName} has been assigned to your parent account by the school.`, studentId]
    );
    await logActivity(client, req.user.id, 'STUDENT_REASSIGNED', 'STUDENT', studentId, { parentId });
    await client.query('COMMIT');
    return res.json({ student: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/students/:studentId/discipline', async (req, res, next) => {
  const { studentId } = req.params;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!/^[1-9]\d*$/.test(studentId)) return res.status(400).json({ error: 'Invalid student id' });
  if (!message || message.length > 2000) return res.status(400).json({ error: 'A message is required and must be 2000 characters or fewer' });

  try {
    const student = await pool.query(
      `SELECT s.id, s.full_name AS "studentName", a.requested_class AS "schoolClass",
              u.id AS "parentId", u.full_name AS "parentName", u.email AS "parentEmail"
       FROM students s JOIN users u ON u.id = s.parent_id
       JOIN applications a ON a.student_id = s.id AND a.status = 'ACCEPTED'
       WHERE s.id = $1
       ORDER BY a.decision_at DESC NULLS LAST, a.submitted_at DESC LIMIT 1`,
      [studentId]
    );
    if (student.rowCount === 0) return res.status(404).json({ error: 'Accepted student not found' });

    const record = student.rows[0];
    const notice = `Discipline notice for ${record.studentName}: ${message}`;
    await pool.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type, related_record_id)
       VALUES ($1, 'DISCIPLINE_NOTICE', $2, 'STUDENT', $3)`,
      [record.parentId, notice, record.id]
    );

    let emailSent = false;
    try {
      emailSent = await sendDisciplineEmail({ ...record, message });
    } catch (emailError) {
      console.error('Could not email discipline notice:', emailError.message);
    }
    return res.status(201).json({ notificationSent: true, emailSent, parentEmail: record.parentEmail });
  } catch (error) {
    return next(error);
  }
});

router.post('/notifications', async (req, res, next) => {
  const body = req.body || {};
  const allStudents = body.allStudents === true;
  const studentIds = Array.isArray(body.studentIds) ? [...new Set(body.studentIds.map(String))] : [];
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 2000) {
    return res.status(400).json({ error: 'message is required and must be 2000 characters or fewer' });
  }
  if (allStudents && studentIds.length > 0) {
    return res.status(400).json({ error: 'Choose allStudents or studentIds, not both' });
  }
  if (!allStudents && (studentIds.length === 0 || studentIds.length > 500 || studentIds.some((id) => !/^[1-9]\d*$/.test(id)))) {
    return res.status(400).json({ error: 'Provide allStudents: true or 1 to 500 valid studentIds' });
  }

  try {
    let selected;
    if (allStudents) {
      selected = await pool.query(`SELECT DISTINCT s.parent_id AS id FROM students s
        JOIN applications a ON a.student_id = s.id AND a.status = 'ACCEPTED' AND a.level = 'L3'`);
    } else {
      const studentRows = await pool.query(
        `SELECT DISTINCT ON (s.id) s.id, s.parent_id AS "parentId" FROM students s
         JOIN applications a ON a.student_id = s.id AND a.status = 'ACCEPTED' AND a.level = 'L3'
         WHERE s.id = ANY($1::bigint[]) ORDER BY s.id, a.decision_at DESC NULLS LAST`,
        [studentIds]
      );
      if (studentRows.rowCount !== studentIds.length) {
        return res.status(400).json({ error: 'Only accepted L3 students can be selected for a notice.' });
      }
      const parentIds = [...new Set(studentRows.rows.map((row) => String(row.parentId)))];
      selected = { rows: parentIds.map((id) => ({ id })) };
    }
    if (selected.rows.length === 0) return res.status(409).json({ error: 'No students have parent accounts to notify' });

    const inserted = await pool.query(
      `INSERT INTO notifications (recipient_id, notification_type, message, related_record_type)
       SELECT recipient_id, 'HEADTEACHER_NOTICE', $1, 'STUDENT_SELECTION'
       FROM unnest($2::bigint[]) AS recipients(recipient_id)
       RETURNING id, recipient_id AS "recipientId"`,
      [message, selected.rows.map((row) => row.id)]
    );
    const parents = await pool.query(
      'SELECT full_name AS "parentName", email FROM users WHERE id = ANY($1::bigint[])',
      [inserted.rows.map((row) => row.recipientId)]
    );
    const emailResults = await Promise.all(parents.rows.map(async (parent) => {
      try {
        return await sendParentEmail({
          to: parent.email,
          parentName: parent.parentName,
          subject: 'School notice from BTR Rwamiko TSS',
          message
        });
      } catch (emailError) {
        console.error('Could not email school notice:', emailError.message);
        return false;
      }
    }));
    return res.status(201).json({
      sentCount: inserted.rowCount,
      emailSentCount: emailResults.filter(Boolean).length,
      notificationType: 'HEADTEACHER_NOTICE'
    });
  } catch (error) {
    return next(error);
  }
});
module.exports = router;
