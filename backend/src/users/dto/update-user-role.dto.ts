import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}