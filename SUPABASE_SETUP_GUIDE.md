# Supabase Setup Guide for JSM Banking Application

## Overview

This guide provides step-by-step instructions to set up Supabase for the JSM Banking application. The app requires database tables, authentication, real-time subscriptions, and Row-Level Security (RLS) policies.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Schema Setup](#database-schema-setup)
4. [Authentication Configuration](#authentication-configuration)
5. [RLS Policies](#rls-policies)
6. [Environment Variables](#environment-variables)
7. [Verification Checklist](#verification-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Active Supabase account (https://supabase.com)
- Node.js 18+ installed locally
- Access to Supabase Project URL and API keys
- Plaid and Dwolla credentials (external services)

---

## Supabase Project Setup

### Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `jsm-banking` (or your preference)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for initialization (5-10 minutes)

### Step 2: Obtain API Credentials

Once your project is ready:

1. Navigate to **Settings > API** in your Supabase project
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `NEXT_SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

3. Store these in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Database Schema Setup

### Step 1: Run the Full Schema Script

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `SUPABASE_SCHEMA.sql`
4. Paste into the SQL editor
5. Click **"Run"** button
6. Wait for completion (should see success message)

### Step 2: Verify Tables Were Created

In **Table Editor**, you should see:
- ✅ `users`
- ✅ `banks`
- ✅ `transactions`
- ✅ `audit_logs`

### Step 3: Enable Realtime (Optional)

For real-time updates on transactions:

1. Go to **Database > Replication** in Supabase
2. Find your publication (usually `supabase_realtime`)
3. Enable replication on these tables:
   - `transactions`
   - `banks`

---

## Authentication Configuration

### Step 1: Enable Email/Password Auth

1. Go to **Authentication > Providers** in Supabase
2. Find "Email" provider
3. Toggle **"Enable Email provider"** ON
4. Keep default settings

### Step 2: Configure Auth Settings

1. Go to **Authentication > URL Configuration**
2. Set these URLs:
   - **Site URL**: `http://localhost:3000` (development)
   - **Redirect URLs**: 
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/sign-in
     http://localhost:3000/sign-up
     ```

3. For production, add your domain URLs

### Step 3: Email Templates (Optional)

1. Go to **Authentication > Email Templates**
2. Customize confirmation, password reset, and invite emails as needed
3. Default templates work fine for basic setup

---

## RLS Policies

The schema script includes RLS policies, but verify they're active:

### Step 1: Check RLS Status

1. Go to **SQL Editor**
2. Run this query:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`

### Step 2: Verify Policies

1. Go to **Database > Policies**
2. Check that these policies exist:

**For `users` table:**
- `Users can view their own profile`
- `Users can update their own profile`
- `Only admins can insert users`

**For `banks` table:**
- `Users can view their own banks`
- `Users can insert their own banks`
- `Users can update their own banks`

**For `transactions` table:**
- `Users can view transactions where they are sender or receiver`
- `Users can create transactions`

**For `audit_logs` table:**
- `Users can view their own audit logs`
- `Audit logs are insert-only`

### Step 3: Test RLS Policies (Optional)

Run authenticated queries in the SQL editor to verify access control:

```sql
-- As authenticated user
SELECT * FROM users WHERE user_id = auth.uid();

-- Should only return current user's data
```

---

## Environment Variables

### Development (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Plaid (get from Plaid dashboard)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
PLAID_PRODUCTS=auth,transactions,identity
PLAID_COUNTRY_CODES=US,CA

# Dwolla (get from Dwolla dashboard)
DWOLLA_ENV=sandbox
DWOLLA_KEY=your_dwolla_key
DWOLLA_SECRET=your_dwolla_secret
DWOLLA_BASE_URL=https://api-sandbox.dwolla.com

# Builder.io (optional)
NEXT_PUBLIC_BUILDER_API_KEY=your_builder_key
```

### Production

- Use environment variables in your deployment platform (Vercel, Netlify, etc.)
- **Never commit `.env.local`** to git
- Use Supabase secrets for sensitive values

---

## Verification Checklist

Complete this checklist to ensure everything is set up:

### Database
- [ ] All 4 tables created (`users`, `banks`, `transactions`, `audit_logs`)
- [ ] All indexes created (check via SQL)
- [ ] All triggers active (check via SQL)
- [ ] RLS enabled on all tables
- [ ] All RLS policies created

### Authentication
- [ ] Email/Password provider enabled
- [ ] Site URL configured
- [ ] Redirect URLs configured
- [ ] Auth users table exists (should be automatic)

### Environment
- [ ] `.env.local` has all 3 Supabase keys
- [ ] Plaid credentials set
- [ ] Dwolla credentials set
- [ ] No sensitive keys in `.env.example`

### Code Integration
- [ ] `lib/supabase.ts` imports correct keys from environment
- [ ] `lib/actions/user.actions.ts` uses `createAdminClient()` correctly
- [ ] `lib/actions/bank.actions.ts` queries banks table
- [ ] `lib/actions/transaction.actions.ts` queries transactions table
- [ ] AuthForm component calls `signUp()` and `signIn()` functions

### Testing
- [ ] Signup works end-to-end
- [ ] Sign in works with created user
- [ ] User profile data saved to `users` table
- [ ] Can link bank account (creates `banks` record)
- [ ] Can create transaction (creates `transactions` record)

---

## Troubleshooting

### Issue: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solution:**
1. Ensure `.env.local` file exists in project root
2. Verify keys are not wrapped in extra quotes
3. Restart dev server: `npm run dev`

### Issue: "User not found" on sign in

**Solution:**
1. Check if user was actually created in `users` table
2. Verify email matches exactly (case-sensitive in some cases)
3. Check auth.users in Supabase dashboard

### Issue: "Permission denied" when querying tables

**Solution:**
1. RLS policy may be too restrictive
2. Verify user is authenticated: `const { data: { user } } = await client.auth.getUser()`
3. Check RLS policy logic matches your auth.uid()

### Issue: "Service Role Key restricted" error

**Solution:**
1. Never expose service role key to browser/client code
2. Service role key should only be in `.env` (not `NEXT_PUBLIC_`)
3. Only use in server-side actions (`'use server'`)

### Issue: "Bank table is empty" after linking

**Solution:**
1. Verify Plaid token exchange succeeded
2. Check that `exchangePublicToken()` ran without errors
3. Verify `createBankAccount()` was called with correct user_id

### Issue: Transactions not showing

**Solution:**
1. Check `transactions` table has records
2. Verify `sender_bank_id` and `receiver_bank_id` are valid bank IDs
3. Check RLS policy allows viewing (user must be sender OR receiver)

---

## Security Best Practices

1. **Never log sensitive data** (tokens, keys, SSNs)
2. **Encrypt access tokens** before storing in database
3. **Use HTTPS only** in production
4. **Enable Supabase backups** in project settings
5. **Monitor audit logs** for suspicious activity
6. **Keep dependencies updated**: `npm audit fix`
7. **Rotate API keys regularly** (monthly recommended)
8. **Use strong session timeouts** (7 days in current setup)

---

## Next Steps

1. ✅ Complete all setup steps above
2. ✅ Run the schema script
3. ✅ Verify all checklist items
4. ✅ Test authentication flow
5. ✅ Test bank linking and transactions
6. ✅ Deploy to production
7. ✅ Monitor logs and performance

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Plaid Docs**: https://plaid.com/docs
- **Dwolla Docs**: https://developers.dwolla.com
- **Next.js Docs**: https://nextjs.org/docs

