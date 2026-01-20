'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HelpButton from '../components/HelpButton';

export default function EmployeePage() {
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userData = localStorage.getItem('userData');

    if (role !== 'employee' || !userData) {
      router.push('/');
      return;
    }

    const parsed = JSON.parse(userData);
    fetchEmployeeProfile(parsed.userId);
  }, [router]);

  const fetchEmployeeProfile = async (employeeId) => {
    try {
      const res = await fetch('/api/employee/getprofile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to load profile');
      } else {
        setEmployee(data.data.employee);
        setOwner(data.data.owner);
        setProperties(data.data.properties);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-rose-300 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="bg-rose-600 px-4 py-2 rounded hover:bg-rose-700 border border-rose-500/60 text-slate-100"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-800 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-100">
                  {owner?.companyName || 'Employee Dashboard'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">Welcome, {employee?.name}</p>
              </div>
              <HelpButton context="employee-dashboard" />
            </div>
            <button
              onClick={handleLogout}
              className="bg-rose-600 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-rose-700 transition-colors text-xs sm:text-sm w-full sm:w-auto border border-rose-500/60"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Employee Info Card */}
        <div className="bg-slate-900 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-slate-800 shadow-md">
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5 text-slate-100">
            My profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Name</p>
              <p className="text-base sm:text-xl font-medium text-slate-100">{employee?.name}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Company</p>
              <p className="text-base sm:text-xl font-medium text-slate-100">{owner?.companyName || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Email</p>
              <p className="text-sm sm:text-lg font-medium text-slate-300 break-all">{employee?.email}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Manager</p>
              <p className="text-sm sm:text-lg font-medium text-slate-300">{owner?.name}</p>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-md">
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-6 text-slate-100">
            My properties <span className="text-slate-400">({properties.length})</span>
          </h2>
          {properties.length === 0 ? (
            <div className="text-center py-12 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-slate-200 text-base sm:text-lg mb-2">No properties assigned yet</p>
              <p className="text-slate-500 text-sm">Ask your manager to assign you to a property.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {properties.map((prop) => (
                <div
                  key={prop._id}
                  className="bg-slate-950 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-200 border border-slate-800 hover:border-slate-600 hover:bg-slate-900"
                  onClick={() => router.push(`/employee/property/${prop._id}`)}
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-medium text-slate-100 mb-1 truncate">{prop.name}</h3>
                    </div>
                    <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      prop.status === 'active' 
                        ? 'bg-emerald-600/80 text-emerald-50 border border-emerald-500/60' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}>
                      {prop.status === 'active' ? '✓ Active' : prop.status}
                    </span>
                  </div>
                  {prop.pendingTasksCount > 0 ? (
                    <div className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-2 sm:p-3 mt-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-rose-200 font-semibold text-base sm:text-lg">{prop.pendingTasksCount}</div>
                          <div className="text-rose-300/80 text-xs">Pending tasks</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-400 mt-3">
                      No pending tasks
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
