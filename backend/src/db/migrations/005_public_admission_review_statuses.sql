ALTER TABLE public_admission_requests
  DROP CONSTRAINT public_admission_requests_status_check;

ALTER TABLE public_admission_requests
  ADD CONSTRAINT public_admission_requests_status_check
  CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'REQUIRES_CORRECTION', 'ACCEPTED', 'REJECTED'));
