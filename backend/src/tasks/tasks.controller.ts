import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, CreateCategoryDto, UpdateCategoryDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskStatus } from './entities/task.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  createTask(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(req.user.id, createTaskDto);
  }

  @Get()
  findAllTasks(
    @Request() req,
    @Query('status') status?: TaskStatus,
    @Query('categoryId') categoryId?: number,
    @Query('search') search?: string,
  ) {
    return this.tasksService.findAllTasks(req.user.id, status, categoryId, search);
  }

  @Get('stats')
  getTaskStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.tasksService.getTaskStats(req.user.id, start, end);
  }

  @Get(':id')
  findTaskById(@Param('id') id: string, @Request() req) {
    return this.tasksService.findTaskById(+id, req.user.id);
  }

  @Patch(':id')
  updateTask(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(+id, req.user.id, updateTaskDto);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.deleteTask(+id, req.user.id);
  }

  // Category endpoints
  @Post('categories')
  createCategory(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.tasksService.createCategory(req.user.id, createCategoryDto);
  }

  @Get('categories/all')
  findAllCategories(@Request() req) {
    return this.tasksService.findAllCategories(req.user.id);
  }

  @Get('categories/:id')
  findCategoryById(@Param('id') id: string, @Request() req) {
    return this.tasksService.findCategoryById(+id, req.user.id);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.tasksService.updateCategory(+id, req.user.id, updateCategoryDto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string, @Request() req) {
    return this.tasksService.deleteCategory(+id, req.user.id);
  }
}