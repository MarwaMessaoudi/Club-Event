import {Column,CreateDateColumn, Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn,Unique,} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Club } from './club.entity';
import { ClubMemberRole } from './club-member-role.enum';
import { MembershipStatus } from './membership-status.enum';

@Entity('club_memberships')
@Unique(['user', 'club']) 
export class ClubMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Club, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({
    type: 'enum',
    enum: ClubMemberRole,
    default: ClubMemberRole.MEMBER,
  })
  role: ClubMemberRole;

 @Column({
  type: 'enum',
  enum: MembershipStatus,
  default: MembershipStatus.APPROVED,
})
status: MembershipStatus;
  @CreateDateColumn()
  joinedAt: Date;
}