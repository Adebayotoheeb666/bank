# Supabase Requirements Checklist for JSM Banking App

## Executive Summary

This checklist outlines **all** requirements for connecting the JSM Banking application to Supabase. It covers:
- ✅ 4 Database tables
- ✅ 4 PostgreSQL functions
- ✅ 5 Triggers
- ✅ 4 Enum types
- ✅ 2 Database views
- ✅ 16 RLS policies
- ✅ Authentication configuration
- ✅ Environment setup

**Total Setup Time:** ~30-45 minutes

---

## Part 1: Supabase Project Setup

### Project Creation
- [ ] Create new Supabase project
- [ ] Select appropriate region (closest to users)
- [ ] Set strong database password
- [ ] Wait for project initialization (5-10 minutes)
- [ ] Project URL available in Settings > API

### API Keys & Credentials
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL` from Project Settings > API
- [ ] Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, safe to expose)
- [ ] Copy `NEXT_SUPABASE_SERVICE_ROLE_KEY` (SECRET - keep private!)
- [ ] Store all three in `.env.local` file
- [ ] Verify `.env.local` is in `.gitignore`

**Reference:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## Part 2: Database Schema

### Enum Types
- [ ] `transaction_channel` (online, offline, api, mobile)
- [ ] `transaction_category` (Food and Drink, Travel, Transfer, Other)
- [ ] `account_type` (depository, credit, loan, investment, other)
- [ ] `dwolla_customer_type` (personal, business)

**Verification:** Run in SQL Editor:
```sql
SELECT * FROM pg_type WHERE typname LIKE 'transaction_%' OR typname LIKE 'dwolla_%';
```

### Tables (4 Total)

#### Table 1: `users`
- [ ] Column: `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- [ ] Column: `user_id` (UUID, UNIQUE, REFERENCES auth.users(id))
- [ ] Column: `email` (TEXT, NOT NULL, validated)
- [ ] Column: `first_name` (TEXT, NOT NULL)
- [ ] Column: `last_name` (TEXT, NOT NULL)
- [ ] Column: `address_1` (TEXT, NOT NULL)
- [ ] Column: `city` (TEXT, NOT NULL)
- [ ] Column: `state` (TEXT, NOT NULL)
- [ ] Column: `postal_code` (TEXT, NOT NULL)
- [ ] Column: `date_of_birth` (TEXT, NOT NULL)
- [ ] Column: `ssn` (TEXT, NOT NULL, UNIQUE)
- [ ] Column: `dwolla_customer_id` (TEXT, NOT NULL, UNIQUE)
- [ ] Column: `dwolla_customer_url` (TEXT, NOT NULL, UNIQUE)
- [ ] Column: `created_at` (TIMESTAMP WITH TZ, DEFAULT NOW())
- [ ] Column: `updated_at` (TIMESTAMP WITH TZ, DEFAULT NOW())
- [ ] Index: `idx_users_user_id`
- [ ] Index: `idx_users_email`
- [ ] Index: `idx_users_dwolla_customer_id`
- [ ] RLS: ENABLE ROW LEVEL SECURITY
- [ ] Policy: Users can view their own profile (SELECT)
- [ ] Policy: Users can update their own profile (UPDATE)
- [ ] Policy: Only admins can insert users (INSERT)

**Verification:** Table exists and queryable
```sql
SELECT * FROM users LIMIT 1;
```

