'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!name || !email || !password) {
      setError('Name, email and password are required.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName, // optional
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Signup failed.');
      } else {
        setSuccessMessage('Signup successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-slate-100">
      <div className="bg-slate-900 border border-slate-800 px-6 py-7 sm:px-8 sm:py-8 rounded-xl w-full max-w-md shadow-xl">
        <div className="mb-3 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">CleanEasy</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Create an owner account</p>
        </div>

          {error && (
            <div className="bg-rose-900/40 border border-rose-500/70 text-rose-100 p-3 rounded mb-4 text-center text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-900/30 border border-emerald-500/60 text-emerald-100 p-3 rounded mb-4 text-center text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm text-slate-400 mb-2">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-slate-400 mb-2">Company name (optional)</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-100 text-slate-900 py-3 rounded-lg hover:bg-slate-200 disabled:bg-slate-700 disabled:text-slate-300 transition-colors font-medium"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-4 text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link href="/" className="text-sky-400 hover:text-sky-300">
              Login
            </Link>
          </p>
      </div>
    </div>
  );
}
