import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, CreateTaskData } from '@/types';
import { useTasks } from '@/hooks/useTasks';

interface SubTaskViewerProps {
  parentTask: Task;
  onClose: () => void;
}

export const SubTaskViewer: React.FC<SubTaskViewerProps> = ({ parentTask, onClose }) => {
  const { getSubTasks, createTask, updateTask } = useTasks();
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    parentTaskId: parentTask.id
  });
  const [loading, setLoading] = useState(false);

  const loadSubTasks = async () => {
    try {
      setLoading(true);
      const tasks = await getSubTasks(parentTask.id);
      setSubTasks(tasks);
    } catch (error) {
      console.error('Error loading sub-tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubTasks();
  }, [parentTask.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await createTask(formData);
      await loadSubTasks();
      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        parentTaskId: parentTask.id
      });
    } catch (error) {
      console.error('Error creating sub-task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setLoading(true);
      await updateTask(taskId, { status: newStatus });
      await loadSubTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    if (subTasks.length === 0) return 0;
    const completed = subTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / subTasks.length) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sub-tasks for "{parentTask.title}"
            </h2>
            <div className="text-sm text-gray-500 mt-1">
              Progress: {calculateProgress()}% ({subTasks.filter(t => t.status === TaskStatus.COMPLETED).length}/{subTasks.length} completed)
            </div>
            {/* Progress bar */}
            <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[calc(80vh-120px)] overflow-y-auto">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              Add Sub-task
            </button>
          )}

          {isCreating && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Create New Sub-task</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  Create Sub-task
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {subTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sub-tasks found. Create your first sub-task to break down this task!
              </div>
            ) : (
              subTasks.map((subTask) => (
                <div key={subTask.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{subTask.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subTask.status)}`}>
                          {subTask.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      {subTask.description && (
                        <p className="text-sm text-gray-600 mt-2">{subTask.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Created: {new Date(subTask.createdAt).toLocaleDateString()}
                        {subTask.completedAt && (
                          <span className="ml-2">
                            • Completed: {new Date(subTask.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <select
                        value={subTask.status}
                        onChange={(e) => handleStatusChange(subTask.id, e.target.value as TaskStatus)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      >
                        <option value={TaskStatus.TODO}>To Do</option>
                        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                        <option value={TaskStatus.COMPLETED}>Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {subTasks.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Parent Task Status</h4>
              <p className="text-sm text-blue-800">
                The parent task will be automatically marked as completed when all sub-tasks are completed.
                Currently {subTasks.filter(t => t.status === TaskStatus.COMPLETED).length} of {subTasks.length} sub-tasks are complete.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};