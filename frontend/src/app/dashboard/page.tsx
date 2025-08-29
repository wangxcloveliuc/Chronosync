'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { useTasks } from '@/hooks/useTasks';
import { useNotifications } from '@/hooks/useNotifications';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { StatsCards } from '@/components/tasks/StatsCards';
import { TaskSharing } from '@/components/tasks/TaskSharing';
import { Task, TaskStatus, CreateTaskData, UpdateTaskData } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<{ status?: TaskStatus; search?: string }>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  const {
    tasks,
    categories,
    stats,
    loading: tasksLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setError,
  } = useTasks();

  // Initialize notifications
  const { hasPermission, isSupported, requestPermission } = useNotifications({
    tasks,
    enabled: notificationsEnabled,
  });

  useEffect(() => {
    // Simple auth check
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetchTasks(filter);
    }
  }, [filter, loading]);

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleShareTask = (task: Task) => {
    setSharingTask(task);
  };

  const handleSubmitTask = async (taskData: CreateTaskData | UpdateTaskData) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask(taskData as CreateTaskData);
    }
  };

  const handleCancelForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(prev => ({ ...prev, search: e.target.value }));
  };

  const handleStatusFilter = (status?: TaskStatus) => {
    setFilter(prev => ({ ...prev, status }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        title="Chronosync Dashboard"
        showNotifications={isSupported}
        notificationsEnabled={notificationsEnabled}
        hasPermission={hasPermission}
        onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
        onRequestPermission={requestPermission}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Task Overview</h2>
              {isSupported && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Reminders:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    notificationsEnabled && hasPermission
                      ? 'bg-green-100 text-green-800'
                      : notificationsEnabled && !hasPermission
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {notificationsEnabled && hasPermission
                      ? 'Active'
                      : notificationsEnabled && !hasPermission
                      ? 'Pending Permission'
                      : 'Disabled'
                    }
                  </span>
                </div>
              )}
            </div>
            <StatsCards stats={stats} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
              <button 
                onClick={() => setError(null)} 
                className="float-right text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  + New Task
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusFilter()}
                    className={`px-3 py-2 text-sm rounded-md ${!filter.status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleStatusFilter(TaskStatus.TODO)}
                    className={`px-3 py-2 text-sm rounded-md ${filter.status === TaskStatus.TODO ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    To Do
                  </button>
                  <button
                    onClick={() => handleStatusFilter(TaskStatus.IN_PROGRESS)}
                    className={`px-3 py-2 text-sm rounded-md ${filter.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusFilter(TaskStatus.COMPLETED)}
                    className={`px-3 py-2 text-sm rounded-md ${filter.status === TaskStatus.COMPLETED ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filter.search || ''}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {tasksLoading ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-500">Loading tasks...</div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-500 mb-2">No tasks found</div>
                <p className="text-gray-400">
                  {filter.status || filter.search 
                    ? 'Try adjusting your filters or search term.'
                    : 'Create your first task to get started!'
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onShare={handleShareTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onSubmit={handleSubmitTask}
          onCancel={handleCancelForm}
          categories={categories}
          editTask={editingTask || undefined}
          mode={editingTask ? 'edit' : 'create'}
        />
      )}

      {/* Task Sharing Modal */}
      {sharingTask && (
        <TaskSharing
          task={sharingTask}
          onClose={() => setSharingTask(null)}
        />
      )}
    </div>
  );
}