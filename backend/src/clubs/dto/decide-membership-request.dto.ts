import { IsIn } from 'class-validator';
import { MembershipStatus } from '../entities/membership-status.enum';

export class DecideMembershipRequestDto {
  @IsIn([
    MembershipStatus.APPROVED,
    MembershipStatus.REJECTED,
  ])
  status:
    | MembershipStatus.APPROVED
    | MembershipStatus.REJECTED;
}