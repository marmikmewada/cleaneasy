'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-red-400 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-blue-400">
              {owner?.companyName || 'Employee Dashboard'}
            </h1>
            <p className="text-sm text-gray-400">Welcome, {employee?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Employee Info Card */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md rounded-xl p-6 mb-6 border-2 border-blue-500/50 shadow-2xl">
          <h2 className="text-xl font-semibold mb-5 text-blue-400 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            My Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Your Name</p>
              <p className="text-xl font-bold text-white">{employee?.name}</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Company</p>
              <p className="text-xl font-bold text-white">{owner?.companyName || 'N/A'}</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Email</p>
              <p className="text-lg font-medium text-gray-300">{employee?.email}</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Manager</p>
              <p className="text-lg font-medium text-gray-300">{owner?.name}</p>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-blue-400 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            My Properties ({properties.length})
          </h2>
          {properties.length === 0 ? (
            <div className="text-center py-12 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-gray-300 text-xl mb-2">No properties assigned yet</p>
              <p className="text-gray-500 text-sm">Contact your manager to get assigned to properties</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((prop) => (
                <div
                  key={prop._id}
                  className="bg-gradient-to-br from-gray-700/50 to-gray-600/50 hover:from-gray-600/70 hover:to-gray-500/70 rounded-xl p-5 cursor-pointer transition-all duration-300 border-2 border-gray-600 hover:border-blue-500 hover:shadow-2xl hover:scale-105 transform"
                  onClick={() => router.push(`/employee/property/${prop._id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{prop.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      prop.status === 'active' 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {prop.status === 'active' ? '✓ Active' : prop.status}
                    </span>
                  </div>
                  {prop.pendingTasksCount > 0 ? (
                    <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        <div>
                          <div className="text-red-300 font-bold text-lg">{prop.pendingTasksCount}</div>
                          <div className="text-red-400 text-xs">Tasks Pending</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-3">
                      <span className="text-lg">✅</span>
                      <span>All tasks completed!</span>
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
