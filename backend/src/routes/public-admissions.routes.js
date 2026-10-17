const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const multer = require('multer');
const pool = require('../db/pool');

const router = express.Router();
const trades = ['Software Development', 'Networking And Internet Technology', 'Computer Systems And Architecture', 'Accounting', 'Building Construction', 'Electronics And Telecommunication', 'Electrical Technology'];
const storage = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../storage/documents'));
const temporary = path.join(storage, '.tmp');
const types = { previousResult: 'PREVIOUS_SCHOOL_REPORT', transferDocument: 'TRANSFER_DOCUMENT', studentPhoto: 'STUDENT_PHOTO', nationalResult: 'NATIONAL_EXAM_RESULT' };
const mimeExt = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };
const upload = multer({
  storage: multer.diskStorage({ destination(req, file, cb) { fs.mkdir(temporary, { recursive: true }).then(() => cb(null, temporary), cb); }, filename(req, file, cb) { cb(null, `${randomUUID()}.upload`); } }),
  limits: { fileSize: 10 * 1024 * 1024, files: 4, fields: 20, parts: 24 },
  fileFilter(req, file, cb) { cb(null, ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)); }
});

router.get('/capacities', async (req, res, next) => {
  const year = req.query.year === undefined ? new Date().getFullYear() : Number(req.query.year);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return res.status(400).json({ error: 'year must be between 2020 and 2100' });
  try {
    const result = await pool.query(
      `SELECT c.id, c.admission_year AS "admissionYear", c.requested_class AS "requestedClass", c.level,
              c.capacity, COALESCE(enrolled.count, 0)::integer AS enrolled,
              GREATEST(c.capacity - COALESCE(enrolled.count, 0), 0)::integer AS remaining
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
router.post('/', upload.fields(Object.keys(types).map((name) => ({ name, maxCount: 1 }))), async (req, res, next) => {
  const b = req.body || {};
  const required = ['parent_fullName', 'parent_email', 'studentName', 'dateOfBirth', 'requestedClass', 'level'];
  if (required.some((key) => typeof b[key] !== 'string' || !b[key].trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.parent_email || '') || !/^\d{4}-\d{2}-\d{2}$/.test(b.dateOfBirth || '')) {
    await Promise.all(Object.values(req.files || {}).flat().map((f) => fs.rm(f.path, { force: true }).catch(() => {})));
    return res.status(400).json({ error: 'Parent name, valid email, student name, date of birth, trade, and level are required.' });
  }
  if (!['L3', 'L4', 'L5'].includes(b.level)) return res.status(400).json({ error: 'Select a valid level.' });
  if (!trades.includes(b.requestedClass.trim())) return res.status(400).json({ error: 'Select a valid trade.' });
  const client = await pool.connect();
  const moved = [];
  try {
    await client.query('BEGIN');
    const referenceNumber = `BTR-${randomBytes(4).toString('hex').toUpperCase()}`;
    const inserted = await client.query(
      `INSERT INTO public_admission_requests (reference_number,parent_name,parent_email,parent_phone,parent_address,student_name,date_of_birth,gender,student_address,previous_school,requested_class,level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id,reference_number AS "referenceNumber"`,
      [referenceNumber,b.parent_fullName.trim(),b.parent_email.trim().toLowerCase(),b.parent_phone?.trim() || null,b.parent_address?.trim() || null,b.studentName.trim(),b.dateOfBirth,b.gender?.trim() || null,b.studentAddress?.trim() || null,b.previousSchool?.trim() || null,b.requestedClass.trim(),b.level]
    );
    for (const [field, records] of Object.entries(req.files || {})) {
      const type = types[field];
      for (const file of records) {
        if (field === 'studentPhoto' && file.mimetype === 'application/pdf') throw new Error('Student photo must be an image.');
        const key = `${randomUUID()}${mimeExt[file.mimetype]}`;
        await fs.mkdir(storage, { recursive: true });
        await fs.rename(file.path, path.join(storage, key));
        moved.push(path.join(storage, key));
        await client.query('INSERT INTO public_admission_documents (request_id,document_type,storage_key,original_filename,mime_type) VALUES ($1,$2,$3,$4,$5)', [inserted.rows[0].id,type,key,path.basename(file.originalname).slice(0,255),file.mimetype]);
      }
    }
    await client.query('COMMIT');
    return res.status(201).json({ referenceNumber: inserted.rows[0].referenceNumber, message: 'Application received for headteacher review.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    await Promise.all([...moved, ...Object.values(req.files || {}).flat().map((f) => f.path)].map((file) => fs.rm(file, { force: true }).catch(() => {})));
    return next(error);
  } finally { client.release(); }
});

module.exports = router;
