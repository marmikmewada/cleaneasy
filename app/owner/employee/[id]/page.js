'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EmployeePage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'owner') {
      router.push('/');
      return;
    }

    if (!id) {
      setError('Invalid employee ID');
      setLoading(false);
      return;
    }

    fetchEmployeeData();
  }, [id, router]);

  const fetchEmployeeData = async () => {
    try {
      // Fetch employee details
      const resEmployee = await fetch('/api/getownerprofile/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!resEmployee.ok) {
        throw new Error(`Failed to fetch employee: ${resEmployee.status}`);
      }

      const dataEmployee = await resEmployee.json();
      if (!dataEmployee.success) {
        throw new Error(dataEmployee.message || 'Failed to fetch employee');
      }
      setEmployee(dataEmployee.data);

      // Fetch all properties and employee's assigned properties
      const resProperties = await fetch('/api/getownerprofile/employee/getproperties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: id })
      });

      if (!resProperties.ok) {
        throw new Error(`Failed to fetch properties: ${resProperties.status}`);
      }

      const dataProperties = await resProperties.json();
      if (!dataProperties.success) {
        throw new Error(dataProperties.message || 'Failed to fetch properties');
      }

      setAllProperties(dataProperties.data.allProperties);
      setSelectedProperties(dataProperties.data.employeeProperties);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!confirm('Are you sure you want to delete this employee? This will remove them from all properties and cannot be undone. They will not be able to login anymore.')) {
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const res = await fetch('/api/employee/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: id,
          ownerId: userData.userId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to delete employee');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete employee');
      }

      alert('Employee deleted successfully!');
      router.push('/owner');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete employee');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/getownerprofile/employee/assignproperties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: id,
          propertyIds: selectedProperties,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to assign properties: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to assign properties');
      }

      // Refresh data
      await fetchEmployeeData();
      alert('Properties assigned successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to assign properties');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );

  if (error && !employee)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/owner')}
              className="bg-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              ← Back
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400">Employee Details</h1>
          </div>
          <button
            onClick={handleDeleteEmployee}
            className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Delete Employee
          </button>
        </div>

        {error && (
          <div className="bg-red-700/50 border border-red-600 p-3 sm:p-4 rounded-lg mb-6 text-center text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Employee Info */}
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-blue-500/50 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-400 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">👤</span>
              Employee Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Name</p>
                <p className="text-base sm:text-lg font-bold text-white">{employee?.name}</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Email</p>
                <p className="text-base sm:text-lg font-medium text-gray-300 break-all">{employee?.email}</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600 sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Role</p>
                <p className="text-base sm:text-lg font-medium text-white">{employee?.role}</p>
              </div>
            </div>
          </div>

          {/* Property Assignment */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700 shadow-xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-400 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🏢</span>
              Assign Properties
            </h2>
            {allProperties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm sm:text-base">No properties available</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">Create properties first to assign them</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600 max-h-64 sm:max-h-80 overflow-y-auto mb-4">
                  {allProperties.map(prop => {
                    const isSelected = selectedProperties.includes(prop._id);
                    return (
                      <label
                        key={prop._id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                          isSelected
                            ? 'bg-blue-600/50 border-2 border-blue-500'
                            : 'bg-gray-600/30 border-2 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProperties([...selectedProperties, prop._id]);
                            } else {
                              setSelectedProperties(selectedProperties.filter(id => id !== prop._id));
                            }
                          }}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm sm:text-base truncate">{prop.name}</div>
                          <div className="text-xs sm:text-sm text-gray-400">{prop.status}</div>
                        </div>
                        {isSelected && (
                          <span className="text-blue-400 text-lg sm:text-xl flex-shrink-0">✓</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 text-center">
                  {selectedProperties.length} property(s) selected
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                >
                  {saving ? 'Saving...' : 'Save Assignments'}
                </button>
              </>
            )}
          </div>

          {/* Currently Assigned Properties */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700 shadow-xl lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-400 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">📋</span>
              Assigned Properties ({selectedProperties.length})
            </h2>
            {selectedProperties.length === 0 ? (
              <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-gray-600">
                <p className="text-gray-400 text-sm sm:text-base">No properties assigned yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {allProperties
                  .filter(prop => selectedProperties.includes(prop._id))
                  .map(prop => (
                    <div
                      key={prop._id}
                      className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-gray-600/70 hover:to-gray-500/70 rounded-xl p-4 cursor-pointer transition-all duration-300 border-2 border-gray-600 hover:border-green-500 hover:shadow-lg hover:scale-105 transform"
                      onClick={() => router.push(`/owner/property/${prop._id}`)}
                    >
                      <div className="font-bold text-base sm:text-lg text-white mb-2">{prop.name}</div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          prop.status === 'active' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {prop.status}
                        </span>
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
