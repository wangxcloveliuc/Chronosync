import { useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '@/types';

interface UseNotificationsProps {
  tasks: Task[];
  enabled?: boolean;
}

export const useNotifications = ({ tasks, enabled = true }: UseNotificationsProps) => {
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }, []);

  const checkReminders = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const now = new Date();
    const currentTime = now.getTime();

    tasks.forEach(task => {
      // Check reminder notifications
      if (
        task.reminderTime &&
        task.status !== TaskStatus.COMPLETED
      ) {
        const reminderTime = new Date(task.reminderTime);
        const timeDiff = reminderTime.getTime() - currentTime;

        // Show notification if reminder time is within the next 5 minutes
        if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
          const reminderKey = `reminder-${task.id}-${reminderTime.getTime()}`;
          
          // Check if we already showed this reminder
          const shownReminders = JSON.parse(localStorage.getItem('shownReminders') || '[]');
          if (!shownReminders.includes(reminderKey)) {
            showNotification(`Task Reminder: ${task.title}`, {
              body: task.description || 'You have a task due soon',
              tag: `task-${task.id}`,
              requireInteraction: true,
            });

            // Mark this reminder as shown
            shownReminders.push(reminderKey);
            localStorage.setItem('shownReminders', JSON.stringify(shownReminders));
          }
        }
      }

      // Check for overdue tasks (separate check)
      if (task.dueDate && task.status !== TaskStatus.COMPLETED) {
        const dueDate = new Date(task.dueDate);
        const overdueDiff = currentTime - dueDate.getTime();
        
        if (overdueDiff > 0 && overdueDiff <= 24 * 60 * 60 * 1000) { // Within 24 hours of being overdue
          const overdueKey = `overdue-${task.id}-${dueDate.toDateString()}`;
          const shownReminders = JSON.parse(localStorage.getItem('shownReminders') || '[]');
          
          if (!shownReminders.includes(overdueKey)) {
            showNotification(`Overdue Task: ${task.title}`, {
              body: `This task was due on ${dueDate.toLocaleDateString()}`,
              tag: `overdue-${task.id}`,
              requireInteraction: true,
            });

            shownReminders.push(overdueKey);
            localStorage.setItem('shownReminders', JSON.stringify(shownReminders));
          }
        }
      }
    });
  }, [tasks, enabled, showNotification]);

  // Request permission on first use
  useEffect(() => {
    if (enabled) {
      requestPermission();
    }
  }, [enabled, requestPermission]);

  // Check for reminders every minute
  useEffect(() => {
    if (!enabled) return;

    checkReminders(); // Check immediately
    const interval = setInterval(checkReminders, 60000); // Then every minute

    return () => clearInterval(interval);
  }, [enabled, checkReminders]);

  return {
    requestPermission,
    showNotification,
    hasPermission: typeof window !== 'undefined' && Notification.permission === 'granted',
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
};