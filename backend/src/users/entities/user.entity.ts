import {
  Column, CreateDateColumn, Entity,
  OneToMany,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from './user-status.enum';

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  STUDENT = 'student',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // select: false → TypeORM NEVER returns this column unless explicitly asked
  @Column({ select: false })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

   @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;
  
  // Hash of the current refresh token. NULL = user is logged out.
  @Column({ type: 'varchar', nullable: true, select: false })
  hashedRefreshToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export { UserStatus };
