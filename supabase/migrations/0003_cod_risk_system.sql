-- COD Risk & Fraud Prevention System Migration

-- 1. RISK RULES Table
CREATE TABLE IF NOT EXISTS risk_rules (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default rules
INSERT INTO risk_rules (key, value, description) VALUES
('high_value_threshold', '5000', 'Order amount that triggers high value flag'),
('max_daily_orders', '3', 'Max pending orders allowed per day'),
('risk_threshold_flag', '30', 'Score above which order is flagged for review'),
('risk_threshold_block', '70', 'Score above which order is auto-cancelled/blocked'),
('new_user_penalty', '10', 'Risk points for accounts < 24h old'),
('cancellation_rate_threshold', '0.2', 'Ratio of refused/returned orders to trigger penalty');

-- 2. BLOCKED ENTRIES Table (Unified Blacklist)
CREATE TABLE IF NOT EXISTS blocked_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('phone', 'user_id', 'address_keyword', 'ip')),
    value TEXT NOT NULL,
    reason TEXT,
    severity TEXT DEFAULT 'hard_block' CHECK (severity IN ('hard_block', 'flag_only')), 
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_entries_value ON blocked_entries(value);
CREATE INDEX idx_blocked_entries_type ON blocked_entries(type);

-- 3. ORDER RISK ASSESSMENTS Table
CREATE TABLE IF NOT EXISTS order_risk_assessments (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    risk_score INTEGER DEFAULT 0,
    factors JSONB, -- Stores array of { factor: string, points: number }
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MODIFY USERS Table (Stats Tracking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS delivered_orders INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refused_orders INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS returned_orders INTEGER DEFAULT 0;

-- 5. MODIFY ORDERS Table (Status)
-- Update the check constraint to include 'refused' and 'flagged_for_review'
-- Postgres doesn't allow easy modification of check constraints, so we drop and re-add.
DO $$ 
BEGIN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'pending_confirmation', 'flagged_for_review', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refused'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 6. RLS POLICIES

-- Enable RLS
ALTER TABLE risk_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RISK RULES (Admin Only)
CREATE POLICY "Admins manage risk rules" ON risk_rules USING (is_admin((SELECT id FROM users WHERE clerk_id = auth.uid()::text)));

-- BLOCKED ENTRIES (Admin Only)
CREATE POLICY "Admins manage blocked entries" ON blocked_entries USING (is_admin((SELECT id FROM users WHERE clerk_id = auth.uid()::text)));

-- ORDER RISK ASSESSMENTS (Admin Only)
CREATE POLICY "Admins view risk assessments" ON order_risk_assessments USING (is_admin((SELECT id FROM users WHERE clerk_id = auth.uid()::text)));

-- TRIGGERS for updated_at
CREATE TRIGGER update_risk_rules_modtime BEFORE UPDATE ON risk_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
