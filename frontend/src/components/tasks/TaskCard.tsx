import React from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onShare?: (task: Task) => void;
  onViewSubTasks?: (task: Task) => void;
  onManageDependencies?: (task: Task) => void;
}

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGH:
      return 'border-l-red-500 bg-red-50';
    case TaskPriority.MEDIUM:
      return 'border-l-yellow-500 bg-yellow-50';
    case TaskPriority.LOW:
      return 'border-l-green-500 bg-green-50';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.COMPLETED:
      return 'text-green-600 bg-green-100';
    case TaskStatus.IN_PROGRESS:
      return 'text-blue-600 bg-blue-100';
    case TaskStatus.TODO:
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  onShare,
  onViewSubTasks,
  onManageDependencies 
}) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(task.id, e.target.value as TaskStatus);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${getPriorityColor(task.priority)}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900">
          {task.parentTaskId && <span className="text-blue-600 text-sm mr-2">↳</span>}
          {task.title}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          {onShare && (
            <button
              onClick={() => onShare(task)}
              className="text-purple-600 hover:text-purple-800 text-sm"
            >
              Share
            </button>
          )}
          {onViewSubTasks && (
            <button
              onClick={() => onViewSubTasks(task)}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Sub-tasks
            </button>
          )}
          {onManageDependencies && (
            <button
              onClick={() => onManageDependencies(task)}
              className="text-orange-600 hover:text-orange-800 text-sm"
            >
              Dependencies
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-gray-600 mb-3">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
            {task.priority.toUpperCase()}
          </span>
          {task.category && (
            <span 
              className="px-2 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: task.category.color }}
            >
              {task.category.name}
            </span>
          )}
          {task.tags && task.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: tag.color || '#3B82F6' }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
        
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={TaskStatus.TODO}>To Do</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.COMPLETED}>Completed</option>
        </select>
      </div>
      
      {task.dueDate && (
        <div className="mt-2 text-sm text-gray-500">
          Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
        </div>
      )}

      {/* Sub-tasks progress */}
      {task.subTasks && task.subTasks.length > 0 && (
        <div className="mt-2">
          <div className="text-sm text-gray-600 mb-1">
            Sub-tasks: {task.subTasks.filter(st => st.status === TaskStatus.COMPLETED).length}/{task.subTasks.length} completed
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${task.progress || 0}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Dependencies warning */}
      {task.predecessorDependencies && task.predecessorDependencies.some(dep => 
        dep.predecessorTask?.status !== TaskStatus.COMPLETED
      ) && (
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-sm text-yellow-800">
          ⚠️ Blocked by incomplete dependencies
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-400">
        Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')}
      </div>
    </div>
  );
};