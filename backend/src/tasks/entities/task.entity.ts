import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { TaskTag } from './task-tag.entity';
import { TaskDependency } from './task-dependency.entity';

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

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'text',
    enum: TaskStatus,
    default: TaskStatus.TODO
  })
  status: TaskStatus;

  @Column({
    type: 'text',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'datetime', nullable: true })
  reminderTime: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => User, user => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Category, category => category.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  // Sub-task relationships
  @ManyToOne(() => Task, task => task.subTasks, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask: Task;

  @Column({ nullable: true })
  parentTaskId: number;

  @OneToMany(() => Task, task => task.parentTask)
  subTasks: Task[];

  // Task tags
  @ManyToMany(() => TaskTag, tag => tag.tasks, { cascade: true })
  @JoinTable({
    name: 'task_tags',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' }
  })
  tags: TaskTag[];

  // Task dependencies
  @OneToMany(() => TaskDependency, dependency => dependency.predecessorTask)
  successorDependencies: TaskDependency[];

  @OneToMany(() => TaskDependency, dependency => dependency.successorTask)
  predecessorDependencies: TaskDependency[];

  // Progress calculation for parent tasks
  @Column({ type: 'float', default: 0 })
  progress: number; // 0-100 percentage based on sub-task completion
}