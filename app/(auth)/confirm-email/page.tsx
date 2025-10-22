'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConfirmEmail = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      // Check if confirmation was already handled by the callback route
      const success = searchParams.get('success');
      const email = searchParams.get('email');

      if (success === 'true') {
        setStatus('success');
        setMessage('Email confirmed successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
        return;
      }

      // If no success param, check for error
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        setMessage(decodeURIComponent(error) || 'Failed to confirm email. Please try again.');
        return;
      }

      // No parameters - this shouldn't happen in normal flow
      setStatus('error');
      setMessage('Invalid confirmation link. Please try signing up again.');
    };

    confirmEmail();
  }, [searchParams, router]);

  const handleResendEmail = async () => {
    const email = searchParams.get('email');
    if (!email) {
      setMessage('Email address not found. Please try signing up again.');
      return;
    }

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: decodeURIComponent(email) }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Failed to resend: ${data.error || 'Unknown error'}`);
        return;
      }

      setMessage('Confirmation email sent! Check your inbox.');
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Failed to resend email. Please try again.');
    }
  };

  return (
    <section className="flex-center size-full max-sm:px-6">
      <div className="auth-form max-w-md">
        <header className="flex flex-col gap-5 text-center">
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {status === 'loading' && 'Confirming Email'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </h1>
          <p className="text-16 font-normal text-gray-600">{message}</p>
        </header>

        <div className="mt-8 flex justify-center">
          {status === 'loading' && (
            <Loader2 size={32} className="animate-spin text-blue-600" />
          )}
          {status === 'success' && (
            <div className="flex flex-col gap-4 w-full">
              <p className="text-center text-green-600">✓ Your email is confirmed</p>
              <Button
                onClick={() => router.push('/sign-in')}
                className="form-btn"
              >
                Go to Sign In
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col gap-4 w-full">
              <p className="text-center text-red-600">✗ Could not confirm email</p>
              <Button
                onClick={handleResendEmail}
                className="form-btn"
              >
                Resend Confirmation Email
              </Button>
              <Button
                onClick={() => router.push('/sign-up')}
                variant="outline"
              >
                Back to Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ConfirmEmail;
