ALTER TABLE applications
  ADD COLUMN admission_year INTEGER;

UPDATE applications
SET admission_year = COALESCE(EXTRACT(YEAR FROM decision_at), EXTRACT(YEAR FROM submitted_at))::integer
WHERE admission_year IS NULL;

ALTER TABLE applications
  ALTER COLUMN admission_year SET NOT NULL;

ALTER TABLE applications
  ALTER COLUMN admission_year SET DEFAULT (EXTRACT(YEAR FROM CURRENT_DATE)::integer);

ALTER TABLE applications
  ADD CONSTRAINT applications_admission_year_check
  CHECK (admission_year BETWEEN 2020 AND 2100);

CREATE TABLE trade_capacities (
  id BIGSERIAL PRIMARY KEY,
  admission_year INTEGER NOT NULL CHECK (admission_year BETWEEN 2020 AND 2100),
  requested_class VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('L3', 'L4', 'L5')),
  capacity INTEGER NOT NULL CHECK (capacity >= 0 AND capacity <= 10000),
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admission_year, requested_class, level)
);
