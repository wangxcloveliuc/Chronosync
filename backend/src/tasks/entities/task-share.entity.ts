import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './task.entity';
import { User } from '../../users/entities/user.entity';

export enum ShareType {
  PUBLIC_LINK = 'public_link',
  USER_SHARE = 'user_share'
}

@Entity()
export class TaskShare {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shareToken: string; // Unique token for public access

  @Column({
    type: 'text',
    enum: ShareType,
    default: ShareType.PUBLIC_LINK
  })
  shareType: ShareType;

  @Column({ nullable: true })
  sharedWithUserId: number; // For user-to-user sharing

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Column()
  createdByUserId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedWithUserId' })
  sharedWithUser: User | null;
}