'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HelpButton from '../components/HelpButton';

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
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-md">
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">Admin</h1>
                <HelpButton context="admin" />
              </div>
              <p className="text-slate-400 text-sm sm:text-base">Manage owner subscription limits</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-rose-600 px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors border border-rose-500/60 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-900/40 border border-rose-500/70 p-4 rounded-lg mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-900/30 border border-emerald-500/60 p-4 rounded-lg mb-6 text-center text-sm text-emerald-100">
            {success}
          </div>
        )}

        {/* Owners List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-md">
          <h2 className="text-lg sm:text-xl font-medium mb-4 text-slate-100">All owners</h2>
          {owners.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">No owners found</p>
          ) : (
            <div className="space-y-4">
              {owners.map((owner) => (
                <div
                  key={owner._id}
                  className="bg-slate-950 rounded-lg p-3 sm:p-4 border border-slate-800"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-medium truncate text-slate-100">{owner.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 break-all">{owner.email}</p>
                      {owner.companyName && (
                        <p className="text-xs sm:text-sm text-slate-300 mt-1">Company: {owner.companyName}</p>
                      )}
                      <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <div>
                          <span className="text-xs sm:text-sm text-slate-400">Max properties: </span>
                          <span className="text-base sm:text-lg font-medium text-slate-100">
                            {owner.subscription?.maxProperties || 2}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-slate-400">Max employees: </span>
                          <span className="text-base sm:text-lg font-medium text-slate-100">
                            {owner.subscription?.maxEmployees || 1}
                          </span>
                        </div>
                      </div>
                      {owner.subscription?.expiresAt && (
                        <div className="mt-2 text-xs text-slate-400">
                          Expires: {new Date(owner.subscription.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingOwner(owner._id);
                        setMaxProperties(owner.subscription?.maxProperties || 2);
                        setMaxEmployees(owner.subscription?.maxEmployees || 1);
                        setExpiryDate(owner.subscription?.expiresAt 
                          ? new Date(owner.subscription.expiresAt).toISOString().split('T')[0]
                          : '');
                      }}
                      className="bg-slate-100 text-slate-900 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-slate-200 transition-colors text-xs sm:text-sm w-full sm:w-auto"
                    >
                      Edit Limits
                    </button>
                  </div>

                  {editingOwner === owner._id && (
                    <div className="mt-4 p-3 sm:p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <h4 className="font-medium mb-3 sm:mb-4 text-slate-100 text-sm sm:text-base">Update subscription</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div>
                          <label className="block text-xs sm:text-sm text-slate-400 mb-2">Max properties</label>
                          <input
                            type="number"
                            value={maxProperties}
                            onChange={(e) => setMaxProperties(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm sm:text-base focus:border-sky-500 focus:outline-none"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-slate-400 mb-2">Max employees</label>
                          <input
                            type="number"
                            value={maxEmployees}
                            onChange={(e) => setMaxEmployees(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm sm:text-base focus:border-sky-500 focus:outline-none"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs sm:text-sm text-slate-400 mb-2">Expiry date (optional)</label>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm sm:text-base focus:border-sky-500 focus:outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Leave empty for unlimited. Set date to expire subscription.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleUpdateLimits(owner._id)}
                          className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm sm:text-base"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingOwner(null);
                            setExpiryDate('');
                          }}
                          className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm sm:text-base border border-slate-700"
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
