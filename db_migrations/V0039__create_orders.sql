CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100),
    payment_id VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    pay_method VARCHAR(20) NOT NULL DEFAULT 'card',
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);