'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';

export default function LoginPage() {
  const router = useRouter();

  const [loginType, setLoginType] = useState('owner'); // 'owner' or 'employee'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  // 🔁 Auto redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || !role) return;

    try {
      const decoded = jwt.decode(token);
      if (!decoded || decoded.exp * 1000 < Date.now()) {
        localStorage.clear();
        return;
      }

      redirectByRole(role);
    } catch {
      localStorage.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redirectByRole = (role) => {
    if (role === 'admin') router.push('/admin');
    else if (role === 'owner') router.push('/owner');
    else if (role === 'employee') router.push('/employee');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginData = loginType === 'employee' 
        ? { name, password, loginType: 'employee' }
        : { email, password, loginType: 'owner' };

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.message === 'SUBSCRIPTION_EXPIRED') {
          setError('SUBSCRIPTION_EXPIRED');
        } else {
          setError(data.message || 'Login failed');
        }
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userData', JSON.stringify(data.data));

      // ✅ Save ownerId separately for easy access
      if (data.role === 'owner') {
        localStorage.setItem('ownerId', data.data.userId);
      } else if (data.role === 'employee') {
        localStorage.setItem('employeeId', data.data.userId);
        if (data.data.ownerId) {
          localStorage.setItem('ownerId', data.data.ownerId);
        }
      }

      redirectByRole(data.role);
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-slate-100">
      <div className="bg-slate-900 border border-slate-800 px-6 py-7 sm:px-8 sm:py-8 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">CleanEasy</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Sign in to manage properties and tasks</p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 text-xs text-slate-400 hover:text-slate-100 hover:border-slate-500"
            aria-label="What can I do?"
          >
            i
          </button>
        </div>

        {showInfo && (
          <div className="mb-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 text-left space-y-1">
            <p className="font-medium text-slate-100">Owners/Admins</p>
            <p>- Create properties and employees</p>
            <p>- Assign employees to properties</p>
            <p>- Create, complete and review cleaning tasks</p>
            <p className="font-medium text-slate-100 pt-1">Employees</p>
            <p>- Log in with just name and password</p>
            <p>- See assigned properties and their tasks</p>
            <p>- Create and complete tasks for their properties</p>
          </div>
        )}

        {error && (
          <div className={`border p-3 sm:p-4 rounded-lg mb-4 text-center ${
            error === 'SUBSCRIPTION_EXPIRED' 
              ? 'bg-red-900/50 border-red-600' 
              : 'bg-red-700/50 border-red-600'
          }`}>
            {error === 'SUBSCRIPTION_EXPIRED' ? (
              <div>
                <p className="text-red-300 font-semibold mb-2 text-sm sm:text-base">Subscription Expired</p>
                <p className="text-red-200 text-xs sm:text-sm">Please contact Marmik to renew your subscription.</p>
              </div>
            ) : (
              <p className="text-sm sm:text-base">{error}</p>
            )}
          </div>
        )}

        {/* Login Type Toggle */}
        <div className="mb-3 sm:mb-4 flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setLoginType('owner');
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-colors text-xs sm:text-sm ${
              loginType === 'owner'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Owner/Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('employee');
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-colors text-xs sm:text-sm ${
              loginType === 'employee'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          {loginType === 'employee' ? (
            <div>
              <label className="block text-xs sm:text-sm text-slate-400 mb-2">Your name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none transition-colors text-base sm:text-lg"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Employees log in using just their name and password (no email needed).
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs sm:text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none transition-colors text-base sm:text-lg"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm text-slate-400 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none transition-colors text-base sm:text-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-100 text-slate-900 py-3 rounded-lg hover:bg-slate-200 disabled:bg-slate-700 disabled:text-slate-300 transition-colors font-medium text-base sm:text-lg"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-4 sm:mt-6">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-sky-400 hover:text-sky-300">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
