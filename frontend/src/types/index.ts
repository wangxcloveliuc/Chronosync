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
  parentTask?: Task;
  parentTaskId?: number;
  subTasks?: Task[];
  tags?: TaskTag[];
  predecessorDependencies?: TaskDependency[];
  successorDependencies?: TaskDependency[];
  progress: number;
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
  parentTaskId?: number;
  tags?: string[];
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

export interface TaskTag {
  id: number;
  name: string;
  color?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  id: number;
  dependencyType: DependencyType;
  lag?: number;
  createdAt: string;
  predecessorTask: Task;
  successorTask: Task;
  predecessorTaskId: number;
  successorTaskId: number;
}

export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
  START_TO_FINISH = 'start_to_finish'
}

export interface CreateTaskTagData {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTaskTagData {
  name?: string;
  color?: string;
  description?: string;
}

export interface CreateTaskDependencyData {
  predecessorTaskId: number;
  successorTaskId: number;
  dependencyType?: DependencyType;
  lag?: number;
}