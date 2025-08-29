import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PublicTasksController } from './public-tasks.controller';
import { Task } from './entities/task.entity';
import { Category } from './entities/category.entity';
import { TaskShare } from './entities/task-share.entity';
import { CategoryCollaborator } from './entities/category-collaborator.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Category, TaskShare, CategoryCollaborator])],
  controllers: [TasksController, PublicTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}