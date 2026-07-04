CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id),
    title VARCHAR(200) NOT NULL,
    notes VARCHAR(2000),
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    event_type VARCHAR(32) NOT NULL DEFAULT 'OTHER',
    application_id UUID REFERENCES job_applications (id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_starts_at
    ON calendar_events (user_id, starts_at);
