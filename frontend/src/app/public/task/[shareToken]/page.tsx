"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task } from '@/types';
import api from '@/lib/api';

export default function SharedTaskPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchSharedTask = async () => {
      try {
        const shareToken = params.shareToken as string;
        const response = await api.get(`/public/tasks/shared/${shareToken}`);
        const taskData = response.data;
        setTask(taskData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared task');
      } finally {
        setLoading(false);
      }
    };

    if (params.shareToken) {
      fetchSharedTask();
    }
  }, [params.shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading shared task...</div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The shared task you\'re looking for might have been removed or expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'todo': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Shared Task</h1>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Visit Chronosync
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6">
            {/* Task Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {task.category && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                      {task.category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Task Description */}
            {task.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Task Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                <p className="text-gray-900">{new Date(task.createdAt).toLocaleString()}</p>
              </div>
              
              {task.dueDate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Due Date</h4>
                  <p className="text-gray-900">{new Date(task.dueDate).toLocaleString()}</p>
                </div>
              )}
              
              {task.completedAt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Completed</h4>
                  <p className="text-gray-900">{new Date(task.completedAt).toLocaleString()}</p>
                </div>
              )}

              {task.reminderTime && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Reminder</h4>
                  <p className="text-gray-900">{new Date(task.reminderTime).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="border-t pt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Want to create your own tasks?</h3>
                <p className="text-gray-600 mb-4">
                  Join Chronosync to create, manage, and share your own tasks and lists.
                </p>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 mr-3"
                >
                  Sign Up Now
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}