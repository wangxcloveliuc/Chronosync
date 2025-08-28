import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Task, Category, TaskStats, CreateTaskData, UpdateTaskData, CreateCategoryData, TaskStatus } from '@/types';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate,
    };
  };

  const fetchTasks = async (filters?: { status?: string; categoryId?: number; search?: string }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters?.search) params.append('search', filters.search);
      
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

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchStats();
  }, []);

  return {
    tasks,
    categories,
    stats,
    loading,
    error,
    fetchTasks,
    fetchCategories,
    fetchStats,
    createTask,
    updateTask,
    deleteTask,
    createCategory,
    setError,
  };
};