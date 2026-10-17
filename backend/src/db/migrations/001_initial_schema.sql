CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(32),
  address TEXT,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('PARENT', 'HEADTEACHER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  full_name VARCHAR(160) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(30),
  address TEXT,
  previous_school VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX students_parent_id_idx ON students(parent_id);

CREATE TABLE applications (
  id BIGSERIAL PRIMARY KEY,
  reference_number VARCHAR(32) NOT NULL UNIQUE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  requested_class VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'REQUIRES_CORRECTION', 'ACCEPTED', 'REJECTED')),
  reviewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  decision_comment TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX applications_student_id_idx ON applications(student_id);
CREATE INDEX applications_status_idx ON applications(status);

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL,
  storage_key TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX documents_application_id_idx ON documents(application_id);

CREATE TABLE announcements (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  conversation_id UUID NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id, sent_at);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(60) NOT NULL,
  message TEXT NOT NULL,
  related_record_type VARCHAR(60),
  related_record_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX notifications_recipient_unread_idx ON notifications(recipient_id, read_at);

CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX activity_logs_created_at_idx ON activity_logs(created_at DESC);