'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import jwt from 'jsonwebtoken';

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;

  const [ownerId, setOwnerId] = useState(null);
  const [property, setProperty] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  console.log("Frontend - propertyId from params:", propertyId);

  // Mark as client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get ownerId safely
  useEffect(() => {
    if (!isClient) return;

    // 1️⃣ Try localStorage (login sets it)
    let storedOwnerId = localStorage.getItem('ownerId');

    // 2️⃣ Fallback: decode JWT if missing
    if (!storedOwnerId) {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwt.decode(token);
        if (decoded?.role === 'owner') storedOwnerId = decoded.id;
      }
    }

    if (!storedOwnerId) {
      console.warn("No ownerId found");
      setError("You must be logged in as owner to edit a property.");
      setLoading(false);
      return;
    }

    setOwnerId(storedOwnerId);
  }, [isClient]);

  // Fetch property and employees
  useEffect(() => {
    if (!ownerId || !propertyId) {
      if (!propertyId) {
        setError('Invalid property ID');
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch property
        const resProperty = await fetch('/api/getownerprofile/property', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: propertyId }),
        });
        
        if (!resProperty.ok) {
          const text = await resProperty.text();
          throw new Error(`Failed to fetch property: ${resProperty.status} ${resProperty.statusText}`);
        }
        
        const dataProperty = await resProperty.json();
        if (!dataProperty.success) throw new Error(dataProperty.message);

        console.log("Frontend - property data fetched:", dataProperty.data);

        setProperty(dataProperty.data);
        setName(dataProperty.data.name);
        setStatus(dataProperty.data.status);
        setSelectedEmployees(dataProperty.data.employees.map(emp => emp._id));

        // Fetch all employees
        const resEmployees = await fetch('/api/getownerprofile/getallemployees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId }),
        });
        
        if (!resEmployees.ok) {
          const text = await resEmployees.text();
          throw new Error(`Failed to fetch employees: ${resEmployees.status} ${resEmployees.statusText}`);
        }
        
        const dataEmployees = await resEmployees.json();
        if (!dataEmployees.success) throw new Error(dataEmployees.message);

        setEmployees(dataEmployees.data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ownerId, propertyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch("/api/getownerprofile/property/editproperty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          name,
          status,
          employeeIds: selectedEmployees,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update property: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Frontend - Edit response:", data);
      if (!data.success) throw new Error(data.message);

      router.push(`/owner/property/${propertyId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update property");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (error)
    return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push(`/owner/property/${propertyId}`)}
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-blue-400">Edit Property</h1>
        </div>

        {error && (
          <div className="bg-red-700/50 border border-red-600 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-xl">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Property Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Assign Employees (Hold Ctrl/Cmd to select multiple)
            </label>
            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 max-h-64 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No employees available. Create employees first.</p>
              ) : (
                <div className="space-y-2">
                  {employees.map(emp => {
                    const isSelected = selectedEmployees.includes(emp._id);
                    return (
                      <label
                        key={emp._id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
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
                              setSelectedEmployees([...selectedEmployees, emp._id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== emp._id));
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">{emp.name}</div>
                          <div className="text-sm text-gray-400">{emp.email}</div>
                        </div>
                        {isSelected && (
                          <span className="text-blue-400 text-xl">✓</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedEmployees.length} employee(s) selected
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors font-medium text-lg"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/owner/property/${propertyId}`)}
              className="bg-gray-600 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
