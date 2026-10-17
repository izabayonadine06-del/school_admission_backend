# School Admission API

Node.js and Express backend using PostgreSQL through the `pg` connection pool.

## Requirements

- Node.js 22 or newer
- PostgreSQL 13 or newer, running locally or remotely

## Configure and start

1. Install and start PostgreSQL.
2. Copy `.env.example` to `.env`.
3. In `.env`, replace `your_password` in `DATABASE_URL` with the password you chose for PostgreSQL. Keep `.env` private.
4. Run `npm.cmd run db:setup` from this folder. It creates `school_admission` if needed and applies the initial schema migration.
5. Run `npm.cmd run admin:create` in an interactive terminal to create the headteacher account. The password prompt is hidden.
6. Run `npm.cmd run dev` for development, or `npm.cmd start`.
7. Open `http://localhost:3000/api/health`; a healthy response includes `"database":"connected"`.

The initial migration creates users, sessions, students, applications, documents, announcements, messages, notifications, and activity logs. Public registration can only create parent accounts. Headteacher accounts are provisioned with the CLI command.

## API routes

All routes except health and parent registration/login require `Authorization: Bearer <token>`.

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/auth/me`, `PATCH /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/logout`
- `GET /api/students`, `GET /api/students/:id`, `POST /api/students`, `PATCH /api/students/:id` (parent only)
- `GET /api/applications` (parents see their own; headteachers can filter by status, name, class, and date)
- `POST /api/applications`, `POST /api/applications/:id/resubmit` (parent only)
- `GET /api/applications/:id` (parent owner or headteacher)
- `PATCH /api/applications/:id/status` (headteacher only)
- `GET /api/applications/:id/documents` (parent owner or headteacher)
- `POST /api/applications/:id/documents` (parent owner; multipart field `file` and `documentType`)
- `GET /api/documents/:id/download` (parent owner or headteacher)
- `PATCH /api/documents/:id/verification` (headteacher only)
- `GET /api/announcements` (parents see published items; headteachers see all)
- `POST /api/announcements`, `PATCH /api/announcements/:id`, `PATCH /api/announcements/:id/publish` (headteacher only)
- `GET /api/notifications`, `PATCH /api/notifications/:id/read` (own notifications only)
- `GET /api/messages`, `GET /api/messages/:conversationId` (own conversations only)
- `POST /api/messages` (parent starts a conversation with the headteacher)
- `POST /api/messages/:conversationId` (conversation participants reply)
- `GET /api/admin/dashboard`, `/api/admin/parents`, `/api/admin/students`, `/api/admin/reports/admissions` (headteacher only)
- `POST /api/admin/notifications` (headteacher sends to all student parents or selected student parents)
- `GET /api/health`

Uploaded PDF, JPEG, and PNG files are limited to 10 MB and stored outside the public web directory in `storage/documents` by default. `UPLOAD_DIR` can point to another private storage path. `CORS_ORIGIN` controls which browser origin can call the API; it defaults to `http://localhost:5173` for a React development server.

The database migrations have been applied. Start the API with `npm.cmd run dev` from this folder.
### Parent email for discipline notices

Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, and MAIL_FROM in the private .env file to enable email delivery. The parent notification is saved in the portal even when SMTP is not configured or email delivery fails.
