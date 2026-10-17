ALTER TABLE applications
  DROP CONSTRAINT applications_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'REQUIRES_CORRECTION', 'ACCEPTED', 'REJECTED', 'CANCELLED'));
