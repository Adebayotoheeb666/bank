import { NextResponse } from 'next/server';
import { signIn } from '@/lib/actions/user.actions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await signIn({ email, password });

    if (result && result.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: result?.error || 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
