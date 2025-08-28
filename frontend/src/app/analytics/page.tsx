'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { useTasks } from '@/hooks/useTasks';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const {
    tasks,
    loading: tasksLoading,
  } = useTasks();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
  <NavBar title="Analytics Dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Task Analytics & Insights</h2>
            <p className="mt-2 text-gray-600">
              Track your productivity, completion rates, and task management efficiency over time.
            </p>
          </div>

          {/* Analytics Content */}
          {tasksLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-500">Loading analytics...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <div className="text-lg text-gray-500 mb-2">No data available</div>
              <p className="text-gray-400">
                Create some tasks to see your analytics and productivity insights.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Your First Task
              </button>
            </div>
          ) : (
            <AnalyticsCharts tasks={tasks} />
          )}
        </div>
      </main>
    </div>
  );
}