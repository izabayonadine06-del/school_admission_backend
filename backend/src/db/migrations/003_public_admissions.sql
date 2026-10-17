CREATE TABLE public_admission_requests (
  id BIGSERIAL PRIMARY KEY,
  reference_number VARCHAR(32) NOT NULL UNIQUE,
  parent_name VARCHAR(160) NOT NULL,
  parent_email VARCHAR(254) NOT NULL,
  parent_phone VARCHAR(32),
  parent_address TEXT,
  student_name VARCHAR(160) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(30),
  student_address TEXT,
  previous_school VARCHAR(200),
  requested_class VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
  reviewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  decision_comment TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX public_admission_requests_status_idx ON public_admission_requests(status, submitted_at DESC);
CREATE INDEX public_admission_requests_email_idx ON public_admission_requests(parent_email);

CREATE TABLE public_admission_documents (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES public_admission_requests(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL,
  storage_key TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
