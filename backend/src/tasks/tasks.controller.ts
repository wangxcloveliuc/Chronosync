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
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, CreateCategoryDto, UpdateCategoryDto, CreateTaskShareDto, CreateCategoryCollaboratorDto } from './dto/task.dto';
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
  findTaskById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.findTaskById(id, req.user.id);
  }

  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(id, req.user.id, updateTaskDto);
  }

  @Delete(':id')
  deleteTask(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.deleteTask(id, req.user.id);
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
  findCategoryById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.findCategoryById(id, req.user.id);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.tasksService.updateCategory(id, req.user.id, updateCategoryDto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.deleteCategory(id, req.user.id);
  }

  // Task sharing endpoints
  @Post(':id/share')
  createTaskShare(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() createTaskShareDto: CreateTaskShareDto,
  ) {
    return this.tasksService.createTaskShare(id, req.user.id, createTaskShareDto);
  }

  @Get('shares')
  getTaskShares(@Request() req) {
    return this.tasksService.getTaskShares(req.user.id);
  }

  @Delete('shares/:id')
  revokeTaskShare(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.revokeTaskShare(id, req.user.id);
  }

  // Category collaboration endpoints
  @Post('categories/:id/collaborators')
  addCategoryCollaborator(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() createCollaboratorDto: CreateCategoryCollaboratorDto,
  ) {
    const dto = { ...createCollaboratorDto, categoryId: id };
    return this.tasksService.addCategoryCollaborator(req.user.id, dto);
  }

  @Get('categories/:id/collaborators')
  getCategoryCollaborators(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.getCategoryCollaborators(id, req.user.id);
  }

  @Get('categories/shared')
  getSharedCategories(@Request() req) {
    return this.tasksService.getSharedCategories(req.user.id);
  }

  @Delete('categories/:categoryId/collaborators/:userId')
  removeCategoryCollaborator(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.tasksService.removeCategoryCollaborator(categoryId, userId, req.user.id);
  }

  @Patch('categories/:categoryId/collaborators/:userId')
  updateCategoryCollaboratorRole(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { role: 'viewer' | 'editor' | 'admin' },
    @Request() req,
  ) {
    return this.tasksService.updateCategoryCollaboratorRole(categoryId, userId, body.role as any, req.user.id);
  }
}