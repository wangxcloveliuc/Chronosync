import React from 'react';
import { TaskStats } from '@/types';

interface StatsCardsProps {
  stats: TaskStats | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      color: 'bg-blue-500',
      icon: '📋',
    },
    {
      title: 'Completed',
      value: stats.completed,
      color: 'bg-green-500',
      icon: '✅',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      color: 'bg-yellow-500',
      icon: '🔄',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      color: 'bg-purple-500',
      icon: '📊',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${card.color} text-white mr-4`}>
              <span className="text-xl">{card.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};