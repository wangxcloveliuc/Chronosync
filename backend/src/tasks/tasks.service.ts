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

    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
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