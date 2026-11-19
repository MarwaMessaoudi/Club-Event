import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { ClubStatus } from './club-status.enum';
import { ClubMembership } from './club-membership.entity';
import { Event } from '../../events/entities/event.entity';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('text')
  description: string;

  @Column()
  category: string;
  

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'enum', enum: ClubStatus, default: ClubStatus.PENDING })
  status: ClubStatus;

 
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => Event, (event) => event.club)
  events: Event[];

  @OneToMany(() => Post, (post) => post.club)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}