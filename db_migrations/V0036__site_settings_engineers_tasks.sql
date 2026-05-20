CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO t_p83915249_biotech_anime_store.site_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.engineers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    specialty VARCHAR(200),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    customer VARCHAR(300),
    address VARCHAR(500),
    price NUMERIC(12,2) DEFAULT 0,
    deadline DATE,
    engineer_id INTEGER,
    status VARCHAR(50) DEFAULT 'new',
    engineer_report TEXT,
    report_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON t_p83915249_biotech_anime_store.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_engineer ON t_p83915249_biotech_anime_store.tasks(engineer_id);
