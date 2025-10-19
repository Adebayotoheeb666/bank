-- ============================================================================
-- SUPABASE SCHEMA FOR JSM BANKING APPLICATION
-- ============================================================================
-- This file contains all required tables, indexes, triggers, functions,
-- enum types, and RLS policies for the JSM Banking app with Supabase.
-- Execute this in the Supabase SQL Editor to set up the complete schema.
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

CREATE TYPE transaction_channel AS ENUM ('online', 'offline', 'api', 'mobile');
CREATE TYPE transaction_category AS ENUM (
  'Food and Drink',
  'Travel',
  'Transfer',
  'Other'
);
CREATE TYPE account_type AS ENUM (
  'depository',
  'credit',
  'loan',
  'investment',
  'other'
);
CREATE TYPE dwolla_customer_type AS ENUM ('personal', 'business');

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================
-- Stores extended user profile information linked to auth.users

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address_1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  ssn TEXT NOT NULL UNIQUE,
  dwolla_customer_id TEXT NOT NULL UNIQUE,
  dwolla_customer_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_dwolla_customer_id ON users(dwolla_customer_id);

-- ============================================================================
-- 3. BANKS TABLE
-- ============================================================================
-- Stores bank account information linked to Plaid

CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_id TEXT NOT NULL,
  account_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  funding_source_url TEXT NOT NULL,
  shareable_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_account UNIQUE(user_id, account_id)
);

CREATE INDEX idx_banks_user_id ON banks(user_id);
CREATE INDEX idx_banks_account_id ON banks(account_id);
CREATE INDEX idx_banks_bank_id ON banks(bank_id);
CREATE INDEX idx_banks_created_at ON banks(created_at DESC);

-- ============================================================================
-- 4. TRANSACTIONS TABLE
-- ============================================================================
-- Stores inter-account transfers and transaction records

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  channel transaction_channel DEFAULT 'online',
  category transaction_category DEFAULT 'Transfer',
  sender_id TEXT NOT NULL,
  sender_bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL,
  receiver_bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_transactions_sender_bank_id ON transactions(sender_bank_id);
CREATE INDEX idx_transactions_receiver_bank_id ON transactions(receiver_bank_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_category ON transactions(category);

-- ============================================================================
-- 5. AUDIT LOG TABLE (Optional but recommended)
-- ============================================================================
-- For tracking changes to sensitive data

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 6. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER banks_updated_at_trigger
BEFORE UPDATE ON banks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. TRIGGER FOR AUDIT LOGGING (Optional but recommended)
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, changes)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      row_to_json(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, changes)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, changes)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      TG_OP,
      OLD.id,
      row_to_json(OLD)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_log_function();

CREATE TRIGGER banks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON banks
FOR EACH ROW
EXECUTE FUNCTION audit_log_function();

CREATE TRIGGER transactions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION audit_log_function();

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's total balance across all accounts
CREATE OR REPLACE FUNCTION get_user_total_balance(p_user_id UUID)
RETURNS TABLE (total_balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(CAST(b.account_id AS DECIMAL)), 0)
  FROM banks b
  WHERE b.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get total transaction amount for a bank
CREATE OR REPLACE FUNCTION get_bank_transaction_total(p_bank_id UUID)
RETURNS TABLE (total_sent DECIMAL, total_received DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(t.amount), 0) as total_sent,
    COALESCE((
      SELECT SUM(t2.amount)
      FROM transactions t2
      WHERE t2.receiver_bank_id = p_bank_id
    ), 0) as total_received
  FROM transactions t
  WHERE t.sender_bank_id = p_bank_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Banks RLS Policies
CREATE POLICY "Users can view their own banks"
  ON banks FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own banks"
  ON banks FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own banks"
  ON banks FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE user_id = auth.uid()));

-- Transactions RLS Policies
CREATE POLICY "Users can view transactions where they are sender or receiver"
  ON transactions FOR SELECT
  USING (
    sender_bank_id IN (SELECT id FROM banks WHERE user_id IN (SELECT id FROM users WHERE user_id = auth.uid()))
    OR
    receiver_bank_id IN (SELECT id FROM banks WHERE user_id IN (SELECT id FROM users WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    sender_bank_id IN (SELECT id FROM banks WHERE user_id IN (SELECT id FROM users WHERE user_id = auth.uid()))
  );

-- Audit Logs RLS Policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE user_id = auth.uid()));

CREATE POLICY "Audit logs are insert-only"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 10. DATABASE VIEWS (Optional but recommended)
-- ============================================================================

-- View for user with complete profile info
CREATE OR REPLACE VIEW user_profiles AS
SELECT
  u.id,
  u.user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.address_1,
  u.city,
  u.state,
  u.postal_code,
  u.date_of_birth,
  u.dwolla_customer_id,
  u.dwolla_customer_url,
  COUNT(b.id) as bank_count,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN banks b ON u.id = b.user_id
GROUP BY u.id;

-- View for transaction history with bank details
CREATE OR REPLACE VIEW transaction_history AS
SELECT
  t.id,
  t.name,
  t.amount,
  t.channel,
  t.category,
  sb.account_id as sender_account_id,
  rb.account_id as receiver_account_id,
  t.email,
  t.created_at
FROM transactions t
LEFT JOIN banks sb ON t.sender_bank_id = sb.id
LEFT JOIN banks rb ON t.receiver_bank_id = rb.id;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run this entire script in Supabase SQL Editor (Database > SQL)
-- 2. Ensure auth.users table exists (automatic in Supabase)
-- 3. Update RLS policies based on your authentication strategy
-- 4. Consider enabling backup and point-in-time recovery in Supabase settings
-- 5. Monitor performance with Supabase built-in monitoring tools
-- 6. Keep access tokens (from Plaid) encrypted in production
-- 7. Use Supabase Secrets for sensitive configuration values
-- ============================================================================
