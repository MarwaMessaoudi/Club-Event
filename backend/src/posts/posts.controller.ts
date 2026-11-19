import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

import { PostsService } from './posts.service';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(
    @Query() query: PostQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.postsService.findAll(query, user.role, user.id);
  }

  @Post()
  create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.postsService.create(dto, user.id, user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePostStatusDto,
  ) {
    return this.postsService.updateStatus(id, dto.status);
  }

  // ------------------------------------------------------------------
  // Reactions
  // ------------------------------------------------------------------

  @Put(':id/reactions')
  setReaction(
    @Param('id') postId: string,
    @Body() dto: SetReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.setReaction(postId, userId, dto.type);
  }

  @Delete(':id/reactions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.postsService.removeReaction(postId, userId);
  }

  // ------------------------------------------------------------------
  // Comments
  // ------------------------------------------------------------------

  @Get(':id/comments')
  findComments(
    @Param('id') postId: string,
    @Query() query: CommentQueryDto,
  ) {
    return this.postsService.findComments(postId, query);
  }

  @Post(':id/comments')
  createComment(
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.createComment(postId, userId, dto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.postsService.deleteComment(
      postId,
      commentId,
      user.id,
      user.role,
    );
  }

  // ------------------------------------------------------------------
  // Views
  // ------------------------------------------------------------------

  @Post(':id/view')
  registerView(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.registerView(postId, userId);
  }
}