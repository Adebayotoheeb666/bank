# Email Confirmation Setup Guide

This guide explains how to configure Supabase to send email confirmation emails and how the flow works in this application.

## Overview

The email confirmation flow works as follows:

1. User signs up with email and password
2. App shows "Check your email" message
3. Supabase sends a confirmation email
4. User clicks the link in the email
5. Link redirects to `/auth/callback?token_hash=...&type=email`
6. App confirms the email and shows success message
7. User can now sign in

## Configuration Steps

### Step 1: Configure Supabase Email Redirect URL

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add your redirect URL:
   - **Development**: `http://localhost:3000/auth/callback`
   - **Production**: `https://yourdomain.com/auth/callback`
5. Click **Save**

### Step 2: Enable Email Provider (if not already enabled)

1. Go to **Authentication** → **Providers**
2. Find "Email" provider
3. Toggle **"Enable Email provider"** ON
4. Ensure **"Confirm email"** is toggled ON (required for confirmation flow)
5. Click **Save**

### Step 3: Configure SMTP Email Service (Optional)

By default, Supabase uses their built-in email service with rate limits. For production:

1. Go to **Authentication** → **Email Templates**
2. You can customize the confirmation email template
3. To use custom SMTP (Gmail, SendGrid, etc.):
   - Go to **Authentication** → **SMTP Settings**
   - Configure your SMTP provider credentials

### Step 4: Test the Flow

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/sign-up`
3. Fill out the signup form with test data
4. You should see "Confirm Your Email" message
5. Check your email for confirmation link
   - **If using Supabase default email**: Check spam folder
   - **For testing without email**: Use Supabase dashboard to view auth logs

### Step 5 (Optional): Test with Supabase Dashboard

If you don't have email set up yet:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find your test user
4. You can manually confirm the email by updating the user record
5. Or use the API to verify manually

## Environment Variables

The following environment variables are used (already set):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Used for redirect URLs
```

## Files Modified

### Frontend Components
- `components/AuthForm.tsx` - Shows confirmation message after signup
- `app/(auth)/confirm-email/page.tsx` - Email confirmation page

### API Routes
- `app/api/auth/callback/route.ts` - Handles Supabase redirect with token
- `app/api/auth/resend-confirmation/route.ts` - Allows users to resend confirmation email

### Authentication Logic
- `lib/actions/user.actions.ts` - `signIn()` now checks `email_confirmed_at`

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Signs Up                                             │
│    - Fill form with email, password, profile info           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. App Shows "Check Email" Message                          │
│    - confirmationPending = true                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Supabase Sends Confirmation Email                        │
│    - Link: https://yoursite.com/auth/callback?token=...    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User Clicks Link in Email                                │
│    - Redirects to /auth/callback with token_hash           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. /auth/callback Route Processes Token                     │
│    - Verifies token with Supabase                           │
│    - Updates user.email_confirmed_at                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Redirect to /confirm-email with Success                 │
│    - Shows success message                                  │
│    - Redirects to /sign-in after 2 seconds                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. User Can Now Sign In                                     │
│    - signIn() checks email_confirmed_at is set             │
│    - Creates session if all checks pass                     │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### "Email not confirmed" error when signing in

**Cause**: User hasn't clicked the confirmation link yet

**Solution**: Make sure confirmation email was sent and user clicked the link

### Confirmation email not received

**Cause 1**: Email in spam folder
- Check spam/junk folder in email provider

**Cause 2**: Supabase email not configured
- Verify email provider is enabled in Supabase dashboard

**Cause 3**: Redirect URL not configured
- Verify redirect URL is set in Supabase **URL Configuration**

### "Invalid confirmation link" error

**Cause**: Token is expired or invalid

**Solution**: Use the "Resend Confirmation Email" button on the error page

### Token verification fails

**Cause**: Service role key issue or redirect URL mismatch

**Solution**: 
1. Verify `NEXT_SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check redirect URL matches exactly in Supabase

## Manual Email Confirmation (for testing)

If you want to manually confirm a user's email without sending an email:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find the user you want to confirm
4. Click the user's email
5. In the **User Details** panel, you should see email confirmation status
6. Update the user's `email_confirmed_at` timestamp to the current time

## Security Notes

- Confirmation tokens expire after 24 hours (Supabase default)
- Tokens are single-use and expire after being used
- Service role key must be kept secret (never expose in browser)
- Email addresses are case-insensitive for authentication

## Next Steps

1. Configure Supabase email settings following **Step 1-2** above
2. Test signup and email confirmation flow
3. Verify sign-in rejects unconfirmed emails
4. Check confirm-email page displays correctly
