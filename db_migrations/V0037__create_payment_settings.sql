CREATE TABLE IF NOT EXISTS payment_settings (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL DEFAULT 'tbank',
    terminal_key TEXT,
    secret_key TEXT,
    is_test BOOLEAN NOT NULL DEFAULT TRUE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider)
);

INSERT INTO payment_settings (provider, is_test, enabled)
VALUES ('tbank', TRUE, FALSE)
ON CONFLICT (provider) DO NOTHING;