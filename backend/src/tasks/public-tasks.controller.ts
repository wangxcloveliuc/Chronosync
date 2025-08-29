import { Controller, Get, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('public/tasks')
export class PublicTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('shared/:shareToken')
  getSharedTask(@Param('shareToken') shareToken: string) {
    return this.tasksService.getSharedTask(shareToken);
  }
}