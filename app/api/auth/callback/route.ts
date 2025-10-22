import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  // Handle email confirmation tokens
  if (token_hash && type === 'email') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.redirect(
        new URL('/sign-up?error=server_configuration_error', request.url)
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email',
      });

      if (error) {
        console.error('Email verification error:', error);
        return NextResponse.redirect(
          new URL(`/sign-up?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      // Email confirmed successfully
      return NextResponse.redirect(
        new URL('/confirm-email?success=true&email=' + encodeURIComponent(data.user?.email || ''), request.url)
      );
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(
        new URL('/sign-up?error=confirmation_failed', request.url)
      );
    }
  }

  // Handle OAuth flow (if needed in the future)
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.redirect(
        new URL('/sign-up?error=server_configuration_error', request.url)
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(
          new URL(`/sign-up?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(
        new URL('/sign-up?error=authentication_failed', request.url)
      );
    }
  }

  // No valid auth parameters
  return NextResponse.redirect(new URL('/sign-up', request.url));
}
