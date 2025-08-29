import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Task } from './task.entity';

export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
  START_TO_FINISH = 'start_to_finish'
}

@Entity()
@Index(['predecessorTaskId', 'successorTaskId'], { unique: true })
export class TaskDependency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    enum: DependencyType,
    default: DependencyType.FINISH_TO_START
  })
  dependencyType: DependencyType;

  @Column({ nullable: true })
  lag: number; // Lag time in hours

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'predecessorTaskId' })
  predecessorTask: Task;

  @Column()
  predecessorTaskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'successorTaskId' })
  successorTask: Task;

  @Column()
  successorTaskId: number;
}