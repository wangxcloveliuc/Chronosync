import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Task, Category, TaskStats, CreateTaskData, UpdateTaskData, CreateCategoryData, TaskStatus, TaskPriority, TaskTag, TaskDependency, CreateTaskTagData, UpdateTaskTagData, CreateTaskDependencyData } from '@/types';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to calculate stats from tasks
  const calculateStats = (taskList: Task[]): TaskStats => {
    const total = taskList.length;
    const completed = taskList.filter(task => task.status === TaskStatus.COMPLETED).length;
    const inProgress = taskList.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const todo = taskList.filter(task => task.status === TaskStatus.TODO).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate priority breakdown
    const highTasks = taskList.filter(task => task.priority === TaskPriority.HIGH);
    const mediumTasks = taskList.filter(task => task.priority === TaskPriority.MEDIUM);
    const lowTasks = taskList.filter(task => task.priority === TaskPriority.LOW);

    const highCompleted = highTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const mediumCompleted = mediumTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const lowCompleted = lowTasks.filter(task => task.status === TaskStatus.COMPLETED).length;

    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate,
      priorityBreakdown: {
        high: { total: highTasks.length, completed: highCompleted },
        medium: { total: mediumTasks.length, completed: mediumCompleted },
        low: { total: lowTasks.length, completed: lowCompleted },
      },
      completionTime: {
        averageCompletionHours: 0,
        byPriority: {
          high: { averageHours: 0, count: 0 },
          medium: { averageHours: 0, count: 0 },
          low: { averageHours: 0, count: 0 },
        }
      },
      productivity: {
        highPriorityCompletionRate: highTasks.length > 0 ? Math.round((highCompleted / highTasks.length) * 100) : 0,
        mediumPriorityCompletionRate: mediumTasks.length > 0 ? Math.round((mediumCompleted / mediumTasks.length) * 100) : 0,
        lowPriorityCompletionRate: lowTasks.length > 0 ? Math.round((lowCompleted / lowTasks.length) * 100) : 0,
      }
    };
  };

  const fetchTasks = async (filters?: { status?: string; categoryId?: number; search?: string; tags?: string[] }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data);
      // Update stats after fetching tasks
      setStats(calculateStats(response.data));
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/tasks/categories/all');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/tasks/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const createTask = async (taskData: CreateTaskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      setTasks(prev => {
        const newTasks = [response.data, ...prev];
        // Update stats after adding task
        setStats(calculateStats(newTasks));
        return newTasks;
      });
      return response.data;
    } catch (err) {
      setError('Failed to create task');
      throw err;
    }
  };

  const updateTask = async (taskId: number, taskData: UpdateTaskData) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, taskData);
      setTasks(prev => {
        const newTasks = prev.map(task => task.id === taskId ? response.data : task);
        // Update stats after updating task
        setStats(calculateStats(newTasks));
        return newTasks;
      });
      return response.data;
    } catch (err) {
      setError('Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => {
        const newTasks = prev.filter(task => task.id !== taskId);
        // Update stats after deleting task
        setStats(calculateStats(newTasks));
        return newTasks;
      });
    } catch (err) {
      setError('Failed to delete task');
      throw err;
    }
  };

  const createCategory = async (categoryData: CreateCategoryData) => {
    try {
      const response = await api.post('/tasks/categories', categoryData);
      setCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('Failed to create category');
      throw err;
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/tasks/tags');
      setTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const createTag = async (tagData: CreateTaskTagData) => {
    try {
      const response = await api.post('/tasks/tags', tagData);
      setTags(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('Failed to create tag');
      throw err;
    }
  };

  const updateTag = async (tagId: number, tagData: UpdateTaskTagData) => {
    try {
      const response = await api.patch(`/tasks/tags/${tagId}`, tagData);
      setTags(prev => prev.map(tag => tag.id === tagId ? response.data : tag));
      return response.data;
    } catch (err) {
      setError('Failed to update tag');
      throw err;
    }
  };

  const deleteTag = async (tagId: number) => {
    try {
      await api.delete(`/tasks/tags/${tagId}`);
      setTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (err) {
      setError('Failed to delete tag');
      throw err;
    }
  };

  const createDependency = async (taskId: number, dependencyData: CreateTaskDependencyData) => {
    try {
      const response = await api.post(`/tasks/${taskId}/dependencies`, dependencyData);
      // Refresh tasks to get updated dependency information
      await fetchTasks();
      return response.data;
    } catch (err) {
      setError('Failed to create dependency');
      throw err;
    }
  };

  const getDependencies = async (taskId: number) => {
    try {
      const response = await api.get(`/tasks/${taskId}/dependencies`);
      return response.data;
    } catch (err) {
      setError('Failed to fetch dependencies');
      throw err;
    }
  };

  const deleteDependency = async (dependencyId: number) => {
    try {
      await api.delete(`/tasks/dependencies/${dependencyId}`);
      // Refresh tasks to get updated dependency information
      await fetchTasks();
    } catch (err) {
      setError('Failed to delete dependency');
      throw err;
    }
  };

  const getSubTasks = async (parentTaskId: number) => {
    try {
      const response = await api.get(`/tasks/${parentTaskId}/sub-tasks`);
      return response.data;
    } catch (err) {
      setError('Failed to fetch sub-tasks');
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchStats();
    fetchTags();
  }, []);

  return {
    tasks,
    categories,
    tags,
    stats,
    loading,
    error,
    fetchTasks,
    fetchCategories,
    fetchStats,
    fetchTags,
    createTask,
    updateTask,
    deleteTask,
    createCategory,
    createTag,
    updateTag,
    deleteTag,
    createDependency,
    getDependencies,
    deleteDependency,
    getSubTasks,
    setError,
  };
};