import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubsModule } from '../clubs/clubs.module';
import { Event } from '../events/entities/event.entity';
import { Post } from './entities/post.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostView } from './entities/post-view.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Event,
      PostReaction,
      PostComment,
      PostView,
    ]),
    ClubsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}