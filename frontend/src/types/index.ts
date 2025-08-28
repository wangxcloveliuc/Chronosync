export interface User {
  id: number;
  email: string;
  nickname: string;
  avatar?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  category?: Category;
  categoryId?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
  priorityBreakdown: {
    high: { total: number; completed: number };
    medium: { total: number; completed: number };
    low: { total: number; completed: number };
  };
  completionTime: {
    averageCompletionHours: number;
    byPriority: {
      high: { averageHours: number; count: number };
      medium: { averageHours: number; count: number };
      low: { averageHours: number; count: number };
    };
  };
  productivity: {
    highPriorityCompletionRate: number;
    mediumPriorityCompletionRate: number;
    lowPriorityCompletionRate: number;
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  reminderTime?: string;
  categoryId?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: TaskStatus;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

export interface TaskShare {
  id: number;
  shareToken: string;
  shareType: 'public_link' | 'user_share';
  sharedWithUserId?: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  task: Task;
  sharedWithUser?: User;
}

export interface CategoryCollaborator {
  id: number;
  role: 'viewer' | 'editor' | 'admin';
  isActive: boolean;
  createdAt: string;
  user: User;
  invitedBy: User;
}

export interface CreateTaskShareData {
  shareType: 'public_link' | 'user_share';
  sharedWithUserId?: number;
  expiresAt?: string;
}

export interface CreateCollaboratorData {
  userId: number;
  role: 'viewer' | 'editor' | 'admin';
}