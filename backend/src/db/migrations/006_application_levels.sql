ALTER TABLE applications ADD COLUMN level VARCHAR(20);
ALTER TABLE public_admission_requests ADD COLUMN level VARCHAR(20);

UPDATE applications SET level = 'UNSPECIFIED' WHERE level IS NULL;
UPDATE public_admission_requests SET level = 'UNSPECIFIED' WHERE level IS NULL;

ALTER TABLE applications ALTER COLUMN level SET DEFAULT 'L3';
ALTER TABLE applications ALTER COLUMN level SET NOT NULL;
ALTER TABLE public_admission_requests ALTER COLUMN level SET DEFAULT 'L3';
ALTER TABLE public_admission_requests ALTER COLUMN level SET NOT NULL;

ALTER TABLE applications ADD CONSTRAINT applications_level_check CHECK (level IN ('L3', 'L4', 'L5', 'UNSPECIFIED'));
ALTER TABLE public_admission_requests ADD CONSTRAINT public_admission_requests_level_check CHECK (level IN ('L3', 'L4', 'L5', 'UNSPECIFIED'));
