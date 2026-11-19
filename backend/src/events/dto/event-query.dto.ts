import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/paginaton-query.dto';
import { EventStatus } from '../entities/event-status.enum';

export class EventQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsUUID()
  clubId?: string;
}