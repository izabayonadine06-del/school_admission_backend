const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { logActivity } = require('../utils/audit');

const router = express.Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STORAGE_DIRECTORY = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '../../storage/documents')
);
const TEMP_DIRECTORY = path.join(STORAGE_DIRECTORY, '.tmp');
const DOCUMENT_TYPES = new Set([
  'BIRTH_CERTIFICATE',
  'STUDENT_PHOTO',
  'PREVIOUS_SCHOOL_REPORT',
  'TRANSFER_DOCUMENT',
  'NATIONAL_EXAM_RESULT',
  'OTHER'
]);
const fileExtensions = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png'
};
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(TEMP_DIRECTORY, { recursive: true })
        .then(() => callback(null, TEMP_DIRECTORY))
        .catch(callback);
    },
    filename(req, file, callback) {
      callback(null, `${randomUUID()}.upload`);
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 1, parts: 3 }
});

router.use(requireAuth);

function detectMimeType(header) {
  if (header.length >= 5 && header.subarray(0, 5).equals(Buffer.from('%PDF-'))) return 'application/pdf';
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg';
  if (header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  return null;
}

async function detectFileMimeType(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const header = Buffer.alloc(8);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    return detectMimeType(header.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

async function removeTemporaryFile(file) {
  if (file?.path) await fs.rm(file.path, { force: true }).catch(() => {});
}

async function rejectUpload(file, res, status, message) {
  await removeTemporaryFile(file);
  return res.status(status).json({ error: message });
}

async function canAccessApplication(applicationId, user) {
  const result = await pool.query(
    `SELECT a.id, a.status
     FROM applications a JOIN students s ON s.id = a.student_id
     WHERE a.id = $1 AND ($2::text = 'HEADTEACHER' OR s.parent_id = $3)`,
    [applicationId, user.role, user.id]
  );
  return result.rows[0] || null;
}

router.get('/applications/:applicationId/documents', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.applicationId)) return res.status(400).json({ error: 'Invalid application id' });
  try {
    const application = await canAccessApplication(req.params.applicationId, req.user);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    const result = await pool.query(
      `SELECT id, document_type AS "documentType", original_filename AS "originalFilename",
              mime_type AS "mimeType", verification_status AS "verificationStatus",
              uploaded_at AS "uploadedAt"
       FROM documents WHERE application_id = $1 ORDER BY uploaded_at DESC`,
      [req.params.applicationId]
    );
    return res.json({ documents: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/applications/:applicationId/documents', requireRole('PARENT'), upload.single('file'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.applicationId)) return rejectUpload(req.file, res, 400, 'Invalid application id');
  if (!req.file) return res.status(400).json({ error: 'Upload one file using the file field' });
  const documentType = typeof req.body?.documentType === 'string' ? req.body.documentType.toUpperCase() : '';
  if (!DOCUMENT_TYPES.has(documentType)) {
    return rejectUpload(req.file, res, 400, 'documentType must be BIRTH_CERTIFICATE, STUDENT_PHOTO, PREVIOUS_SCHOOL_REPORT, TRANSFER_DOCUMENT, NATIONAL_EXAM_RESULT, or OTHER');
  }

  let storageKey;
  let finalPath;
  try {
    const detectedMimeType = await detectFileMimeType(req.file.path);
    if (!detectedMimeType || detectedMimeType !== req.file.mimetype || (documentType === 'STUDENT_PHOTO' && detectedMimeType === 'application/pdf')) {
      return rejectUpload(req.file, res, 400, 'Only valid PDF, JPEG, and PNG files are accepted; student photos must be images');
    }

    const application = await canAccessApplication(req.params.applicationId, req.user);
    if (!application) return rejectUpload(req.file, res, 404, 'Application not found');
    if (!['PENDING', 'REQUIRES_CORRECTION'].includes(application.status)) {
      return rejectUpload(req.file, res, 409, 'Documents can only be uploaded while an application is pending or requires correction.');
    }

    storageKey = `${randomUUID()}${fileExtensions[detectedMimeType]}`;
    finalPath = path.join(STORAGE_DIRECTORY, storageKey);
    await fs.rename(req.file.path, finalPath);

    const originalFilename = path.basename(path.win32.basename(req.file.originalname))
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .slice(0, 255) || 'uploaded-document';
    const result = await pool.query(
      `INSERT INTO documents (application_id, document_type, storage_key, original_filename, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, application_id AS "applicationId", document_type AS "documentType",
                 original_filename AS "originalFilename", mime_type AS "mimeType",
                 verification_status AS "verificationStatus", uploaded_at AS "uploadedAt"`,
      [req.params.applicationId, documentType, storageKey, originalFilename, detectedMimeType]
    );
    await logActivity(pool, req.user.id, 'DOCUMENT_UPLOADED', 'DOCUMENT', result.rows[0].id, { documentType });
    return res.status(201).json({ document: result.rows[0] });
  } catch (error) {
    await removeTemporaryFile(req.file);
    if (finalPath) await fs.rm(finalPath, { force: true }).catch(() => {});
    return next(error);
  }
});

router.put('/applications/:applicationId/documents/:documentId', requireRole('PARENT'), upload.single('file'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.applicationId) || !/^[1-9]\d*$/.test(req.params.documentId)) return rejectUpload(req.file, res, 400, 'Invalid document identifier');
  if (!req.file) return res.status(400).json({ error: 'Choose a replacement file.' });
  let replacementPath;
  try {
    const application = await canAccessApplication(req.params.applicationId, req.user);
    if (!application) return rejectUpload(req.file, res, 404, 'Application not found');
    if (!['PENDING', 'REQUIRES_CORRECTION'].includes(application.status)) return rejectUpload(req.file, res, 409, 'Documents can only be updated while an application is pending or requires correction.');
    const existing = await pool.query(
      `SELECT id, storage_key, document_type FROM documents WHERE id = $1 AND application_id = $2`,
      [req.params.documentId, req.params.applicationId]
    );
    if (!existing.rowCount) return rejectUpload(req.file, res, 404, 'Document not found for this application.');
    const detectedMimeType = await detectFileMimeType(req.file.path);
    if (!detectedMimeType || detectedMimeType !== req.file.mimetype || (detectedMimeType === 'application/pdf' && existing.rows[0].document_type === 'STUDENT_PHOTO')) {
      return rejectUpload(req.file, res, 400, 'Only valid PDF, JPEG, and PNG files are accepted; student photos must be images.');
    }
    const extension = fileExtensions[detectedMimeType];
    const storageKey = `${randomUUID()}${extension}`;
    replacementPath = path.join(STORAGE_DIRECTORY, storageKey);
    await fs.rename(req.file.path, replacementPath);
    const originalFilename = path.basename(path.win32.basename(req.file.originalname))
      .replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255) || 'uploaded-document';
    const updated = await pool.query(
      `UPDATE documents SET storage_key = $1, original_filename = $2, mime_type = $3,
                            verification_status = 'PENDING', uploaded_at = NOW()
       WHERE id = $4 AND application_id = $5
       RETURNING id, application_id AS "applicationId", document_type AS "documentType",
                 original_filename AS "originalFilename", mime_type AS "mimeType",
                 verification_status AS "verificationStatus", uploaded_at AS "uploadedAt"`,
      [storageKey, originalFilename, detectedMimeType, req.params.documentId, req.params.applicationId]
    );
    const sharedPublicFile = await pool.query('SELECT 1 FROM public_admission_documents WHERE storage_key = $1 LIMIT 1', [existing.rows[0].storage_key]);
    if (!sharedPublicFile.rowCount) await fs.rm(path.join(STORAGE_DIRECTORY, existing.rows[0].storage_key), { force: true }).catch(() => {});
    await logActivity(pool, req.user.id, 'DOCUMENT_REPLACED', 'DOCUMENT', req.params.documentId, { applicationId: Number(req.params.applicationId) });
    return res.json({ document: updated.rows[0] });
  } catch (error) {
    await removeTemporaryFile(req.file);
    if (replacementPath) await fs.rm(replacementPath, { force: true }).catch(() => {});
    return next(error);
  }
});

