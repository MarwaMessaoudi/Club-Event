import { IsEnum } from 'class-validator';
import { PostReactionType } from '../entities/post-reaction-type.enum';

export class SetReactionDto {
  @IsEnum(PostReactionType)
  type: PostReactionType;
}