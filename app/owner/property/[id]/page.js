'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HelpButton from '../../../components/HelpButton';

export default function PropertyPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Task creation
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  
  // Date filtering for completed tasks
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'owner' && role !== 'employee') {
      router.push('/');
      return;
    }

    if (!id) {
      setError('Invalid property ID');
      setLoading(false);
      return;
    }

    fetchProperty();
    fetchTasks();
  }, [id, router]);

  const checkAccess = async () => {
    const role = localStorage.getItem('role');
    if (role === 'owner') return true; // Owners always have access
    
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const res = await fetch('/api/property/checkaccess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          userId: userData.userId,
          role
        })
      });

      if (res.ok) {
        const data = await res.json();
        return data.success && data.hasAccess;
      }
      return false;
    } catch {
      return false;
    }
  };

  const fetchProperty = async () => {
    try {
      // Check access for employees
      const hasAccess = await checkAccess();
      if (!hasAccess) {
        const role = localStorage.getItem('role');
        if (role === 'employee') {
          setError('You do not have access to this property');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/getownerprofile/property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch property: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch property');
      }
      setProperty(data.data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async ({ includeCompleted = false, start = null, end = null } = {}) => {
    setTasksLoading(true);
    try {
      // Fetch pending tasks
      const resPending = await fetch('/api/tasks/getpropertytasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          status: 'pending'
        })
      });

      if (resPending.ok) {
        const dataPending = await resPending.json();
        if (dataPending.success) {
          setPendingTasks(dataPending.data);
        }
      }

      // Optionally fetch completed tasks (only when user explicitly filters)
      if (includeCompleted) {
        const resCompleted = await fetch('/api/tasks/getpropertytasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: id,
            status: 'completed',
            startDate: start || startDate || null,
            endDate: end || endDate || null
          })
        });

        if (resCompleted.ok) {
          const dataCompleted = await resCompleted.json();
          if (dataCompleted.success) {
            setCompletedTasks(dataCompleted.data);
          }
        }
      } else {
        // When not filtering, don't keep old completed list around
        setCompletedTasks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setCreatingTask(true);
    setError('');
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const res = await fetch('/api/tasks/createtask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          propertyId: id,
          createdBy: userData.userId
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create task: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create task');
      }

      setNewTaskTitle('');
      await fetchTasks(); // Refresh pending tasks only
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!confirm('Are you sure you want to delete this property? This will delete all associated tasks and cannot be undone.')) {
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const res = await fetch('/api/property/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          ownerId: userData.userId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to delete property');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete property');
      }

      alert('Property deleted successfully!');
      router.push(redirectPath);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete property');
    }
  };

  const handleFilterCompletedTasks = () => {
    // Only load completed tasks when user explicitly filters
    fetchTasks({
      includeCompleted: true,
      start: startDate || null,
      end: endDate || null,
    });
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const res = await fetch('/api/tasks/completetask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          completedBy: userData.userId
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to complete task: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to complete task');
      }

      await fetchTasks(); // Refresh pending tasks only
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to complete task');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const isEmployee = role === 'employee';
  const redirectPath = isEmployee ? '/employee' : '/owner';

  if (loading)
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-sm text-slate-300">Loading property...</p>
        </div>
      </div>
    );

  if (error && !property)
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-rose-300">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push(redirectPath)}
              className="bg-slate-800 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm sm:text-base border border-slate-700"
            >
              ← Back
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-100 truncate">
              Property: <span className="text-sky-400">{property?.name}</span>
            </h1>
            <HelpButton context="property-page" />
          </div>
          {!isEmployee && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => router.push(`/owner/property/${id}/edit`)}
                className="bg-slate-100 text-slate-900 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-slate-200 transition-colors text-xs sm:text-sm flex-1 sm:flex-none"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteProperty}
                className="bg-rose-600 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-rose-700 transition-colors text-xs sm:text-sm flex-1 sm:flex-none border border-rose-500/60"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-900/40 border border-rose-500/70 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-center text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Property Info */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-md mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-slate-100">Property information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
                  <p className="text-lg font-medium text-slate-100">{property?.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                    property?.status === 'active' 
                      ? 'bg-emerald-600/80 text-emerald-50 border border-emerald-500/60' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}>
                    {property?.status}
                  </span>
                </div>
                {!isEmployee && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Owner ID</p>
                    <p className="text-xs font-mono text-slate-300 break-all">{property?.ownerId}</p>
                  </div>
                )}
              </div>

              {!isEmployee && (
                <>
                  <h3 className="mt-4 font-medium text-slate-100">Assigned employees</h3>
                  {property?.employees?.length === 0 ? (
                    <p className="text-slate-500 text-sm mt-2">No employees assigned</p>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {property?.employees?.map(emp => (
                        <li key={emp._id} className="text-sm bg-slate-950 p-2 rounded border border-slate-800">
                          <div className="text-slate-100">{emp.name}</div>
                          <div className="text-xs text-slate-400 break-all">{emp.email}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>

        {/* Tasks Section */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Create Task */}
          <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-md">
            <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-slate-100">Create new task</h2>
            <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Short task description"
                className="flex-1 px-4 py-3 bg-slate-950 rounded-lg text-slate-100 text-sm sm:text-base border border-slate-700 focus:border-sky-500 focus:outline-none transition-colors"
                disabled={creatingTask}
              />
              <button
                type="submit"
                disabled={creatingTask || !newTaskTitle.trim()}
                className="bg-slate-100 text-slate-900 px-4 py-3 sm:px-6 sm:py-3 rounded-lg hover:bg-slate-200 disabled:bg-slate-700 disabled:text-slate-300 transition-colors font-medium text-sm sm:text-base"
              >
                {creatingTask ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>

            {/* Pending Tasks */}
            <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-md">
              <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-slate-100">Pending tasks</h2>
            {tasksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500 mx-auto"></div>
              </div>
            ) : pendingTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No pending tasks</p>
            ) : (
                <div className="space-y-2 sm:space-y-3">
                  {pendingTasks.map(task => (
                    <div key={task._id} className="bg-slate-950 rounded-lg p-3 sm:p-4 border border-slate-800">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base sm:text-lg break-words text-slate-100">{task.title}</p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1 break-all">
                            Created by: {task.createdBy?.name || 'Unknown'} on {formatDate(task.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <span className="bg-amber-500/20 border border-amber-500/60 px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-medium text-amber-200">Pending</span>
                          <button
                            onClick={() => handleCompleteTask(task._id)}
                            className="bg-slate-100 text-slate-900 px-3 py-1 rounded text-xs font-medium hover:bg-slate-200 transition-colors flex-1 sm:flex-none"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>

            {/* Completed Tasks */}
            <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-md">
              <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-slate-100">Completed tasks</h2>
              
              {/* Date Filter */}
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm mb-1 sm:mb-2 text-slate-500">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 rounded-lg text-slate-100 text-sm sm:text-base border border-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1 sm:mb-2 text-slate-500">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 rounded-lg text-slate-100 text-sm sm:text-base border border-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleFilterCompletedTasks}
                  className="col-span-1 sm:col-span-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm sm:text-base border border-slate-700"
                >
                  Filter Tasks
                </button>
              </div>

            {tasksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500 mx-auto"></div>
              </div>
            ) : completedTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No completed tasks found. Select dates and filter to view history.</p>
            ) : (
                <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                  {completedTasks.map(task => (
                    <div key={task._id} className="bg-slate-950 rounded-lg p-3 sm:p-4 border border-slate-800">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base sm:text-lg break-words text-slate-100 line-through decoration-slate-500">{task.title}</p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1 break-all">
                            Created by: {task.createdBy?.name || 'Unknown'} on {formatDate(task.createdAt)}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-400 break-all">
                            Completed by: {task.completedBy?.name || 'Unknown'} on {formatDate(task.completedAt)}
                          </p>
                        </div>
                        <span className="bg-emerald-600/80 border border-emerald-500/60 px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-medium sm:ml-4 mt-2 sm:mt-0 text-emerald-50">Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
