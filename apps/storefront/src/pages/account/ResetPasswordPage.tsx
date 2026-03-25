import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { apiFetch } from '../../lib/apiClient';

type FormValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  // If no token in URL, show an error immediately
  const missingToken = !token;

  async function onSubmit({ newPassword }: FormValues) {
    try {
      await apiFetch('/account/change-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
        skipAuth: true,
      });
      setSuccess(true);
    } catch {
      setError('root', {
        message: 'This link is invalid or has expired. Please request a new one.',
      });
    }
  }

  // Auto-scroll to top when success message appears
  useEffect(() => {
    if (success) window.scrollTo(0, 0);
  }, [success]);

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-brand-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {/* ── Invalid / missing token ──────────────────────────────────── */}
          {missingToken && (
            <div className="text-center">
              <p className="text-xs tracking-[0.25em] uppercase text-brand-rose mb-4">Invalid Link</p>
              <p className="text-sm text-brand-slate mb-6">
                This password reset link is missing or malformed.
              </p>
              <Link
                to="/account"
                className="text-xs tracking-[0.2em] uppercase text-brand-black underline underline-offset-4"
              >
                Go to my account
              </Link>
            </div>
          )}

          {/* ── Success state ─────────────────────────────────────────────── */}
          {!missingToken && success && (
            <div className="text-center">
              <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-3">Done</p>
              <h1 className="text-2xl font-light text-brand-black mb-4">Password Updated</h1>
              <p className="text-sm text-brand-slate mb-8">
                Your password has been changed. You've been signed out of all devices for security.
              </p>
              <Link
                to="/auth/login"
                className="inline-block py-4 px-10 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* ── Password form ─────────────────────────────────────────────── */}
          {!missingToken && !success && (
            <>
              <div className="text-center mb-10">
                <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-3">
                  Password Reset
                </p>
                <h1 className="text-2xl font-light text-brand-black">Set New Password</h1>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <input
                    {...register('newPassword', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'At least 8 characters' },
                    })}
                    type="password"
                    placeholder="New password"
                    className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-brand-rose mt-1">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (v) =>
                        v === watch('newPassword') || 'Passwords do not match',
                    })}
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-brand-rose mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {errors.root && (
                  <p className="text-xs text-brand-rose">{errors.root.message}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : 'Update Password'}
                </button>
              </form>
            </>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
