import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Category } from './entities/category.entity';
import { TaskShare, ShareType } from './entities/task-share.entity';
import { CategoryCollaborator, CollaboratorRole } from './entities/category-collaborator.entity';
import { TaskTag } from './entities/task-tag.entity';
import { TaskDependency, DependencyType } from './entities/task-dependency.entity';
import { CreateTaskDto, UpdateTaskDto, CreateCategoryDto, UpdateCategoryDto, CreateTaskShareDto, CreateCategoryCollaboratorDto, CreateTaskDependencyDto, CreateTaskTagDto, UpdateTaskTagDto } from './dto/task.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(TaskShare)
    private readonly taskShareRepository: Repository<TaskShare>,
    @InjectRepository(CategoryCollaborator)
    private readonly categoryCollaboratorRepository: Repository<CategoryCollaborator>,
    @InjectRepository(TaskTag)
    private readonly taskTagRepository: Repository<TaskTag>,
    @InjectRepository(TaskDependency)
    private readonly taskDependencyRepository: Repository<TaskDependency>,
  ) {}

  async createTask(userId: number, createTaskDto: CreateTaskDto): Promise<Task> {
    // Validate parent task ownership if parentTaskId is provided
    if (createTaskDto.parentTaskId) {
      const parentTask = await this.findTaskById(createTaskDto.parentTaskId, userId);
      if (!parentTask) {
        throw new NotFoundException('Parent task not found');
      }
    }

    // Handle tags
    let tags: TaskTag[] = [];
    if (createTaskDto.tags && createTaskDto.tags.length > 0) {
      tags = await this.getOrCreateTags(createTaskDto.tags);
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      reminderTime: createTaskDto.reminderTime ? new Date(createTaskDto.reminderTime) : undefined,
      tags,
    });

    const savedTask = await this.taskRepository.save(task);

    // Update parent task progress if this is a sub-task
    if (createTaskDto.parentTaskId) {
      await this.updateParentTaskProgress(createTaskDto.parentTaskId);
    }

    return this.findTaskById(savedTask.id, userId);
  }

  async findAllTasks(
    userId: number,
    status?: TaskStatus,
    categoryId?: number,
    search?: string,
    tags?: string[]
  ): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
      .leftJoinAndSelect('task.tags', 'tags')
      .leftJoinAndSelect('task.parentTask', 'parentTask')
      .leftJoinAndSelect('task.subTasks', 'subTasks')
      .leftJoinAndSelect('task.predecessorDependencies', 'predecessorDeps')
      .leftJoinAndSelect('predecessorDeps.predecessorTask', 'predecessorTask')
      .leftJoinAndSelect('task.successorDependencies', 'successorDeps')
      .leftJoinAndSelect('successorDeps.successorTask', 'successorTask')
      .where('task.userId = :userId', { userId });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (categoryId) {
      query.andWhere('task.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (tags && tags.length > 0) {
      query.andWhere('tags.name IN (:...tags)', { tags });
    }

    return query.orderBy('task.createdAt', 'DESC').getMany();
  }

  async findTaskById(id: number, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
      relations: [
        'category', 
        'tags', 
        'parentTask', 
        'subTasks', 
        'predecessorDependencies', 
        'predecessorDependencies.predecessorTask',
        'successorDependencies',
        'successorDependencies.successorTask'
      ],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(id: number, userId: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findTaskById(id, userId);
    
    // Validate parent task ownership if parentTaskId is being updated
    if (updateTaskDto.parentTaskId && updateTaskDto.parentTaskId !== task.parentTaskId) {
      const parentTask = await this.findTaskById(updateTaskDto.parentTaskId, userId);
      if (!parentTask) {
        throw new NotFoundException('Parent task not found');
      }
    }

    // Check dependency constraints before updating status
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      const canUpdateStatus = await this.canUpdateTaskStatus(id, updateTaskDto.status);
      if (!canUpdateStatus) {
        throw new BadRequestException('Cannot update task status due to dependency constraints');
      }
    }

    const updateData: any = { ...updateTaskDto };
    
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }
    
    if (updateTaskDto.reminderTime) {
      updateData.reminderTime = new Date(updateTaskDto.reminderTime);
    }

    if (updateTaskDto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (updateTaskDto.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = null;
    }

    // Handle tags update
    if (updateTaskDto.tags !== undefined) {
      const tags = updateTaskDto.tags.length > 0 ? await this.getOrCreateTags(updateTaskDto.tags) : [];
      await this.taskRepository.save({ ...task, tags });
    }

    // Remove tags from update data to avoid TypeORM issues
    delete updateData.tags;

    await this.taskRepository.update(id, updateData);

    // Update parent task progress if status changed or if parent task changed
    if (updateTaskDto.status || updateTaskDto.parentTaskId) {
      if (task.parentTaskId) {
        await this.updateParentTaskProgress(task.parentTaskId);
      }
      if (updateTaskDto.parentTaskId && updateTaskDto.parentTaskId !== task.parentTaskId) {
        await this.updateParentTaskProgress(updateTaskDto.parentTaskId);
      }
    }

    return this.findTaskById(id, userId);
  }

  async deleteTask(id: number, userId: number): Promise<void> {
    const task = await this.findTaskById(id, userId);
    
    // Update parent task progress if this was a sub-task
    if (task.parentTaskId) {
      await this.updateParentTaskProgress(task.parentTaskId);
    }
    
    await this.taskRepository.remove(task);
  }

  // Helper method to get or create tags
  private async getOrCreateTags(tagNames: string[]): Promise<TaskTag[]> {
    const tags: TaskTag[] = [];
    
    for (const tagName of tagNames) {
      let tag = await this.taskTagRepository.findOne({ where: { name: tagName } });
      
      if (!tag) {
        tag = this.taskTagRepository.create({ name: tagName });
        tag = await this.taskTagRepository.save(tag);
      }
      
      tags.push(tag);
    }
    
    return tags;
  }

  // Helper method to update parent task progress
  private async updateParentTaskProgress(parentTaskId: number): Promise<void> {
    const parentTask = await this.taskRepository.findOne({
      where: { id: parentTaskId },
      relations: ['subTasks']
    });

    if (!parentTask || !parentTask.subTasks) {
      return;
    }

    const totalSubTasks = parentTask.subTasks.length;
    if (totalSubTasks === 0) {
      return;
    }

    const completedSubTasks = parentTask.subTasks.filter(
      subTask => subTask.status === TaskStatus.COMPLETED
    ).length;

    const progress = Math.round((completedSubTasks / totalSubTasks) * 100);
    
    // If all sub-tasks are completed, mark parent as completed
    const newStatus = completedSubTasks === totalSubTasks ? TaskStatus.COMPLETED : 
                     completedSubTasks > 0 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;

    await this.taskRepository.update(parentTaskId, { 
      progress,
      status: newStatus,
      completedAt: newStatus === TaskStatus.COMPLETED ? new Date() : null
    });
  }

  // Helper method to check if task status can be updated based on dependencies
  private async canUpdateTaskStatus(taskId: number, newStatus: TaskStatus): Promise<boolean> {
    if (newStatus === TaskStatus.TODO) {
      return true; // Can always revert to TODO
    }

    // Check if all predecessor tasks are completed for IN_PROGRESS or COMPLETED status
    const predecessorDependencies = await this.taskDependencyRepository.find({
      where: { successorTaskId: taskId },
      relations: ['predecessorTask']
    });

    for (const dependency of predecessorDependencies) {
      if (dependency.dependencyType === DependencyType.FINISH_TO_START || 
          dependency.dependencyType === DependencyType.FINISH_TO_FINISH) {
        if (dependency.predecessorTask.status !== TaskStatus.COMPLETED) {
          return false;
        }
      }
    }

    return true;
  }

  async getTaskStats(userId: number, startDate?: Date, endDate?: Date) {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    if (startDate && endDate) {
      query.andWhere('task.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [total, completed, inProgress, todo] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('task.status = :status', { status: TaskStatus.COMPLETED }).getCount(),
      query.clone().andWhere('task.status = :status', { status: TaskStatus.IN_PROGRESS }).getCount(),
      query.clone().andWhere('task.status = :status', { status: TaskStatus.TODO }).getCount(),
    ]);

    // Priority-based statistics
    const priorityStats = await Promise.all([
      query.clone().andWhere('task.priority = :priority', { priority: 'high' }).getCount(),
      query.clone().andWhere('task.priority = :priority', { priority: 'medium' }).getCount(),
      query.clone().andWhere('task.priority = :priority', { priority: 'low' }).getCount(),
      query.clone().andWhere('task.priority = :priority AND task.status = :status', { priority: 'high', status: TaskStatus.COMPLETED }).getCount(),
      query.clone().andWhere('task.priority = :priority AND task.status = :status', { priority: 'medium', status: TaskStatus.COMPLETED }).getCount(),
      query.clone().andWhere('task.priority = :priority AND task.status = :status', { priority: 'low', status: TaskStatus.COMPLETED }).getCount(),
    ]);

    // Completion time analysis for completed tasks
    const completedTasks = await query
      .clone()
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.completedAt IS NOT NULL')
      .select(['task.createdAt', 'task.completedAt', 'task.priority'])
      .getRawMany();

    const completionTimeStats = this.calculateCompletionTimeStats(completedTasks);

    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      priorityBreakdown: {
        high: { total: priorityStats[0], completed: priorityStats[3] },
        medium: { total: priorityStats[1], completed: priorityStats[4] },
        low: { total: priorityStats[2], completed: priorityStats[5] },
      },
      completionTime: completionTimeStats,
      productivity: {
        highPriorityCompletionRate: priorityStats[0] > 0 ? Math.round((priorityStats[3] / priorityStats[0]) * 100) : 0,
        mediumPriorityCompletionRate: priorityStats[1] > 0 ? Math.round((priorityStats[4] / priorityStats[1]) * 100) : 0,
        lowPriorityCompletionRate: priorityStats[2] > 0 ? Math.round((priorityStats[5] / priorityStats[2]) * 100) : 0,
      }
    };
  }

  private calculateCompletionTimeStats(completedTasks: any[]) {
    if (completedTasks.length === 0) {
      return {
        averageCompletionHours: 0,
        byPriority: {
          high: { averageHours: 0, count: 0 },
          medium: { averageHours: 0, count: 0 },
          low: { averageHours: 0, count: 0 },
        }
      };
    }

    const completionTimes = completedTasks.map(task => {
      const created = new Date(task.task_createdAt);
      const completed = new Date(task.task_completedAt);
      const hours = Math.round((completed.getTime() - created.getTime()) / (1000 * 60 * 60) * 100) / 100;
      return { hours, priority: task.task_priority };
    });

    const totalHours = completionTimes.reduce((sum, task) => sum + task.hours, 0);
    const averageCompletionHours = Math.round((totalHours / completionTimes.length) * 100) / 100;

    // Group by priority
    const byPriority = {
      high: completionTimes.filter(t => t.priority === 'high'),
      medium: completionTimes.filter(t => t.priority === 'medium'),
      low: completionTimes.filter(t => t.priority === 'low'),
    };

    return {
      averageCompletionHours,
      byPriority: {
        high: {
          averageHours: byPriority.high.length > 0 
            ? Math.round((byPriority.high.reduce((sum, t) => sum + t.hours, 0) / byPriority.high.length) * 100) / 100
            : 0,
          count: byPriority.high.length
        },
        medium: {
          averageHours: byPriority.medium.length > 0 
            ? Math.round((byPriority.medium.reduce((sum, t) => sum + t.hours, 0) / byPriority.medium.length) * 100) / 100
            : 0,
          count: byPriority.medium.length
        },
        low: {
          averageHours: byPriority.low.length > 0 
            ? Math.round((byPriority.low.reduce((sum, t) => sum + t.hours, 0) / byPriority.low.length) * 100) / 100
            : 0,
          count: byPriority.low.length
        },
      }
    };
  }

  // Category methods
  async createCategory(userId: number, createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories(userId: number): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { userId },
      relations: ['tasks'],
      order: { createdAt: 'ASC' },
    });
  }

  async findCategoryById(id: number, userId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      relations: ['tasks'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: number, userId: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    await this.findCategoryById(id, userId);
    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findCategoryById(id, userId);
  }

  async deleteCategory(id: number, userId: number): Promise<void> {
    const category = await this.findCategoryById(id, userId);
    await this.categoryRepository.remove(category);
  }

  // Task sharing methods
  async createTaskShare(taskId: number, userId: number, createTaskShareDto: CreateTaskShareDto): Promise<TaskShare> {
    const task = await this.findTaskById(taskId, userId);
    
    const shareToken = randomBytes(32).toString('hex');
    
    const taskShare = this.taskShareRepository.create({
      shareToken,
      shareType: createTaskShareDto.shareType as ShareType,
      sharedWithUserId: createTaskShareDto.sharedWithUserId,
      expiresAt: createTaskShareDto.expiresAt ? new Date(createTaskShareDto.expiresAt) : null,
      taskId,
      createdByUserId: userId,
    });

    return this.taskShareRepository.save(taskShare);
  }

  async getTaskShares(userId: number): Promise<TaskShare[]> {
    return this.taskShareRepository.find({
      where: { createdByUserId: userId },
      relations: ['task', 'sharedWithUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSharedTask(shareToken: string): Promise<Task> {
    const taskShare = await this.taskShareRepository.findOne({
      where: { shareToken, isActive: true },
      relations: ['task', 'task.category'],
    });

    if (!taskShare) {
      throw new NotFoundException('Shared task not found or expired');
    }

    // Check if share has expired
    if (taskShare.expiresAt && taskShare.expiresAt < new Date()) {
      throw new NotFoundException('Shared task has expired');
    }

    return taskShare.task;
  }

  async revokeTaskShare(shareId: number, userId: number): Promise<void> {
    const taskShare = await this.taskShareRepository.findOne({
      where: { id: shareId, createdByUserId: userId },
    });

    if (!taskShare) {
      throw new NotFoundException('Task share not found');
    }

    await this.taskShareRepository.update(shareId, { isActive: false });
  }

  // Category collaboration methods
  async addCategoryCollaborator(userId: number, createCollaboratorDto: CreateCategoryCollaboratorDto): Promise<CategoryCollaborator> {
    const category = await this.findCategoryById(createCollaboratorDto.categoryId, userId);
    
    // Check if user already has access to this category
    const existingCollaborator = await this.categoryCollaboratorRepository.findOne({
      where: { 
        categoryId: createCollaboratorDto.categoryId, 
        userId: createCollaboratorDto.userId 
      },
    });

    if (existingCollaborator) {
      throw new ForbiddenException('User already has access to this category');
    }

    const collaborator = this.categoryCollaboratorRepository.create({
      categoryId: createCollaboratorDto.categoryId,
      userId: createCollaboratorDto.userId,
      role: createCollaboratorDto.role as CollaboratorRole,
      invitedByUserId: userId,
    });

    return this.categoryCollaboratorRepository.save(collaborator);
  }

  async getCategoryCollaborators(categoryId: number, userId: number): Promise<CategoryCollaborator[]> {
    const category = await this.findCategoryById(categoryId, userId);
    
    return this.categoryCollaboratorRepository.find({
      where: { categoryId },
      relations: ['user', 'invitedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async getSharedCategories(userId: number): Promise<Category[]> {
    const collaborations = await this.categoryCollaboratorRepository.find({
      where: { userId, isActive: true },
      relations: ['category'],
    });

    return collaborations.map(collab => collab.category);
  }

  async removeCategoryCollaborator(categoryId: number, collaboratorUserId: number, userId: number): Promise<void> {
    const category = await this.findCategoryById(categoryId, userId);
    
    const collaborator = await this.categoryCollaboratorRepository.findOne({
      where: { categoryId, userId: collaboratorUserId },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.categoryCollaboratorRepository.remove(collaborator);
  }

  async updateCategoryCollaboratorRole(
    categoryId: number, 
    collaboratorUserId: number, 
    newRole: CollaboratorRole, 
    userId: number
  ): Promise<CategoryCollaborator> {
    const category = await this.findCategoryById(categoryId, userId);
    
    const collaborator = await this.categoryCollaboratorRepository.findOne({
      where: { categoryId, userId: collaboratorUserId },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.categoryCollaboratorRepository.update(collaborator.id, { role: newRole });
    const updatedCollaborator = await this.categoryCollaboratorRepository.findOne({
      where: { id: collaborator.id },
      relations: ['user', 'invitedBy'],
    });

    if (!updatedCollaborator) {
      throw new NotFoundException('Updated collaborator not found');
    }

    return updatedCollaborator;
  }

  // Task Tag Management
  async createTaskTag(createTaskTagDto: CreateTaskTagDto): Promise<TaskTag> {
    const existingTag = await this.taskTagRepository.findOne({
      where: { name: createTaskTagDto.name }
    });

    if (existingTag) {
      throw new BadRequestException('Tag with this name already exists');
    }

    const tag = this.taskTagRepository.create(createTaskTagDto);
    return this.taskTagRepository.save(tag);
  }

  async getAllTaskTags(): Promise<TaskTag[]> {
    return this.taskTagRepository.find({
      order: { name: 'ASC' }
    });
  }

  async updateTaskTag(id: number, updateTaskTagDto: UpdateTaskTagDto): Promise<TaskTag> {
    const tag = await this.taskTagRepository.findOne({ where: { id } });
    
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (updateTaskTagDto.name && updateTaskTagDto.name !== tag.name) {
      const existingTag = await this.taskTagRepository.findOne({
        where: { name: updateTaskTagDto.name }
      });
      
      if (existingTag) {
        throw new BadRequestException('Tag with this name already exists');
      }
    }

    await this.taskTagRepository.update(id, updateTaskTagDto);
    const updatedTag = await this.taskTagRepository.findOne({ where: { id } });
    if (!updatedTag) {
      throw new NotFoundException('Tag not found after update');
    }
    return updatedTag;
  }

  async deleteTaskTag(id: number): Promise<void> {
    const tag = await this.taskTagRepository.findOne({ where: { id } });
    
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.taskTagRepository.remove(tag);
  }

  // Task Dependency Management
  async createTaskDependency(userId: number, createTaskDependencyDto: CreateTaskDependencyDto): Promise<TaskDependency> {
    // Validate that both tasks exist and belong to the user
    const [predecessorTask, successorTask] = await Promise.all([
      this.findTaskById(createTaskDependencyDto.predecessorTaskId, userId),
      this.findTaskById(createTaskDependencyDto.successorTaskId, userId)
    ]);

    if (!predecessorTask || !successorTask) {
      throw new NotFoundException('One or both tasks not found');
    }

    if (predecessorTask.id === successorTask.id) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    // Check for existing dependency
    const existingDependency = await this.taskDependencyRepository.findOne({
      where: {
        predecessorTaskId: createTaskDependencyDto.predecessorTaskId,
        successorTaskId: createTaskDependencyDto.successorTaskId
      }
    });

    if (existingDependency) {
      throw new BadRequestException('Dependency already exists between these tasks');
    }

    // Check for circular dependencies
    const wouldCreateCircle = await this.wouldCreateCircularDependency(
      createTaskDependencyDto.predecessorTaskId,
      createTaskDependencyDto.successorTaskId
    );

    if (wouldCreateCircle) {
      throw new BadRequestException('This dependency would create a circular dependency');
    }

    const dependency = this.taskDependencyRepository.create(createTaskDependencyDto);
    return this.taskDependencyRepository.save(dependency);
  }

  async getTaskDependencies(taskId: number, userId: number): Promise<{
    predecessors: TaskDependency[];
    successors: TaskDependency[];
  }> {
    // Verify task ownership
    await this.findTaskById(taskId, userId);

    const [predecessors, successors] = await Promise.all([
      this.taskDependencyRepository.find({
        where: { successorTaskId: taskId },
        relations: ['predecessorTask']
      }),
      this.taskDependencyRepository.find({
        where: { predecessorTaskId: taskId },
        relations: ['successorTask']
      })
    ]);

    return { predecessors, successors };
  }

  async deleteTaskDependency(dependencyId: number, userId: number): Promise<void> {
    const dependency = await this.taskDependencyRepository.findOne({
      where: { id: dependencyId },
      relations: ['predecessorTask', 'successorTask']
    });

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    // Verify that the user owns both tasks in the dependency
    await Promise.all([
      this.findTaskById(dependency.predecessorTaskId, userId),
      this.findTaskById(dependency.successorTaskId, userId)
    ]);

    await this.taskDependencyRepository.remove(dependency);
  }

  // Helper method to check for circular dependencies
  private async wouldCreateCircularDependency(predecessorId: number, successorId: number): Promise<boolean> {
    // Use a simple DFS to check if there's already a path from successor to predecessor
    const visited = new Set<number>();
    const stack = [successorId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      
      if (!currentId) {
        continue;
      }
      
      if (currentId === predecessorId) {
        return true; // Found a cycle
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      // Get all successors of the current task
      const dependencies = await this.taskDependencyRepository.find({
        where: { predecessorTaskId: currentId }
      });

      for (const dep of dependencies) {
        if (!visited.has(dep.successorTaskId)) {
          stack.push(dep.successorTaskId);
        }
      }
    }

    return false;
  }

  // Get sub-tasks for a parent task
  async getSubTasks(parentTaskId: number, userId: number): Promise<Task[]> {
    // Verify parent task ownership
    await this.findTaskById(parentTaskId, userId);

    return this.taskRepository.find({
      where: { parentTaskId, userId },
      relations: ['category', 'tags', 'subTasks']
    });
  }
}