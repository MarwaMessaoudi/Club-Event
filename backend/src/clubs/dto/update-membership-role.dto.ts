import { IsEnum } from 'class-validator';
import { ClubMemberRole } from '../entities/club-member-role.enum';

export class UpdateMembershipRoleDto {
  @IsEnum(ClubMemberRole)
  role: ClubMemberRole;
}