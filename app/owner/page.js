'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-red-400 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-blue-400">
              {owner?.companyName || 'Owner Dashboard'}
            </h1>
            <p className="text-sm text-gray-400">Welcome, {owner?.name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/owner/createemployee')}
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Create Employee
            </button>
            <button
              onClick={() => router.push('/owner/createproperty')}
              className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              + Create Property
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employees */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-400">Employees</h2>
              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                {employees.length}
              </span>
            </div>
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No employees yet</p>
                <button
                  onClick={() => router.push('/owner/createemployee')}
                  className="mt-4 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Employee
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => (
                  <div
                    key={emp._id}
                    className="bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200 border border-gray-600 hover:border-blue-500"
                    onClick={() => router.push(`/owner/employee/${emp._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-lg">{emp.name}</div>
                        <div className="text-sm text-gray-400 mt-1">{emp.email}</div>
                      </div>
                      <span className="bg-gray-600 px-2 py-1 rounded text-xs">Employee</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-400">Properties</h2>
              <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                {properties.length}
              </span>
            </div>
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No properties yet</p>
                <button
                  onClick={() => router.push('/owner/createproperty')}
                  className="mt-4 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create First Property
                </button>
              </div>
            ) : (
            <div className="space-y-3">
              {properties.map((prop) => (
                <div
                  key={prop._id}
                  className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-gray-600/70 hover:to-gray-500/70 rounded-xl p-5 cursor-pointer transition-all duration-300 border-2 border-gray-600 hover:border-green-500 hover:shadow-xl hover:scale-105 transform"
                  onClick={() => router.push(`/owner/property/${prop._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-xl text-white mb-2">{prop.name}</div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          prop.status === 'active' 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {prop.status === 'active' ? '✓ Active' : prop.status}
                        </span>
                        {prop.pendingTasksCount > 0 && (
                          <span className="bg-red-500 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg shadow-red-500/50 flex items-center gap-1">
                            <span>📋</span>
                            <span>{prop.pendingTasksCount} Pending</span>
                          </span>
                        )}
                        {prop.pendingTasksCount === 0 && (
                          <span className="text-gray-500 text-sm">No pending tasks</span>
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
