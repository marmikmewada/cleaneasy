'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Create Property</h1>

      {error && <div className="bg-red-700 text-red-100 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <input
          type="text"
          value={name}
          placeholder="Property Name"
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 py-2 rounded hover:bg-green-700"
        >
          {loading ? 'Creating...' : 'Create Property'}
        </button>
      </form>
    </div>
  );
}
