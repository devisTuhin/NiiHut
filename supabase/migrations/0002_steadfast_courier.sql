-- Steadfast Courier Integration Migration

-- 1. SHIPMENTS Table
-- Stores the lifecycle of a parcel delivery linked to an order.
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'steadfast', -- identifying the courier
    consignment_id TEXT UNIQUE,        -- Steadfast's ID
    tracking_code TEXT UNIQUE,         -- Public tracking code
    status TEXT,                       -- Courier specific status (e.g., 'pending', 'delivered_approval_pending')
    cod_amount DECIMAL(10, 2),         -- Amount to collect
    delivery_fee DECIMAL(10, 2),       -- Charged by courier
    label_url TEXT,                    -- URL to print label (if provided by API)
    metadata JSONB,                    -- Store full raw response or extra details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id)                   -- Ensure one shipment per order
);

-- 2. COURIER LOGS Table
-- Logs all API interactions for debugging and retry mechanisms.
CREATE TABLE IF NOT EXISTS courier_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    action TEXT NOT NULL,              -- e.g., 'create_parcel', 'check_status'
    request_payload JSONB,
    response_payload JSONB,
    status_code INTEGER,               -- HTTP Status Code
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_consignment_id ON shipments(consignment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_code ON shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_courier_logs_order_id ON courier_logs(order_id);

-- 4. Triggers for updated_at
DROP TRIGGER IF EXISTS update_shipments_modtime ON shipments;
CREATE TRIGGER update_shipments_modtime BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. RLS Policies
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_logs ENABLE ROW LEVEL SECURITY;

-- SHIPMENTS Policies
CREATE POLICY "Admins manage shipments" ON shipments 
    FOR ALL USING (
        is_admin((SELECT id FROM users WHERE clerk_id = auth.uid()::text))
    );

CREATE POLICY "Users view own shipments" ON shipments 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = shipments.order_id 
            AND orders.user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        )
    );

-- COURIER LOGS Policies
CREATE POLICY "Admins view courier logs" ON courier_logs 
    FOR SELECT USING (
        is_admin((SELECT id FROM users WHERE clerk_id = auth.uid()::text))
    );