#### Table 2: `banks`
- [ ] Column: `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- [ ] Column: `user_id` (UUID, NOT NULL, REFERENCES users(id) ON DELETE CASCADE)
- [ ] Column: `bank_id` (TEXT, NOT NULL)
- [ ] Column: `account_id` (TEXT, NOT NULL, UNIQUE)
- [ ] Column: `access_token` (TEXT, NOT NULL)
- [ ] Column: `funding_source_url` (TEXT, NOT NULL)
- [ ] Column: `shareable_id` (TEXT, NOT NULL, UNIQUE)
- [ ] Column: `created_at` (TIMESTAMP WITH TZ, DEFAULT NOW())
- [ ] Column: `updated_at` (TIMESTAMP WITH TZ, DEFAULT NOW())
- [ ] Constraint: UNIQUE(user_id, account_id)
- [ ] Index: `idx_banks_user_id`
- [ ] Index: `idx_banks_account_id`
- [ ] Index: `idx_banks_bank_id`
- [ ] Index: `idx_banks_created_at`
- [ ] RLS: ENABLE ROW LEVEL SECURITY
- [ ] Policy: Users can view their own banks (SELECT)
- [ ] Policy: Users can insert their own banks (INSERT)
- [ ] Policy: Users can update their own banks (UPDATE)

**Verification:**
```sql
SELECT COUNT(*) FROM banks;
```

#### Table 3: `transactions`
- [ ] Column: `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- [ ] Column: `name` (TEXT, NOT NULL)
- [ ] Column: `amount` (DECIMAL(15,2), NOT NULL, CHECK > 0)
- [ ] Column: `channel` (transaction_channel, DEFAULT 'online')
- [ ] Column: `category` (transaction_category, DEFAULT 'Transfer')
- [ ] Column: `sender_id` (TEXT, NOT NULL)
- [ ] Column: `sender_bank_id` (UUID, NOT NULL, REFERENCES banks(id) ON DELETE CASCADE)
- [ ] Column: `receiver_id` (TEXT, NOT NULL)
- [ ] Column: `receiver_bank_id` (UUID, NOT NULL, REFERENCES banks(id) ON DELETE CASCADE)
- [ ] Column: `email` (TEXT, NOT NULL, validated)
- [ ] Column: `created_at` (TIMESTAMP WITH TZ, DEFAULT NOW())
- [ ] Index: `idx_transactions_sender_bank_id`
- [ ] Index: `idx_transactions_receiver_bank_id`
- [ ] Index: `idx_transactions_created_at`
- [ ] Index: `idx_transactions_category`
- [ ] RLS: ENABLE ROW LEVEL SECURITY
- [ ] Policy: Users can view transactions where they are sender or receiver (SELECT)
- [ ] Policy: Users can create transactions (INSERT)

**Verification:**
```sql
SELECT COUNT(*) FROM transactions;
```

#### Table 4: `audit_logs` (Optional but Recommended)
- [ ] Column: `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- [ ] Column: `user_id` (UUID, REFERENCES users(id) ON DELETE SET NULL)
- [ ] Column: `table_name` (TEXT, NOT NULL)
- [ ] Column: `operation` (TEXT, NOT NULL)
- [ ] Column: `record_id` (UUID)
- [ ] Column: `changes` (JSONB)
- [ ] Column: `created_at` (TIMESTAMP WITH TZ, DEFAULT NOW())
- [ ] Index: `idx_audit_logs_user_id`
- [ ] Index: `idx_audit_logs_table_name`
- [ ] Index: `idx_audit_logs_created_at`
- [ ] RLS: ENABLE ROW LEVEL SECURITY
- [ ] Policy: Users can view their own audit logs (SELECT)
- [ ] Policy: Audit logs are insert-only (INSERT)

---

## Part 3: Triggers & Functions

### Functions (4 Total)

#### Function 1: `update_updated_at_column()`
- [ ] Created successfully
- [ ] Returns TRIGGER
- [ ] Updates `NEW.updated_at = NOW()`
- [ ] Language: plpgsql

**Test:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';
```

#### Function 2: `audit_log_function()`
- [ ] Created successfully
- [ ] Handles INSERT, UPDATE, DELETE operations
- [ ] Inserts into `audit_logs` table
- [ ] Captures changes as JSONB
- [ ] Language: plpgsql