router.get('/documents/:id/download', async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid document id' });
  try {
    const result = await pool.query(
      `SELECT d.storage_key, d.original_filename
       FROM documents d
       JOIN applications a ON a.id = d.application_id
       JOIN students s ON s.id = a.student_id
       WHERE d.id = $1 AND ($2::text = 'HEADTEACHER' OR s.parent_id = $3)`,
      [req.params.id, req.user.role, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Document not found' });

    const storageKey = result.rows[0].storage_key;
    if (!/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(storageKey)) {
      return res.status(500).json({ error: 'Document storage record is invalid' });
    }
    const filePath = path.resolve(STORAGE_DIRECTORY, storageKey);
    if (!filePath.startsWith(`${STORAGE_DIRECTORY}${path.sep}`)) {
      return res.status(500).json({ error: 'Document storage record is invalid' });
    }
    await fs.access(filePath);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.download(filePath, result.rows[0].original_filename, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'Document file not found' });
    return next(error);
  }
});

router.patch('/documents/:id/verification', requireRole('HEADTEACHER'), async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid document id' });
  const status = typeof req.body?.status === 'string' ? req.body.status.toUpperCase() : '';
  if (!['VERIFIED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'status must be VERIFIED or REJECTED' });

  try {
    const result = await pool.query(
      `UPDATE documents SET verification_status = $1
       WHERE id = $2
       RETURNING id, verification_status AS "verificationStatus"`,
      [status, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Document not found' });
    await logActivity(pool, req.user.id, 'DOCUMENT_VERIFICATION_CHANGED', 'DOCUMENT', req.params.id, { status });
    return res.json({ document: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
