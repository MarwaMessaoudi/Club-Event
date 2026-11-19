import { IsEnum } from 'class-validator';
import { ClubStatus } from '../entities/club-status.enum';

export class UpdateClubStatusDto {
  @IsEnum(ClubStatus)
  status: ClubStatus;
}