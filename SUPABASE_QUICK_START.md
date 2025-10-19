# Supabase Quick Start Guide (5 Minutes)

**TL;DR:** Copy → Paste → Run → Done. Everything you need in one place.

---

## ⚡ 5-Minute Setup

### Step 1: Create Supabase Project (2 min)
1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name:** `jsm-banking`
   - **Password:** Create strong password
   - **Region:** Closest to you
4. Click "Create new project"
5. ⏳ Wait 5-10 minutes for initialization

### Step 2: Get API Keys (1 min)
1. Go to **Settings > API**
2. Copy these three values:
   ```
   NEXT_PUBLIC_SUPABASE_URL = [Project URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [Anon Key]
   NEXT_SUPABASE_SERVICE_ROLE_KEY = [Service Role Key]
   ```

### Step 3: Create `.env.local` (1 min)
Create file in project root with:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

PLAID_CLIENT_ID=your_value
PLAID_SECRET=your_value
PLAID_ENV=sandbox
PLAID_PRODUCTS=auth,transactions,identity
PLAID_COUNTRY_CODES=US,CA

DWOLLA_ENV=sandbox
DWOLLA_KEY=your_value
DWOLLA_SECRET=your_value
DWOLLA_BASE_URL=https://api-sandbox.dwolla.com

NEXT_PUBLIC_BUILDER_API_KEY=your_value
```

### Step 4: Run SQL Schema (1 min)
1. In Supabase: **SQL Editor > New Query**
2. Copy entire `SUPABASE_SCHEMA.sql` file
3. Paste and click **Run**
4. ✅ Done! All tables, functions, triggers created

---

## 📋 What Was Created

### Tables (4)
| Table | Purpose | Rows |
|-------|---------|------|
| `users` | User profiles + Dwolla info | Per user |
| `banks` | Linked bank accounts | Per account |
| `transactions` | Inter-account transfers | Per transfer |
| `audit_logs` | Activity log (optional) | Per change |

### Functions (4)
| Function | Purpose |
|----------|---------|
| `update_updated_at_column()` | Auto-timestamps |
| `audit_log_function()` | Audit trail |
| `get_user_total_balance()` | Balance calculation |
| `get_bank_transaction_total()` | Transaction totals |

### Triggers (5)
| Trigger | When | Action |
|---------|------|--------|
| `users_updated_at_trigger` | User updated | Update timestamp |
| `banks_updated_at_trigger` | Bank updated | Update timestamp |
| `users_audit_trigger` | User changed | Log to audit_logs |
| `banks_audit_trigger` | Bank changed | Log to audit_logs |
| `transactions_audit_trigger` | Transaction changed | Log to audit_logs |

### Types (4)
- `transaction_channel` (online, offline, api, mobile)
- `transaction_category` (Food and Drink, Travel, Transfer, Other)
- `account_type` (depository, credit, loan, investment, other)
- `dwolla_customer_type` (personal, business)

### Security (10 RLS Policies)
All tables have Row-Level Security enabled. Users can only see their own data.

---

## 🔐 Authentication Setup

1. Go to **Auth > Providers**
2. Find "Email"
3. Toggle **"Enable Email provider"** ON
4. Go to **Auth > URL Configuration**
5. Set:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:**
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/sign-in
     http://localhost:3000/sign-up
     ```

**Done!** Email/password auth is ready.

---

## 🧪 Test It

### Test 1: Check Database Connected
```bash
npm run dev
# App should load at http://localhost:3000
```

### Test 2: Sign Up
1. Go to http://localhost:3000/sign-up
2. Fill in form and submit
3. Check Supabase `users` table - should have 1 row
4. Check `auth.users` - should have 1 user

### Test 3: Link Bank Account
1. Sign in
2. Click "Link Account" button
3. Go through Plaid Link (use sandbox credentials)
4. Check `banks` table - should have 1 row

### Test 4: Send Transaction
1. Create another user (different email)
2. Sign out and back in as first user
3. Go to "Payment Transfer"
4. Send money to second user
5. Check `transactions` table - should have 1 row

---

## 📚 Full Documentation

For more details, see:

| File | Purpose |
|------|---------|
| **SUPABASE_SCHEMA.sql** | Complete SQL to run (already executed) |
| **SUPABASE_SETUP_GUIDE.md** | Detailed setup instructions |
| **SUPABASE_SCHEMA_REFERENCE.md** | Technical reference for all tables/functions |
| **SUPABASE_REQUIREMENTS_CHECKLIST.md** | Complete checklist for verification |

---

## ⚠️ Common Issues

### Issue: "SUPABASE_URL is not defined"
- [ ] Check `.env.local` exists in project root
- [ ] Restart: `npm run dev`
- [ ] No extra quotes around values

### Issue: "User not found" on sign in
- [ ] Check user exists in Supabase auth users
- [ ] Email must match exactly
- [ ] Try sign up again

### Issue: "Permission denied" when querying
- [ ] RLS policy is too strict
- [ ] Ensure user is logged in
- [ ] Check user_id matches

### Issue: Bank linking fails
- [ ] Check Plaid credentials in `.env.local`
- [ ] Verify Plaid environment = sandbox
- [ ] Check Plaid API response in browser console

---

## 🎯 Next Steps

1. ✅ Complete 5-minute setup above
2. ✅ Run `npm install`
3. ✅ Run `npm run dev`
4. ✅ Test signup, login, bank linking
5. ✅ Read detailed docs if needed
6. ✅ Deploy to production when ready

---

## 🆘 Need Help?

**Quick Links:**
- Supabase Docs: https://supabase.com/docs
- Status Page: https://status.supabase.com
- Discord Community: https://discord.supabase.com

**In Supabase Dashboard:**
- **Settings > Logs** - View database queries
- **Database > Policies** - View RLS policies
- **Database > Backups** - Manage backups

---

## 🔒 Security Reminders

✅ **DO:**
- Keep `.env.local` in `.gitignore`
- Use HTTPS in production
- Rotate API keys monthly
- Monitor audit logs

❌ **DON'T:**
- Commit `.env.local` to git
- Expose service role key to client
- Log sensitive data (tokens, SSN)
- Use production keys in development

---

**You're all set! 🚀**

The app is now fully connected to Supabase. All tables, functions, triggers, and security policies are in place.

