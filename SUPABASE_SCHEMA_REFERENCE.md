# Supabase Schema Reference

Complete technical reference for all tables, functions, triggers, and types in the JSM Banking application.

---

## Enum Types

### 1. `transaction_channel`
Represents the channel through which a transaction occurs.

```sql
CREATE TYPE transaction_channel AS ENUM (
  'online',    -- Web/app-based transfer
  'offline',   -- In-person transfer
  'api',       -- Programmatic transfer
  'mobile'     -- Mobile app transfer
);
```

**Usage**: `transactions.channel` column

---

### 2. `transaction_category`
Categorizes transactions by type.

```sql
CREATE TYPE transaction_category AS ENUM (
  'Food and Drink',
  'Travel',
  'Transfer',
  'Other'
);
```

**Usage**: `transactions.category` column  
**Default**: `'Transfer'`

---

### 3. `account_type`
Represents Plaid account types.

```sql
CREATE TYPE account_type AS ENUM (
  'depository',  -- Checking/savings account
  'credit',      -- Credit card
  'loan',        -- Loan account
  'investment',  -- Investment account
  'other'        -- Other types
);
```

**Usage**: Stored in application layer (not yet used in schema)

---

### 4. `dwolla_customer_type`
Represents Dwolla customer classification.

```sql
CREATE TYPE dwolla_customer_type AS ENUM (
  'personal',   -- Individual customer
  'business'    -- Business customer
);
```

**Usage**: Stored in application layer (tracked in `users.dwolla_customer_id`)

---

## Tables

### 1. `users`
Extended user profile linked to Supabase Auth.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal record ID |
| `user_id` | UUID | UNIQUE, REFERENCES auth.users(id) | Supabase Auth user ID |
| `email` | TEXT | NOT NULL | User email (validated) |
| `first_name` | TEXT | NOT NULL | User's first name |
| `last_name` | TEXT | NOT NULL | User's last name |
| `address_1` | TEXT | NOT NULL | Street address |
| `city` | TEXT | NOT NULL | City of residence |
| `state` | TEXT | NOT NULL | State/province |
| `postal_code` | TEXT | NOT NULL | ZIP/postal code |
| `date_of_birth` | TEXT | NOT NULL | DOB (YYYY-MM-DD format) |
| `ssn` | TEXT | NOT NULL, UNIQUE | Social Security Number (encrypted recommended) |
| `dwolla_customer_id` | TEXT | NOT NULL, UNIQUE | Dwolla customer identifier |
| `dwolla_customer_url` | TEXT | NOT NULL, UNIQUE | Dwolla API endpoint URL |
| `created_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_users_user_id` on `user_id` (UNIQUE, for fast auth lookups)
- `idx_users_email` on `email` (for duplicate detection)
- `idx_users_dwolla_customer_id` on `dwolla_customer_id` (for Dwolla operations)

**Triggers:**
- `users_updated_at_trigger` - Auto-updates `updated_at` timestamp
- `users_audit_trigger` - Logs all changes to `audit_logs`

**Relationships:**
- `user_id` → `auth.users.id` (One Supabase user per record)
- One-to-Many with `banks` table (user can have multiple bank accounts)

**RLS Policies:**
- SELECT: User can only view their own record
- UPDATE: User can only update their own record
- INSERT: Only authenticated users

---

### 2. `banks`
Bank account information from Plaid integration.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal record ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) | Links to user |
| `bank_id` | TEXT | NOT NULL | Plaid item ID |
| `account_id` | TEXT | NOT NULL, UNIQUE | Plaid account ID |
| `access_token` | TEXT | NOT NULL | Plaid access token (encrypted recommended) |
| `funding_source_url` | TEXT | NOT NULL | Dwolla funding source endpoint |
| `shareable_id` | TEXT | NOT NULL, UNIQUE | Encrypted account ID for sharing |
| `created_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | Last update time |

**Unique Constraints:**
- `UNIQUE(user_id, account_id)` - User can't link same account twice

**Indexes:**
- `idx_banks_user_id` on `user_id` (find all user accounts)
- `idx_banks_account_id` on `account_id` (fast lookup by Plaid ID)
- `idx_banks_bank_id` on `bank_id` (Plaid item tracking)
- `idx_banks_created_at` on `created_at DESC` (recent accounts first)

**Triggers:**
- `banks_updated_at_trigger` - Auto-updates `updated_at` timestamp
- `banks_audit_trigger` - Logs all changes to `audit_logs`

**Relationships:**
- `user_id` → `users.id` (Many banks per user)
- One-to-Many with `transactions` table (as sender or receiver)

**RLS Policies:**
- SELECT: User can only view their own banks
- INSERT: User can only create banks for themselves
- UPDATE: User can only update their own banks

---

### 3. `transactions`
Inter-account transfers between users.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal record ID |
| `name` | TEXT | NOT NULL | Transaction description |
| `amount` | DECIMAL(15,2) | NOT NULL, CHECK > 0 | Transfer amount (USD) |
| `channel` | transaction_channel | DEFAULT 'online' | How transfer occurred |
| `category` | transaction_category | DEFAULT 'Transfer' | Transaction category |
| `sender_id` | TEXT | NOT NULL | Dwolla customer ID of sender |
| `sender_bank_id` | UUID | NOT NULL, REFERENCES banks(id) | Sender's bank account |
| `receiver_id` | TEXT | NOT NULL | Dwolla customer ID of receiver |
| `receiver_bank_id` | UUID | NOT NULL, REFERENCES banks(id) | Receiver's bank account |
| `email` | TEXT | NOT NULL | Contact email (validated) |
| `created_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | Transaction timestamp |

