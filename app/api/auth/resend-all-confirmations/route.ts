import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get all users that haven't confirmed their email
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 400 }
      );
    }

    // Filter users with unconfirmed emails
    const unconfirmedUsers = users.users.filter(
      (user) => !user.email_confirmed_at && user.email
    );

    if (unconfirmedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with unconfirmed emails found',
        resent: 0,
        failed: 0,
      });
    }

    // Resend confirmation email to each unconfirmed user
    const results = {
      resent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    for (const user of unconfirmedUsers) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email!,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        });

        if (error) {
          results.failed++;
          results.errors.push({
            email: user.email!,
            error: error.message,
          });
          console.error(`Failed to resend to ${user.email}:`, error);
        } else {
          results.resent++;
          console.log(`Confirmation email resent to ${user.email}`);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          email: user.email!,
          error: errorMessage,
        });
        console.error(`Exception resending to ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Resend complete. ${results.resent} emails sent, ${results.failed} failed.`,
      totalUnconfirmed: unconfirmedUsers.length,
      resent: results.resent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Resend all confirmations error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
