'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { useTasks } from '@/hooks/useTasks';
import { CalendarView } from '@/components/calendar/CalendarView';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Task, CreateTaskData, UpdateTaskData } from '@/types';
import { format } from 'date-fns';

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const router = useRouter();

  const {
    tasks,
    categories,
    tags,
    loading: tasksLoading,
    createTask,
    updateTask,
  } = useTasks();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setSelectedDate(null);
    setShowTaskForm(true);
  };

  const handleDateClick = (date: Date) => {
    setEditingTask(null);
    setSelectedDate(date);
    setShowTaskForm(true);
  };

  const handleSubmitTask = async (taskData: CreateTaskData | UpdateTaskData) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      // If a date was selected, set it as the due date
      const newTaskData = selectedDate 
        ? { ...taskData, dueDate: format(selectedDate, 'yyyy-MM-dd\'T\'HH:mm') }
        : taskData;
      await createTask(newTaskData as CreateTaskData);
    }
  };

  const handleCancelForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    setSelectedDate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
  <NavBar title="Calendar View" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              📅 <strong>Calendar Instructions:</strong> Click on any date to create a new task for that day. 
              Click on existing tasks to edit them. Tasks are color-coded by status.
            </p>
          </div>

          {/* Calendar */}
          {tasksLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-500">Loading calendar...</div>
            </div>
          ) : (
            <CalendarView
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onDateClick={handleDateClick}
            />
          )}
        </div>
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onSubmit={handleSubmitTask}
          onCancel={handleCancelForm}
          categories={categories}
          tasks={tasks}
          tags={tags}
          editTask={editingTask || undefined}
          mode={editingTask ? 'edit' : 'create'}
        />
      )}
    </div>
  );
}