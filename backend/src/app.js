const express = require('express');
const authRoutes = require('./routes/auth.routes');
const applicationsRoutes = require('./routes/applications.routes');
const announcementsRoutes = require('./routes/announcements.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const messagesRoutes = require('./routes/messages.routes');
const documentsRoutes = require('./routes/documents.routes');
const adminRoutes = require('./routes/admin.routes');
const cors = require('./middleware/cors.middleware');
const healthRoutes = require('./routes/health.routes');
const studentsRoutes = require('./routes/students.routes');
const publicAdmissionsRoutes = require('./routes/public-admissions.routes');
const capacitiesRoutes = require('./routes/capacities.routes');

const app = express();

app.use(cors);
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public-admissions', publicAdmissionsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/capacities', capacitiesRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api', documentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large (10 MB maximum)' : 'Invalid file upload' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must contain valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

