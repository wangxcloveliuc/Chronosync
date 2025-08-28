import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TaskStats } from '@/types';

interface ProductivityReportProps {
  stats: TaskStats | null;
}

export const ProductivityReport: React.FC<ProductivityReportProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Report</h3>
        <div className="text-center text-gray-500">Loading productivity data...</div>
      </div>
    );
  }

  // Priority completion rate data for bar chart
  const priorityCompletionData = [
    {
      priority: 'High',
      completionRate: stats.productivity.highPriorityCompletionRate,
      total: stats.priorityBreakdown.high.total,
      completed: stats.priorityBreakdown.high.completed,
      color: '#ef4444'
    },
    {
      priority: 'Medium',
      completionRate: stats.productivity.mediumPriorityCompletionRate,
      total: stats.priorityBreakdown.medium.total,
      completed: stats.priorityBreakdown.medium.completed,
      color: '#f59e0b'
    },
    {
      priority: 'Low',
      completionRate: stats.productivity.lowPriorityCompletionRate,
      total: stats.priorityBreakdown.low.total,
      completed: stats.priorityBreakdown.low.completed,
      color: '#10b981'
    }
  ];

  // Completion time data for display
  const completionTimeData = [
    {
      priority: 'High',
      avgHours: stats.completionTime.byPriority.high.averageHours,
      count: stats.completionTime.byPriority.high.count,
      color: '#ef4444'
    },
    {
      priority: 'Medium',
      avgHours: stats.completionTime.byPriority.medium.averageHours,
      count: stats.completionTime.byPriority.medium.count,
      color: '#f59e0b'
    },
    {
      priority: 'Low',
      avgHours: stats.completionTime.byPriority.low.averageHours,
      count: stats.completionTime.byPriority.low.count,
      color: '#10b981'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Productivity Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.completionTime.averageCompletionHours}h
            </div>
            <div className="text-sm text-gray-500">Avg Completion Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats.productivity.highPriorityCompletionRate}%
            </div>
            <div className="text-sm text-gray-500">High Priority Success</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {stats.productivity.mediumPriorityCompletionRate}%
            </div>
            <div className="text-sm text-gray-500">Medium Priority Success</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.productivity.lowPriorityCompletionRate}%
            </div>
            <div className="text-sm text-gray-500">Low Priority Success</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Completion Rates */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate by Priority</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Completion Rate']}
                labelFormatter={(label) => `${label} Priority`}
              />
              <Bar dataKey="completionRate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Completion Times */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Average Completion Time by Priority</h4>
          <div className="space-y-4">
            {completionTimeData.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium">{item.priority} Priority</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{item.avgHours}h</div>
                  <div className="text-sm text-gray-500">{item.count} tasks</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Breakdown Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Priority Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priorityCompletionData.map((priority) => (
                <tr key={priority.priority}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: priority.color }}
                      ></div>
                      <span className="font-medium">{priority.priority}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {priority.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {priority.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      priority.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                      priority.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {priority.completionRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {completionTimeData.find(d => d.priority === priority.priority)?.avgHours || 0}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};