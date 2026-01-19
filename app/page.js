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
        setError(data.message || 'Login failed');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-8 rounded-xl w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-400">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-6">Sign in to your account</p>

        {error && (
          <div className="bg-red-700/50 border border-red-600 p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Login Type Toggle */}
        <div className="mb-6 flex gap-2 bg-gray-700/50 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setLoginType('owner');
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-colors ${
              loginType === 'owner'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
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
            className={`flex-1 py-2 rounded-md transition-colors ${
              loginType === 'employee'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {loginType === 'employee' ? (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Simple name login for employees</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors font-medium text-lg"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-blue-400 hover:text-blue-300">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