**Test:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'audit_log_function';
```

#### Function 3: `get_user_total_balance(p_user_id UUID)`
- [ ] Created successfully
- [ ] Accepts user_id parameter
- [ ] Returns TABLE with `total_balance` DECIMAL
- [ ] Sums balances across user's banks
- [ ] Language: plpgsql

**Test:**
```sql
SELECT * FROM get_user_total_balance('550e8400-e29b-41d4-a716-446655440000'::uuid);
```

#### Function 4: `get_bank_transaction_total(p_bank_id UUID)`
- [ ] Created successfully
- [ ] Accepts bank_id parameter
- [ ] Returns TABLE with `total_sent` and `total_received` DECIMAL
- [ ] Calculates sent and received amounts
- [ ] Language: plpgsql

**Test:**
```sql
SELECT * FROM get_bank_transaction_total('550e8400-e29b-41d4-a716-446655440000'::uuid);
```

### Triggers (5 Total)

#### Trigger 1: `users_updated_at_trigger`
- [ ] Created successfully
- [ ] Event: BEFORE UPDATE
- [ ] Table: `users`
- [ ] Function: `update_updated_at_column()`
- [ ] For Each Row: Yes

#### Trigger 2: `banks_updated_at_trigger`
- [ ] Created successfully
- [ ] Event: BEFORE UPDATE
- [ ] Table: `banks`
- [ ] Function: `update_updated_at_column()`
- [ ] For Each Row: Yes

#### Trigger 3: `users_audit_trigger`
- [ ] Created successfully
- [ ] Event: AFTER INSERT OR UPDATE OR DELETE
- [ ] Table: `users`
- [ ] Function: `audit_log_function()`
- [ ] For Each Row: Yes

#### Trigger 4: `banks_audit_trigger`
- [ ] Created successfully
- [ ] Event: AFTER INSERT OR UPDATE OR DELETE
- [ ] Table: `banks`
- [ ] Function: `audit_log_function()`
- [ ] For Each Row: Yes

#### Trigger 5: `transactions_audit_trigger`
- [ ] Created successfully
- [ ] Event: AFTER INSERT OR UPDATE OR DELETE
- [ ] Table: `transactions`
- [ ] Function: `audit_log_function()`
- [ ] For Each Row: Yes

**Verification - All triggers:**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public';
```

---

## Part 4: Views (2 Optional but Recommended)

### View 1: `user_profiles`
- [ ] Created successfully
- [ ] Joins `users` with `banks`
- [ ] Includes `bank_count` aggregation
- [ ] Supports SELECT queries

**Test:**
```sql
SELECT * FROM user_profiles LIMIT 1;
```

### View 2: `transaction_history`
- [ ] Created successfully
- [ ] Joins `transactions` with `banks` (sender and receiver)
- [ ] Includes account IDs from linked banks
- [ ] Supports SELECT queries

**Test:**
```sql
SELECT * FROM transaction_history LIMIT 1;
```

---

## Part 5: Row-Level Security (RLS)

### Global RLS Status
- [ ] RLS enabled on `users` table
- [ ] RLS enabled on `banks` table
- [ ] RLS enabled on `transactions` table
- [ ] RLS enabled on `audit_logs` table

**Verification:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### RLS Policy Count
- [ ] 3 policies on `users` (SELECT, UPDATE, INSERT)
- [ ] 3 policies on `banks` (SELECT, INSERT, UPDATE)
- [ ] 2 policies on `transactions` (SELECT, INSERT)
- [ ] 2 policies on `audit_logs` (SELECT, INSERT)
- [ ] **Total: 10 policies**

**Verification:**
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Policy Details Checklist

#### `users` Policies
- [ ] `Users can view their own profile` - Condition: `auth.uid() = user_id`
- [ ] `Users can update their own profile` - Condition: `auth.uid() = user_id`
- [ ] `Only admins can insert users` - Condition: `auth.role() = 'authenticated'`

#### `banks` Policies
- [ ] `Users can view their own banks` - Checks user ownership
- [ ] `Users can insert their own banks` - Checks user ownership
- [ ] `Users can update their own banks` - Checks user ownership

#### `transactions` Policies
- [ ] `Users can view transactions...` - Checks sender OR receiver
- [ ] `Users can create transactions` - Checks sender ownership

#### `audit_logs` Policies
- [ ] `Users can view their own audit logs` - Matches current user
- [ ] `Audit logs are insert-only` - System-level INSERT

---

## Part 6: Authentication Setup

### Email/Password Provider
- [ ] Email provider enabled in Auth > Providers
- [ ] Email provider shows "ENABLED"
- [ ] Confirm email settings are appropriate
- [ ] Magic links (optional): Can be enabled separately

### URL Configuration
- [ ] Site URL set to `http://localhost:3000` (dev)
- [ ] Redirect URLs include:
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] `http://localhost:3000/sign-in`
  - [ ] `http://localhost:3000/sign-up`
- [ ] (Production) Add real domain URLs

### Email Templates (Optional)
- [ ] Confirmation email (customize or use default)
- [ ] Password reset email (customize or use default)
- [ ] Invite email (customize or use default)

### JWT Secrets
- [ ] JWT secret is generated (automatic)
- [ ] Secret is stored securely (automatic)
- [ ] Secret matches in `.env` files (handled by Supabase)

