CREATE INDEX IF NOT EXISTS idx_job_applications_user_id
    ON job_applications (user_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_applied_date
    ON job_applications (user_id, applied_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_status
    ON job_applications (user_id, status);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
    ON refresh_tokens (expires_at);
