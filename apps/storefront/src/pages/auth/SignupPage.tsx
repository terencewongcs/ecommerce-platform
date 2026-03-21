import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  async function onSubmit({ firstName, lastName, email, password }: FormValues) {
    try {
      await signup(email, password, firstName, lastName);
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('409')
          ? 'An account with this email already exists.'
          : 'Something went wrong. Please try again.';
      setError('root', { message });
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-brand-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-3">Join Us</p>
            <h1 className="text-2xl font-light text-brand-black">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                {...register('firstName', { required: true })}
                type="text"
                placeholder="First name"
                className="border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
              />
              <input
                {...register('lastName', { required: true })}
                type="text"
                placeholder="Last name"
                className="border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
              />
            </div>
            <input
              {...register('email', { required: true })}
              type="email"
              placeholder="Email address"
              className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
            />
            <input
              {...register('password', { required: true, minLength: 8 })}
              type="password"
              placeholder="Password"
              className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
            />
            <p className="text-[10px] text-brand-slate">Must be at least 8 characters.</p>

            {/* Root-level error message (duplicate email, etc.) */}
            {errors.root && (
              <p className="text-xs text-brand-rose">{errors.root.message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-brand-slate mt-6">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-brand-black font-semibold hover:text-brand-gold transition-colors duration-150"
            >
              Sign in
            </Link>
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}
