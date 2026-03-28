import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileSchema, type UpdateProfileInput } from '@trendyuniquellc/types';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/apiClient';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, isLoading, updateProfile } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/login');
    }
  }, [isLoading, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    values: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  async function onProfileSubmit({ firstName, lastName }: UpdateProfileInput) {
    setProfileSuccess(false);
    setProfileError('');
    try {
      await apiFetch('/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName }),
      });
      updateProfile({ firstName, lastName });
      setProfileSuccess(true);
    } catch {
      setProfileError('Failed to update profile. Please try again.');
    }
  }

  async function handlePasswordReset() {
    setResetStatus('sending');
    try {
      await apiFetch('/account/change-password/request', { method: 'POST' });
      setResetStatus('sent');
    } catch {
      setResetStatus('error');
    }
  }

  // Show nothing while checking auth status
  if (isLoading || !user) return null;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-brand-ivory">
        <div className="max-w-xl mx-auto px-6 py-16">

          {/* Page header */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-2">My Account</p>
            <h1 className="text-2xl font-light text-brand-black">Profile</h1>
          </div>

          {/* ── Profile information ──────────────────────────────────────── */}
          <section className="mb-12">
            <h2 className="text-xs tracking-[0.2em] uppercase text-brand-black mb-6 pb-3 border-b border-brand-surface">
              Personal Information
            </h2>

            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              {/* Email — read-only */}
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-brand-slate mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full border border-brand-surface bg-brand-surface/30 px-4 py-3 text-sm text-brand-slate cursor-default"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-brand-slate mb-1.5">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black focus:outline-none focus:border-brand-black"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-brand-rose mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-brand-slate mb-1.5">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black focus:outline-none focus:border-brand-black"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-brand-rose mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {profileSuccess && (
                <p className="text-xs text-green-700">Profile updated successfully.</p>
              )}
              {profileError && (
                <p className="text-xs text-brand-rose">{profileError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </section>

          {/* ── Password change ──────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-brand-black mb-6 pb-3 border-b border-brand-surface">
              Password
            </h2>

            <p className="text-sm text-brand-slate mb-6 leading-relaxed">
              We'll send a secure link to <span className="text-brand-black">{user.email}</span>.
              Click it to set a new password. The link expires in 1 hour.
            </p>

            {resetStatus === 'sent' ? (
              <div className="border border-brand-surface bg-white px-6 py-4">
                <p className="text-xs tracking-wide text-brand-black">Email sent.</p>
                <p className="text-sm text-brand-slate mt-1">
                  Check your inbox at <span className="font-medium">{user.email}</span> and click the link to set your new password.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handlePasswordReset}
                  disabled={resetStatus === 'sending'}
                  className="py-3 px-8 border border-brand-black text-brand-black text-xs tracking-[0.25em] uppercase hover:bg-brand-black hover:text-brand-ivory transition-colors duration-200 disabled:opacity-50"
                >
                  {resetStatus === 'sending' ? 'Sending…' : 'Send Reset Email'}
                </button>
                {resetStatus === 'error' && (
                  <p className="text-xs text-brand-rose mt-3">
                    Something went wrong. Please try again.
                  </p>
                )}
              </>
            )}
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
