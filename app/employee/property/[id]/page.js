'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EmployeePropertyPage() {
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
    if (role !== 'employee') {
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

  const fetchProperty = async () => {
    try {
      // First check if employee has access to this property
      const userData = JSON.parse(localStorage.getItem('userData'));
      const role = localStorage.getItem('role');
      
      const accessRes = await fetch('/api/property/checkaccess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          userId: userData.userId,
          role
        })
      });

      if (accessRes.ok) {
        const accessData = await accessRes.json();
        if (!accessData.success || !accessData.hasAccess) {
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

  const handleFilterCompletedTasks = () => {
    // Only load completed tasks when user explicitly filters
    fetchTasks({
      includeCompleted: true,
      start: startDate || null,
      end: endDate || null,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error && !property)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-red-400 flex items-center justify-center">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/employee')}
              className="bg-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              ← Back
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400 truncate">Property: {property?.name}</h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-700/50 backdrop-blur-md border border-red-600 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Property Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700 shadow-xl mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-400">Property Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-lg font-medium">{property?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                    property?.status === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {property?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Create Task */}
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-green-500/50 shadow-2xl">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-400 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">➕</span>
                Add New Task
              </h2>
              <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 px-4 py-3 sm:px-5 sm:py-4 bg-gray-700/50 rounded-xl text-white text-base sm:text-lg border-2 border-gray-600 focus:border-green-500 focus:outline-none transition-all"
                  disabled={creatingTask}
                />
                <button
                  type="submit"
                  disabled={creatingTask || !newTaskTitle.trim()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-600 transition-all font-bold text-sm sm:text-lg shadow-lg shadow-green-500/50"
                >
                  {creatingTask ? 'Adding...' : '➕ Add'}
                </button>
              </form>
            </div>

            {/* Pending Tasks */}
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-yellow-500/50 shadow-2xl">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-yellow-400 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📝</span>
                Tasks To Do ({pendingTasks.length})
              </h2>
              {tasksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : pendingTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No pending tasks</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {pendingTasks.map(task => (
                    <div key={task._id} className="bg-gradient-to-r from-gray-700/70 to-gray-600/70 rounded-xl p-3 sm:p-5 border-2 border-yellow-500/50 shadow-lg hover:shadow-xl transition-all">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base sm:text-xl text-white mb-2 break-words">{task.title}</p>
                          <p className="text-xs sm:text-sm text-gray-300">
                            <span className="font-medium">Added by:</span> {task.createdBy?.name || 'Unknown'} 
                            <span className="text-gray-500"> • </span>
                            <span className="break-all">{formatDate(task.createdAt)}</span>
                          </p>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                          <span className="bg-yellow-500 px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs font-bold text-white shadow-lg">⏳ To Do</span>
                          <button
                            onClick={() => handleCompleteTask(task._id)}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs font-bold text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/50 flex-1 sm:flex-none"
                          >
                            ✓ Mark Done
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-green-500/50 shadow-2xl">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-400 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">✅</span>
                Completed Tasks ({completedTasks.length})
              </h2>
              
              {/* Date Filter */}
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm mb-1 sm:mb-2 text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700/50 rounded-lg text-white text-sm sm:text-base border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1 sm:mb-2 text-gray-400">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700/50 rounded-lg text-white text-sm sm:text-base border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleFilterCompletedTasks}
                  className="col-span-1 sm:col-span-2 bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm sm:text-base"
                >
                  Filter Tasks
                </button>
              </div>

              {tasksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : completedTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No completed tasks found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {completedTasks.map(task => (
                    <div key={task._id} className="bg-gradient-to-r from-green-700/40 to-emerald-700/40 rounded-xl p-5 border-2 border-green-500/50 shadow-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-white mb-2 line-through decoration-gray-400">{task.title}</p>
                          <p className="text-sm text-gray-300 mb-1">
                            <span className="font-medium">Added by:</span> {task.createdBy?.name || 'Unknown'}
                            <span className="text-gray-500"> • </span>
                            {formatDate(task.createdAt)}
                          </p>
                          <p className="text-sm text-green-300 font-medium">
                            <span className="text-green-400">✓ Completed by:</span> {task.completedBy?.name || 'Unknown'}
                            <span className="text-gray-500"> • </span>
                            {formatDate(task.completedAt)}
                          </p>
                        </div>
                        <span className="bg-green-500 px-4 py-2 rounded-lg text-xs font-bold text-white ml-4 shadow-lg shadow-green-500/50">✓ Done</span>
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
