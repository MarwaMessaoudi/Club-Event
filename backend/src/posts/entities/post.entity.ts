import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Club } from '../../clubs/entities/club.entity';
import { Event } from '../../events/entities/event.entity';
import { PostStatus } from './post-status.enum';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.PENDING })
  status: PostStatus;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

 
  @ManyToOne(() => Club, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club | null;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}