---

## Part 7: Environment Configuration

### `.env.local` File
- [ ] File exists in project root
- [ ] File is in `.gitignore`
- [ ] Contains all required variables:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Required - Plaid
PLAID_CLIENT_ID=your_value
PLAID_SECRET=your_value
PLAID_ENV=sandbox
PLAID_PRODUCTS=auth,transactions,identity
PLAID_COUNTRY_CODES=US,CA

# Required - Dwolla
DWOLLA_ENV=sandbox
DWOLLA_KEY=your_value
DWOLLA_SECRET=your_value
DWOLLA_BASE_URL=https://api-sandbox.dwolla.com

# Optional - Builder.io
NEXT_PUBLIC_BUILDER_API_KEY=your_value
```

### `.env.example`
- [ ] Contains all keys (without values)
- [ ] Serves as template for new developers
- [ ] No sensitive data included
- [ ] Matches current `.env.local` keys

---

## Part 8: Code Integration

### Supabase Client Files
- [ ] `lib/supabase.ts` exists and is correct
- [ ] Contains `createSessionClient()` function
- [ ] Contains `createAdminClient()` function
- [ ] Contains `createBrowserClient()` function
- [ ] All three use correct environment variables

### Action Files
- [ ] `lib/actions/user.actions.ts` migrated to Supabase
- [ ] `lib/actions/bank.actions.ts` migrated to Supabase
- [ ] `lib/actions/transaction.actions.ts` migrated to Supabase
- [ ] `lib/actions/dwolla.actions.ts` updated (unchanged structure)
- [ ] All imports use `createAdminClient()` or `createSessionClient()`

### Component Files
- [ ] `components/AuthForm.tsx` calls correct sign-up/sign-in functions
- [ ] `components/PlaidLink.tsx` uses user ID correctly
- [ ] No old Appwrite imports remain in any file
- [ ] No `APPWRITE_*` environment variables referenced

### Dependency Updates
- [ ] `package.json` includes `@supabase/supabase-js`
- [ ] Old `node-appwrite` dependency removed
- [ ] Run `npm install` to install Supabase client
- [ ] No build errors when running `npm run build`

---

## Part 9: Testing & Verification

### Basic Connectivity
- [ ] Can query `users` table: `SELECT COUNT(*) FROM users`
- [ ] Can query `banks` table: `SELECT COUNT(*) FROM banks`
- [ ] Can query `transactions` table: `SELECT COUNT(*) FROM transactions`
- [ ] Database connection is fast (< 1 second)

### Authentication Flow
- [ ] Signup creates user in `auth.users`
- [ ] Signup creates record in `users` table
- [ ] User receives confirmation email
- [ ] Can sign in with email/password
- [ ] Session cookie is set after sign in
- [ ] Can retrieve logged-in user via `getLoggedInUser()`

### Bank Linking
- [ ] Plaid Link component initializes
- [ ] Token exchange succeeds
- [ ] Bank record created in `banks` table
- [ ] Access token stored securely
- [ ] Can retrieve user's banks with `getAccounts()`

### Transactions
- [ ] Can create transaction between two banks
- [ ] Transaction record created in `transactions` table
- [ ] Can retrieve sent transactions
- [ ] Can retrieve received transactions
- [ ] Transaction RLS policy works (users only see own)

### RLS Enforcement
- [ ] User A cannot see User B's profile
- [ ] User A cannot see User B's banks
- [ ] User A cannot see User B's transactions
- [ ] Service role key can access all data (for admin operations)

### Performance
- [ ] Page loads in < 2 seconds
- [ ] Queries complete in < 500ms
- [ ] No N+1 query problems
- [ ] Indexes are being used (check pg_stat)

---

## Part 10: Security Checklist

### API Keys
- [ ] Service Role Key is **NEVER** exposed to client
- [ ] Service Role Key is **NOT** in `NEXT_PUBLIC_*` variable
- [ ] Service Role Key is **NOT** in `.env.example`
- [ ] Anon Key is safe to expose (public)
- [ ] All keys are stored securely in deployment platform

### Database Security
- [ ] RLS is enabled on all tables
- [ ] All policies are tested and work correctly
- [ ] Foreign key constraints prevent orphaned records
- [ ] Email validation prevents invalid data
- [ ] Amount validation prevents negative transfers

### Authentication Security
- [ ] Passwords are hashed by Supabase (automatic)
- [ ] Session tokens have expiration (7 days)
- [ ] Session cookies are httpOnly
- [ ] Session cookies are secure (HTTPS only)
- [ ] Session cookies are sameSite=strict

### Data Protection
- [ ] SSN is encrypted (recommended: use Supabase Vault)
- [ ] Access tokens encrypted before storage
- [ ] Audit logs track all data changes
- [ ] Sensitive data is not logged
- [ ] PII is handled according to privacy laws

---

## Part 11: Monitoring & Maintenance

### Supabase Dashboard
- [ ] Set up project alerts for:
  - [ ] High error rate
  - [ ] Slow queries (> 1s)
  - [ ] Disk usage warnings
- [ ] Review logs weekly
- [ ] Monitor database size growth

### Backups
- [ ] Supabase automatic backups enabled (default)
- [ ] Backup retention: 7 days minimum
- [ ] Test restore procedure (quarterly)

### Performance
- [ ] Monitor query performance via Analytics
- [ ] Check for missing indexes: `SELECT * FROM pg_stat_user_indexes`
- [ ] Review slow query log monthly
- [ ] Optimize queries as needed

### Scaling
- [ ] Monitor row counts in all tables
- [ ] Plan for growth:
  - [ ] 10,000 users → ~50,000 transactions
  - [ ] Consider archiving old transactions
  - [ ] May need index tuning

---

## Part 12: Final Acceptance

### Functional Testing
- [ ] ✅ User registration works end-to-end
- [ ] ✅ User login works end-to-end
- [ ] ✅ Bank account linking works
- [ ] ✅ Transaction creation works
- [ ] ✅ Transaction viewing works
- [ ] ✅ User profile updates work
- [ ] ✅ Logout works and clears session

### Code Quality
- [ ] ✅ No TypeScript errors (`npm run build`)
- [ ] ✅ No console errors in browser
- [ ] ✅ No Supabase errors in logs
- [ ] ✅ Code follows project conventions
- [ ] ✅ No hardcoded credentials

### Documentation
- [ ] ✅ SUPABASE_SCHEMA.sql is complete
- [ ] ✅ SUPABASE_SETUP_GUIDE.md is complete
- [ ] ✅ SUPABASE_SCHEMA_REFERENCE.md is complete
- [ ] ✅ This checklist is complete
- [ ] ✅ Team has access to documentation

### Deployment Readiness
- [ ] ✅ All environment variables configured
- [ ] ✅ Production Supabase project created
- [ ] ✅ Redirect URLs updated for production domain
- [ ] ✅ Database backed up and tested
- [ ] ✅ Monitoring and alerts configured

---

## Quick Reference: Key Statistics

| Item | Count | Status |
|------|-------|--------|
| **Enum Types** | 4 | ✅ |
| **Tables** | 4 | ✅ |
| **Columns** (users) | 15 | ✅ |
| **Columns** (banks) | 9 | ✅ |
| **Columns** (transactions) | 10 | ✅ |
| **Columns** (audit_logs) | 7 | ✅ |
| **Indexes** | 15+ | ✅ |
| **Functions** | 4 | ✅ |
| **Triggers** | 5 | ✅ |
| **RLS Policies** | 10 | ✅ |
| **Views** | 2 | ✅ |
| **Environment Variables** | 9 | ✅ |

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| "Cannot find SUPABASE_URL" | Check `.env.local` exists in project root |
| "RLS policy not working" | Ensure RLS is ENABLED on table, test with authenticated user |
| "Bank table is empty" | Check Plaid token exchange succeeded, verify `createBankAccount()` was called |
| "Transaction failed" | Verify both bank_ids are valid and user is sender |
| "Permission denied on SELECT" | Check RLS policy condition, ensure user_id matches |
| "Trigger not firing" | Verify trigger is ENABLED: `SELECT * FROM information_schema.triggers` |
| "Slow queries" | Check indexes exist, verify query uses indexes: `EXPLAIN` |

---

## Sign-Off

- [ ] All 12 parts completed
- [ ] All checklist items verified
- [ ] Team trained on Supabase setup
- [ ] Production deployment planned
- [ ] Monitoring and alerts configured

**Completed By:** _______________  
**Date:** _______________  
**Approved By:** _______________  
**Date:** _______________

