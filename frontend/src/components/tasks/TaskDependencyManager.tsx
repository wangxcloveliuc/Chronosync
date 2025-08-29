import React, { useState, useEffect } from 'react';
import { Task, TaskDependency, CreateTaskDependencyData, DependencyType } from '@/types';
import { useTasks } from '@/hooks/useTasks';

interface TaskDependencyManagerProps {
  task: Task;
  onClose: () => void;
}

export const TaskDependencyManager: React.FC<TaskDependencyManagerProps> = ({ task, onClose }) => {
  const { tasks, createDependency, getDependencies, deleteDependency } = useTasks();
  const [dependencies, setDependencies] = useState<{
    predecessors: TaskDependency[];
    successors: TaskDependency[];
  }>({ predecessors: [], successors: [] });
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateTaskDependencyData>({
    predecessorTaskId: 0,
    successorTaskId: task.id,
    dependencyType: DependencyType.FINISH_TO_START,
    lag: 0
  });
  const [loading, setLoading] = useState(false);

  const availableTasks = tasks.filter(t => t.id !== task.id);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const deps = await getDependencies(task.id);
      setDependencies(deps);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, [task.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.predecessorTaskId === 0) {
      alert('Please select a predecessor task');
      return;
    }

    try {
      setLoading(true);
      await createDependency(task.id, formData);
      await loadDependencies();
      setIsCreating(false);
      setFormData({
        predecessorTaskId: 0,
        successorTaskId: task.id,
        dependencyType: DependencyType.FINISH_TO_START,
        lag: 0
      });
    } catch (error) {
      console.error('Error creating dependency:', error);
      alert('Failed to create dependency. Please check for circular dependencies.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dependencyId: number) => {
    if (window.confirm('Are you sure you want to remove this dependency?')) {
      try {
        setLoading(true);
        await deleteDependency(dependencyId);
        await loadDependencies();
      } catch (error) {
        console.error('Error deleting dependency:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getDependencyTypeLabel = (type: DependencyType) => {
    switch (type) {
      case DependencyType.FINISH_TO_START:
        return 'Finish to Start';
      case DependencyType.START_TO_START:
        return 'Start to Start';
      case DependencyType.FINISH_TO_FINISH:
        return 'Finish to Finish';
      case DependencyType.START_TO_FINISH:
        return 'Start to Finish';
      default:
        return type;
    }
  };

  const isTaskBlocked = () => {
    return dependencies.predecessors.some(dep => 
      dep.dependencyType === DependencyType.FINISH_TO_START && 
      dep.predecessorTask.status !== 'completed'
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Dependencies for "{task.title}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[calc(80vh-120px)] overflow-y-auto">
          {isTaskBlocked() && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
              <div className="flex">
                <div className="text-yellow-800">
                  ⚠️ This task is blocked by incomplete predecessor tasks.
                </div>
              </div>
            </div>
          )}

          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              Add Dependency
            </button>
          )}

          {isCreating && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Add New Dependency</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Predecessor Task *
                  </label>
                  <select
                    value={formData.predecessorTaskId}
                    onChange={(e) => setFormData({ ...formData, predecessorTaskId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={0}>Select a task...</option>
                    {availableTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.status})
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    This task must be completed before "{task.title}" can start
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dependency Type
                  </label>
                  <select
                    value={formData.dependencyType}
                    onChange={(e) => setFormData({ ...formData, dependencyType: e.target.value as DependencyType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={DependencyType.FINISH_TO_START}>Finish to Start</option>
                    <option value={DependencyType.START_TO_START}>Start to Start</option>
                    <option value={DependencyType.FINISH_TO_FINISH}>Finish to Finish</option>
                    <option value={DependencyType.START_TO_FINISH}>Start to Finish</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lag (hours)
                </label>
                <input
                  type="number"
                  value={formData.lag || ''}
                  onChange={(e) => setFormData({ ...formData, lag: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Optional delay between tasks (in hours)
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  Add Dependency
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Predecessor Dependencies */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Predecessor Tasks ({dependencies.predecessors.length})
              </h3>
              <div className="text-sm text-gray-600 mb-3">
                These tasks must be completed before this task can start:
              </div>
              
              {dependencies.predecessors.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border rounded-lg">
                  No predecessor dependencies
                </div>
              ) : (
                <div className="space-y-2">
                  {dependencies.predecessors.map((dep) => (
                    <div key={dep.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {dep.predecessorTask.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getDependencyTypeLabel(dep.dependencyType)}
                            {dep.lag > 0 && ` (${dep.lag}h lag)`}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                            dep.predecessorTask.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : dep.predecessorTask.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {dep.predecessorTask.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(dep.id)}
                          className="text-red-600 hover:text-red-800 text-sm ml-2"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Successor Dependencies */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Successor Tasks ({dependencies.successors.length})
              </h3>
              <div className="text-sm text-gray-600 mb-3">
                These tasks depend on this task being completed:
              </div>
              
              {dependencies.successors.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border rounded-lg">
                  No successor dependencies
                </div>
              ) : (
                <div className="space-y-2">
                  {dependencies.successors.map((dep) => (
                    <div key={dep.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {dep.successorTask.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getDependencyTypeLabel(dep.dependencyType)}
                            {dep.lag > 0 && ` (${dep.lag}h lag)`}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                            dep.successorTask.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : dep.successorTask.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {dep.successorTask.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(dep.id)}
                          className="text-red-600 hover:text-red-800 text-sm ml-2"
                          disabled={loading}
                        >
                          Remove
                        </button>
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
};