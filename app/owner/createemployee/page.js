'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEmployeePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ownerId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userData'))?.userId : null;

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'owner' || !ownerId) {
      router.push('/');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/createemployee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, ownerId }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        // Redirect to owner dashboard after successful creation
        router.push('/owner');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Create Employee</h1>

      {error && <div className="bg-red-700 text-red-100 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <input
          type="text"
          value={name}
          placeholder="Employee Name"
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
          required
        />
        <input
          type="email"
          value={email}
          placeholder="Employee Email"
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
          required
        />
        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
}
