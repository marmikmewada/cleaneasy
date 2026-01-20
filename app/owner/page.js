'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HelpButton from '../components/HelpButton';

export default function OwnerPage() {
  const router = useRouter();

  const [owner, setOwner] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userData = localStorage.getItem('userData');

    if (role !== 'owner' || !userData) {
      router.push('/');
      return;
    }

    const parsed = JSON.parse(userData);
    fetchOwnerProfile(parsed.userId);
  }, []);

  const fetchOwnerProfile = async (ownerId) => {
    try {
      const res = await fetch(`/api/getownerprofile?ownerId=${ownerId}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to load profile');
      } else {
        // Check if subscription has expired
        const subscription = data.data.owner.subscription;
        if (subscription?.expiresAt) {
          const expiryDate = new Date(subscription.expiresAt);
          const now = new Date();
          if (expiryDate < now) {
            // Subscription expired
            setOwner(null);
            setEmployees([]);
            setProperties([]);
            setError('SUBSCRIPTION_EXPIRED');
            setLoading(false);
            return;
          }
        }

        setOwner(data.data.owner);
        setEmployees(data.data.employees);
        setProperties(data.data.properties);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-sm text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (error === 'SUBSCRIPTION_EXPIRED') {
      return (
        <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-800 shadow-xl text-center">
            <div className="text-4xl mb-4 text-slate-200">Subscription expired</div>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">
              Your subscription has expired. Please contact Marmik to renew your subscription and continue using the platform.
            </p>
            <div className="bg-slate-950 rounded-lg p-4 mb-6 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Contact</p>
              <p className="text-base font-medium text-slate-100">Marmik</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                router.push('/');
              }}
              className="w-full bg-rose-600 px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm sm:text-base border border-rose-500/60"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#0b0e14] text-rose-300 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg sm:text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-rose-600 px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors text-sm sm:text-base border border-rose-500/60 text-slate-100"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-800 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-100">
                  {owner?.companyName || 'Owner Dashboard'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">Welcome, {owner?.name}</p>
              </div>
              <div className="mt-1">
                <HelpButton context="owner-dashboard" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => router.push('/owner/createemployee')}
                className="bg-slate-100 text-slate-900 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-xs sm:text-sm flex-1 sm:flex-none"
              >
                + Employee
              </button>
              <button
                onClick={() => router.push('/owner/createproperty')}
                className="bg-slate-800 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium text-xs sm:text-sm flex-1 sm:flex-none border border-slate-700"
              >
                + Property
              </button>
              <button
                onClick={handleLogout}
                className="bg-rose-600 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-rose-700 transition-colors font-medium text-xs sm:text-sm flex-1 sm:flex-none border border-rose-500/60"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Owner Info Card */}
        <div className="bg-slate-900 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-slate-800 shadow-md">
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5 text-slate-100">Owner profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Name</p>
              <p className="text-base sm:text-xl font-medium text-slate-100">{owner?.name}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Company</p>
              <p className="text-base sm:text-xl font-medium text-slate-100">{owner?.companyName || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Email</p>
              <p className="text-sm sm:text-lg font-medium text-slate-300 break-all">{owner?.email}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Subscription</p>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-slate-300">
                  {properties.length}/{owner?.subscription?.maxProperties || 2} Properties
                </span>
                <span className="text-gray-500 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm text-slate-300">
                  {employees.length}/{owner?.subscription?.maxEmployees || 1} Employees
                </span>
              </div>
              {owner?.subscription?.expiresAt && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Expires on</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-100">
                    {new Date(owner.subscription.expiresAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Employees */}
          <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-medium text-slate-100">Employees</h2>
              <span className="text-xs sm:text-sm text-slate-400">{employees.length}</span>
            </div>
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-base sm:text-lg">No employees yet</p>
                <button
                  onClick={() => router.push('/owner/createemployee')}
                  className="mt-4 bg-slate-100 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Create First Employee
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => (
                  <div
                    key={emp._id}
                    className="bg-slate-950 hover:bg-slate-900 rounded-lg p-4 cursor-pointer transition-all duration-200 border border-slate-800 hover:border-slate-600"
                    onClick={() => router.push(`/owner/employee/${emp._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-lg text-slate-100">{emp.name}</div>
                        <div className="text-sm text-slate-400 mt-1 break-all">{emp.email}</div>
                      </div>
                      <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200">Employee</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-medium text-slate-100">Properties</h2>
              <span className="text-xs sm:text-sm text-slate-400">{properties.length}</span>
            </div>
            {properties.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-slate-400 text-base sm:text-lg">No properties yet</p>
                <button
                  onClick={() => router.push('/owner/createproperty')}
                  className="mt-4 bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm sm:text-base border border-slate-700"
                >
                  Create First Property
                </button>
              </div>
            ) : (
            <div className="space-y-2 sm:space-y-3">
              {properties.map((prop) => (
                <div
                  key={prop._id}
                  className="bg-slate-950 rounded-xl p-3 sm:p-5 cursor-pointer transition-all duration-200 border border-slate-800 hover:border-slate-600 hover:bg-slate-900"
                  onClick={() => router.push(`/owner/property/${prop._id}`)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base sm:text-lg text-slate-100 mb-1 truncate">{prop.name}</div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold ${
                          prop.status === 'active' 
                            ? 'bg-emerald-600/80 text-emerald-50 border border-emerald-500/60' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}>
                          {prop.status === 'active' ? '✓ Active' : prop.status}
                        </span>
                        {prop.pendingTasksCount > 0 && (
                          <span className="bg-rose-500/10 border border-rose-500/40 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold text-rose-200">
                            {prop.pendingTasksCount} pending
                          </span>
                        )}
                        {prop.pendingTasksCount === 0 && (
                          <span className="text-slate-500 text-xs sm:text-sm">No pending tasks</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
