'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingOwner, setEditingOwner] = useState(null);
  const [maxProperties, setMaxProperties] = useState(2);
  const [maxEmployees, setMaxEmployees] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');

    if (role !== 'admin') {
      router.push('/');
      return;
    }

    fetchOwners();
  }, [router]);

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/admin/getallowners');
      if (!res.ok) throw new Error('Failed to fetch owners');
      
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to load owners');
      } else {
        setOwners(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimits = async (ownerId) => {
    try {
      setSuccess('');
      setError('');
      const res = await fetch('/api/admin/updateownerlimits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId,
          maxProperties: parseInt(maxProperties),
          maxEmployees: parseInt(maxEmployees),
          expiresAt: expiryDate || null
        })
      });

      if (!res.ok) throw new Error('Failed to update limits');
      
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to update limits');
      } else {
        setSuccess('Limits updated successfully!');
        setEditingOwner(null);
        setExpiryDate('');
        fetchOwners();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update limits');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-400 mb-2">Admin Panel</h1>
              <p className="text-gray-400">Manage Owner Subscription Limits</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-700/50 border border-red-600 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-700/50 border border-green-600 p-4 rounded-lg mb-6 text-center">
            {success}
          </div>
        )}

        {/* Owners List */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">All Owners</h2>
          {owners.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No owners found</p>
          ) : (
            <div className="space-y-4">
              {owners.map((owner) => (
                <div
                  key={owner._id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{owner.name}</h3>
                      <p className="text-sm text-gray-400">{owner.email}</p>
                      {owner.companyName && (
                        <p className="text-sm text-gray-300 mt-1">Company: {owner.companyName}</p>
                      )}
                      <div className="mt-3 flex gap-4">
                        <div>
                          <span className="text-sm text-gray-400">Max Properties: </span>
                          <span className="text-lg font-medium text-green-400">
                            {owner.subscription?.maxProperties || 2}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Max Employees: </span>
                          <span className="text-lg font-medium text-blue-400">
                            {owner.subscription?.maxEmployees || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {owner.subscription?.expiresAt && (
                        <div className="text-xs text-gray-400">
                          Expires: {new Date(owner.subscription.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setEditingOwner(owner._id);
                          setMaxProperties(owner.subscription?.maxProperties || 2);
                          setMaxEmployees(owner.subscription?.maxEmployees || 1);
                          setExpiryDate(owner.subscription?.expiresAt 
                            ? new Date(owner.subscription.expiresAt).toISOString().split('T')[0]
                            : '');
                        }}
                        className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Limits
                      </button>
                    </div>
                  </div>

                  {editingOwner === owner._id && (
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                      <h4 className="font-semibold mb-4 text-blue-400">Update Subscription</h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Max Properties</label>
                          <input
                            type="number"
                            value={maxProperties}
                            onChange={(e) => setMaxProperties(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Max Employees</label>
                          <input
                            type="number"
                            value={maxEmployees}
                            onChange={(e) => setMaxEmployees(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Subscription Expiry Date (Optional)</label>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty for unlimited. Set date to expire subscription.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateLimits(owner._id)}
                          className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingOwner(null);
                            setExpiryDate('');
                          }}
                          className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
