import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/paginaton-query.dto';
import { ClubStatus } from '../entities/club-status.enum';

export class ClubQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;
}