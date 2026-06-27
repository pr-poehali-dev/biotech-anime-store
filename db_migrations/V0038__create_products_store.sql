CREATE TABLE IF NOT EXISTS products_store (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products_store (id, data)
SELECT 1, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM products_store WHERE id = 1);