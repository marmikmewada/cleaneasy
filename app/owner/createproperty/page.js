'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HelpButton from '../../components/HelpButton';

export default function CreatePropertyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
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
      const res = await fetch('/api/createproperty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ownerId }),
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
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold">Create property</h1>
          <HelpButton context="owner-dashboard" />
        </div>

        {error && (
          <div className="bg-rose-900/40 border border-rose-500/70 text-rose-100 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm text-slate-400 mb-2">Property name</label>
            <input
              type="text"
              value={name}
              placeholder="e.g. Sunset Villa"
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-950 text-slate-100 border border-slate-700 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-100 text-slate-900 py-3 rounded-lg hover:bg-slate-200 disabled:bg-slate-700 disabled:text-slate-300 transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create property'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/owner')}
            className="w-full bg-slate-800 py-3 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
