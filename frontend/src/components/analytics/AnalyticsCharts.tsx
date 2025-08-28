import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

interface AnalyticsChartsProps {
  tasks: Task[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ tasks }) => {
  // Status distribution data for pie chart
  const statusData = useMemo(() => {
    const statusCounts = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
    };

    tasks.forEach(task => {
      statusCounts[task.status]++;
    });

    return [
      { name: 'To Do', value: statusCounts[TaskStatus.TODO], color: '#64748b' },
      { name: 'In Progress', value: statusCounts[TaskStatus.IN_PROGRESS], color: '#3b82f6' },
      { name: 'Completed', value: statusCounts[TaskStatus.COMPLETED], color: '#10b981' },
    ];
  }, [tasks]);

  // Priority distribution data for bar chart
  const priorityData = useMemo(() => {
    const priorityCounts = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
    };

    tasks.forEach(task => {
      priorityCounts[task.priority]++;
    });

    return [
      { name: 'Low', count: priorityCounts[TaskPriority.LOW], color: '#10b981' },
      { name: 'Medium', count: priorityCounts[TaskPriority.MEDIUM], color: '#f59e0b' },
      { name: 'High', count: priorityCounts[TaskPriority.HIGH], color: '#ef4444' },
    ];
  }, [tasks]);

  // Daily completion data for line chart (last 7 days)
  const dailyCompletionData = useMemo(() => {
    const today = new Date();
    const lastWeek = subDays(today, 6);
    const days = eachDayOfInterval({ start: lastWeek, end: today });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const completedTasks = tasks.filter(task => 
        task.status === TaskStatus.COMPLETED &&
        task.completedAt &&
        format(new Date(task.completedAt), 'yyyy-MM-dd') === dayStr
      ).length;

      return {
        date: format(day, 'MMM dd'),
        completed: completedTasks,
      };
    });
  }, [tasks]);

  // Weekly productivity data
  const weeklyProductivityData = useMemo(() => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7));
      const weekEnd = endOfWeek(weekStart);
      
      const weekTasks = tasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        return createdDate >= weekStart && createdDate <= weekEnd;
      });
      
      const completedTasks = weekTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
      const totalTasks = weekTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      weeks.push({
        week: format(weekStart, 'MMM dd'),
        'Completion Rate': completionRate,
        'Total Tasks': totalTasks,
        'Completed': completedTasks,
      });
    }
    
    return weeks;
  }, [tasks]);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(task => task.status === TaskStatus.COMPLETED).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">
            {tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Completion Rate</div>
          <div className="text-2xl font-bold text-purple-600">
            {tasks.length > 0 
              ? Math.round((tasks.filter(task => task.status === TaskStatus.COMPLETED).length / tasks.length) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Completion Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Completions (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Productivity Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Productivity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyProductivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Completion Rate" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Efficiency Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(task => 
                task.status === TaskStatus.COMPLETED && 
                task.priority === TaskPriority.HIGH
              ).length}
            </div>
            <div className="text-sm text-gray-500">High Priority Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(() => {
                const completedTasks = tasks.filter(task => 
                  task.status === TaskStatus.COMPLETED && 
                  task.createdAt && 
                  task.completedAt
                );
                
                if (completedTasks.length === 0) return '0';
                
                const avgDays = completedTasks.reduce((sum, task) => {
                  const created = new Date(task.createdAt);
                  const completed = new Date(task.completedAt!);
                  return sum + Math.abs(completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                }, 0) / completedTasks.length;
                
                return avgDays.toFixed(1);
              })()}
            </div>
            <div className="text-sm text-gray-500">Avg Days to Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((tasks.filter(task => task.status === TaskStatus.COMPLETED).length / Math.max(tasks.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-500">Overall Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};