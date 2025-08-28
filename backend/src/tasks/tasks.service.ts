import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Category } from './entities/category.entity';
import { CreateTaskDto, UpdateTaskDto, CreateCategoryDto, UpdateCategoryDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createTask(userId: number, createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      reminderTime: createTaskDto.reminderTime ? new Date(createTaskDto.reminderTime) : undefined,
    });
    return this.taskRepository.save(task);
  }

  async findAllTasks(
    userId: number,
    status?: TaskStatus,
    categoryId?: number,
    search?: string
  ): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
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

    return query.orderBy('task.createdAt', 'DESC').getMany();
  }

  async findTaskById(id: number, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(id: number, userId: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findTaskById(id, userId);
    
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

    await this.taskRepository.update(id, updateData);
    return this.findTaskById(id, userId);
  }

  async deleteTask(id: number, userId: number): Promise<void> {
    const task = await this.findTaskById(id, userId);
    await this.taskRepository.remove(task);
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
}