**Constraints:**
- `amount > 0` - No negative/zero transfers
- Valid email format validation

**Indexes:**
- `idx_transactions_sender_bank_id` on `sender_bank_id` (find sent transactions)
- `idx_transactions_receiver_bank_id` on `receiver_bank_id` (find received transactions)
- `idx_transactions_created_at` on `created_at DESC` (recent first)
- `idx_transactions_category` on `category` (filter by type)

**Triggers:**
- `transactions_audit_trigger` - Logs all changes to `audit_logs`

**Relationships:**
- `sender_bank_id` → `banks.id` (transaction has sender bank)
- `receiver_bank_id` → `banks.id` (transaction has receiver bank)

**RLS Policies:**
- SELECT: User can view transactions where they're sender OR receiver
- INSERT: User can only create if they own the sender bank

---

### 4. `audit_logs`
Audit trail for all database changes (recommended for compliance).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Log entry ID |
| `user_id` | UUID | REFERENCES users(id) ON DELETE SET NULL | Who made the change |
| `table_name` | TEXT | NOT NULL | Table that was changed |
| `operation` | TEXT | NOT NULL | INSERT, UPDATE, or DELETE |
| `record_id` | UUID | | ID of affected record |
| `changes` | JSONB | | Old/new values (JSON) |
| `created_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | When change occurred |

**Indexes:**
- `idx_audit_logs_user_id` on `user_id` (find user's changes)
- `idx_audit_logs_table_name` on `table_name` (find changes to table)
- `idx_audit_logs_created_at` on `created_at DESC` (recent changes first)

**Triggers:**
- Auto-populated by `audit_log_function()` trigger on users, banks, transactions

**RLS Policies:**
- SELECT: User can only view their own audit logs
- INSERT: Only the audit trigger can insert (system-level)

---

## Functions

### 1. `update_updated_at_column()`
Automatically updates the `updated_at` timestamp on INSERT or UPDATE.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Used by:**
- `users_updated_at_trigger`
- `banks_updated_at_trigger`

**Parameters:** None (trigger-based)

**Returns:** Updated row with new timestamp

---

### 2. `audit_log_function()`
Logs all INSERT, UPDATE, and DELETE operations to `audit_logs`.

```sql
CREATE OR REPLACE FUNCTION audit_log_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, changes)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, changes)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, 
            jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, changes)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Used by:**
- `users_audit_trigger`
- `banks_audit_trigger`
- `transactions_audit_trigger`

**Parameters:** None (trigger-based)

**Returns:** NULL (audit logging only)

---

### 3. `get_user_total_balance(p_user_id UUID)`
Calculates total balance across all user's bank accounts.

```sql
CREATE OR REPLACE FUNCTION get_user_total_balance(p_user_id UUID)
RETURNS TABLE (total_balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(CAST(b.account_id AS DECIMAL)), 0)
  FROM banks b
  WHERE b.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

**Parameters:**
- `p_user_id` - UUID of the user

**Returns:** Table with single column `total_balance` (DECIMAL)

**Example Usage:**
```sql
SELECT * FROM get_user_total_balance('550e8400-e29b-41d4-a716-446655440000');
```

**Note:** Currently sums `account_id` as balance (should integrate with Plaid API)

---

### 4. `get_bank_transaction_total(p_bank_id UUID)`
Calculates total sent and received amounts for a bank account.

```sql
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
```

**Parameters:**
- `p_bank_id` - UUID of the bank account

**Returns:** Table with columns `total_sent` and `total_received` (both DECIMAL)

**Example Usage:**
```sql
SELECT * FROM get_bank_transaction_total('550e8400-e29b-41d4-a716-446655440000');
```

---

## Triggers

### 1. `users_updated_at_trigger`
```sql
CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Event:** BEFORE UPDATE on `users`  
**Function:** `update_updated_at_column()`  
**Effect:** Automatically sets `updated_at = NOW()`

