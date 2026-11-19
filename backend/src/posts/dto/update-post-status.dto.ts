import { IsEnum } from 'class-validator';
import { PostStatus } from '../entities/post-status.enum';

export class UpdatePostStatusDto {
  @IsEnum(PostStatus)
  status: PostStatus;
}