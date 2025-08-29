import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority } from '../entities/task.entity';
import { DependencyType } from '../entities/task-dependency.entity';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  reminderTime?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  parentTaskId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  reminderTime?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  parentTaskId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateTaskShareDto {
  @IsEnum(['public_link', 'user_share'])
  shareType: 'public_link' | 'user_share';

  @IsOptional()
  @IsNumber()
  sharedWithUserId?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class CreateCategoryCollaboratorDto {
  @IsNumber()
  categoryId: number;

  @IsNumber()
  userId: number;

  @IsEnum(['viewer', 'editor', 'admin'])
  role: 'viewer' | 'editor' | 'admin';
}

export class CreateTaskDependencyDto {
  @IsNumber()
  predecessorTaskId: number;

  @IsNumber()
  successorTaskId: number;

  @IsOptional()
  @IsEnum(DependencyType)
  dependencyType?: DependencyType;

  @IsOptional()
  @IsNumber()
  lag?: number;
}

export class CreateTaskTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTaskTagDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}