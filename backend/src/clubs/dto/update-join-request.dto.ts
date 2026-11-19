import { IsIn } from 'class-validator';
import { MembershipStatus } from '../entities/membership-status.enum';

export class UpdateJoinRequestDto {
  @IsIn([MembershipStatus.APPROVED, MembershipStatus.REJECTED])
  status: MembershipStatus;
}