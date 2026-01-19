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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/owner')}
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Employee Details</h1>
        </div>
        <button
          onClick={handleDeleteEmployee}
          className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete Employee
        </button>
      </div>

      {error && (
        <div className="bg-red-700 p-3 rounded mb-4 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Info */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Employee Information</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {employee?.name}</p>
            <p><strong>Email:</strong> {employee?.email}</p>
            <p><strong>Role:</strong> {employee?.role}</p>
          </div>
        </div>

        {/* Property Assignment */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Assign Properties</h2>
          {allProperties.length === 0 ? (
            <p className="text-gray-400">No properties available</p>
          ) : (
            <>
              <div className="mb-4 max-h-64 overflow-y-auto">
                <select
                  multiple
                  value={selectedProperties}
                  onChange={(e) =>
                    setSelectedProperties(Array.from(e.target.selectedOptions, o => o.value))
                  }
                  className="w-full p-2 rounded text-black min-h-48"
                >
                  {allProperties.map(prop => (
                    <option key={prop._id} value={prop._id}>
                      {prop.name} ({prop.status})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-400 mt-2">
                  Hold Ctrl (or Cmd on Mac) to select multiple properties
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
              >
                {saving ? 'Saving...' : 'Save Assignments'}
              </button>
            </>
          )}
        </div>

        {/* Currently Assigned Properties */}
        <div className="bg-gray-800 p-4 rounded md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Assigned Properties</h2>
          {selectedProperties.length === 0 ? (
            <p className="text-gray-400">No properties assigned yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allProperties
                .filter(prop => selectedProperties.includes(prop._id))
                .map(prop => (
                  <div
                    key={prop._id}
                    className="bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600"
                    onClick={() => router.push(`/owner/property/${prop._id}`)}
                  >
                    <div className="font-medium">{prop.name}</div>
                    <div className="text-sm text-gray-400">Status: {prop.status}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