---

### 2. `banks_updated_at_trigger`
```sql
CREATE TRIGGER banks_updated_at_trigger
BEFORE UPDATE ON banks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Event:** BEFORE UPDATE on `banks`  
**Function:** `update_updated_at_column()`  
**Effect:** Automatically sets `updated_at = NOW()`

---

### 3. `users_audit_trigger`
```sql
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_log_function();
```

**Event:** AFTER INSERT, UPDATE, or DELETE on `users`  
**Function:** `audit_log_function()`  
**Effect:** Records all changes to `audit_logs` table

---

### 4. `banks_audit_trigger`
```sql
CREATE TRIGGER banks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON banks
FOR EACH ROW
EXECUTE FUNCTION audit_log_function();
```

**Event:** AFTER INSERT, UPDATE, or DELETE on `banks`  
**Function:** `audit_log_function()`  
**Effect:** Records all changes to `audit_logs` table

---

### 5. `transactions_audit_trigger`
```sql
CREATE TRIGGER transactions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION audit_log_function();
```

**Event:** AFTER INSERT, UPDATE, or DELETE on `transactions`  
**Function:** `audit_log_function()`  
**Effect:** Records all changes to `audit_logs` table

---

## Views

### 1. `user_profiles`
Complete user profile with bank account count.

```sql
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
```

**Columns:**
- All user profile fields
- `bank_count` - Number of linked bank accounts

**Usage:**
```sql
SELECT * FROM user_profiles WHERE user_id = auth.uid();
```

---

### 2. `transaction_history`
Transaction history with linked account information.

```sql
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
```

**Columns:**
- All transaction fields
- `sender_account_id` - Plaid account ID of sender
- `receiver_account_id` - Plaid account ID of receiver

**Usage:**
```sql
SELECT * FROM transaction_history 
WHERE sender_account_id IN (
  SELECT account_id FROM banks 
  WHERE user_id IN (SELECT id FROM users WHERE user_id = auth.uid())
)
ORDER BY created_at DESC;
```

---

## Row-Level Security (RLS) Policies

All tables have RLS enabled. Policies enforce user-level access control.

### `users` Table Policies

| Policy Name | Type | Condition |
|-------------|------|-----------|
| `Users can view their own profile` | SELECT | `auth.uid() = user_id` |
| `Users can update their own profile` | UPDATE | `auth.uid() = user_id` |
| `Only admins can insert users` | INSERT | `auth.role() = 'authenticated'` |

### `banks` Table Policies

| Policy Name | Type | Condition |
|-------------|------|-----------|
| `Users can view their own banks` | SELECT | User is owner |
| `Users can insert their own banks` | INSERT | User is owner |
| `Users can update their own banks` | UPDATE | User is owner |

### `transactions` Table Policies

| Policy Name | Type | Condition |
|-------------|------|-----------|
| `Users can view transactions` | SELECT | User is sender OR receiver |
| `Users can create transactions` | INSERT | User owns sender bank |

### `audit_logs` Table Policies

| Policy Name | Type | Condition |
|-------------|------|-----------|
| `Users can view own audit logs` | SELECT | `user_id` matches current user |
| `Audit logs are insert-only` | INSERT | Always allowed (system-level) |

---

## Constraints & Validations

### Email Validation
Applied to `users.email` and `transactions.email`:
```sql
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
```

### Amount Validation
Applied to `transactions.amount`:
```sql
CHECK (amount > 0)
```

### Referential Integrity
- `banks.user_id` → `users.id` (ON DELETE CASCADE)
- `transactions.sender_bank_id` → `banks.id` (ON DELETE CASCADE)
- `transactions.receiver_bank_id` → `banks.id` (ON DELETE CASCADE)
- `audit_logs.user_id` → `users.id` (ON DELETE SET NULL)

---

## Performance Considerations

### Recommended Indexes (Already Created)
- Primary keys (automatic)
- Foreign keys for joins
- Frequently filtered columns (user_id, created_at)
- Unique constraints (for fast lookups)

### Query Optimization Tips
1. Always filter by `user_id` first (RLS policy)
2. Use `created_at DESC` for recent records
3. Avoid SELECT * on large tables
4. Use views for complex queries

### Monitoring
- Check index usage: `SELECT * FROM pg_stat_user_indexes`
- Monitor slow queries: Supabase dashboard Analytics
- Set up alerts for table growth

