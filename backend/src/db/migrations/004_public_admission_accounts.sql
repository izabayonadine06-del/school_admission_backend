ALTER TABLE public_admission_requests
  ADD COLUMN parent_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL;

CREATE TABLE account_setup_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX account_setup_tokens_user_id_idx ON account_setup_tokens(user_id);
