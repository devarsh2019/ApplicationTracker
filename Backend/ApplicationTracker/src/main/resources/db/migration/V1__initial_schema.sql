CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    terms_accepted BOOLEAN NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id),
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id),
    company_name VARCHAR(255) NOT NULL,
    applied_date DATE NOT NULL,
    company_link VARCHAR(2048),
    contact_follow_up VARCHAR(1000),
    status VARCHAR(32) NOT NULL DEFAULT 'UNDER_CONSIDERATION',
    notes VARCHAR(2000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
