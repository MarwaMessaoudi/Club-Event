import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClubsService } from '../clubs/clubs.service';
import { Club } from '../clubs/entities/club.entity';
import { Event } from '../events/entities/event.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Paginated, paginate } from '../common/interfaces/paginated';
import { RealtimeService } from '../realtime/realtime.service';

import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

import { Post } from './entities/post.entity';
import { PostStatus } from './entities/post-status.enum';
import { PostReaction } from './entities/post-reaction.entity';
import { PostReactionType } from './entities/post-reaction-type.enum';
import { PostComment } from './entities/post-comment.entity';
import { PostView } from './entities/post-view.entity';

type PostMeta = {
  reactions: Record<PostReactionType, number>;
  reactionsTotal: number;
  myReaction: PostReactionType | null;
  commentsCount: number;
  viewsCount: number;
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,

    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,

    @InjectRepository(PostReaction)
    private readonly reactionsRepo: Repository<PostReaction>,

    @InjectRepository(PostComment)
    private readonly commentsRepo: Repository<PostComment>,

    @InjectRepository(PostView)
    private readonly viewsRepo: Repository<PostView>,

    private readonly clubsService: ClubsService,
    private readonly realtime: RealtimeService,
  ) {}

  // ------------------------------------------------------------------
  // Posts
  // ------------------------------------------------------------------

  async create(
    dto: CreatePostDto,
    userId: string,
    globalRole: UserRole,
  ): Promise<Post> {
    let club: Club | null = null;
    let event: Event | null = null;

    if (dto.clubId) {
      // Supervisor/admin may create in any club.
      // Normal users must be approved members.
      if (
        globalRole !== UserRole.SUPERVISOR &&
        globalRole !== UserRole.ADMIN
      ) {
        await this.clubsService.assertMember(dto.clubId, userId);
      }

      club = await this.clubsService.findOne(dto.clubId);
    }

    if (dto.eventId) {
      event = await this.eventsRepo.findOne({
        where: { id: dto.eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }
    }

    const isPrivileged =
      globalRole === UserRole.SUPERVISOR ||
      globalRole === UserRole.ADMIN;

    const isClubPost = !!club;

    // Final business rule:
    // - Club posts are auto-approved.
    // - Supervisor/admin posts are auto-approved.
    // - Global student posts are pending supervisor approval.
    const status =
      isPrivileged || isClubPost
        ? PostStatus.APPROVED
        : PostStatus.PENDING;

    const post = await this.postsRepo.save(
      this.postsRepo.create({
        content: dto.content,
        image: dto.image ?? null,
        author: { id: userId } as User,
        club,
        event,
        status,
      }),
    );

    this.realtime.emitToAll('post.created', {
      postId: post.id,
      status: post.status,
    });

    return post;
  }

  async findAll(
    query: PostQueryDto,
    role: UserRole,
    userId: string,
  ): Promise<Paginated<Post & PostMeta>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.postsRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.club', 'club')
      .leftJoinAndSelect('post.event', 'event')
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    /**
     * Final permission model:
     * - Supervisor can query pending global posts.
     * - Admin does NOT moderate posts, so admin sees approved only.
     * - Students see approved only.
     */
    const effectiveStatus =
      role === UserRole.SUPERVISOR
        ? query.status
        : PostStatus.APPROVED;

    if (effectiveStatus) {
      qb.andWhere('post.status = :status', { status: effectiveStatus });
    }

    if (query.search) {
      qb.andWhere('post.content ILIKE :q', {
        q: `%${query.search}%`,
      });
    }

    if (query.clubId) {
      qb.andWhere('club.id = :clubId', {
        clubId: query.clubId,
      });
    }

    if (query.eventId) {
      qb.andWhere('event.id = :eventId', {
        eventId: query.eventId,
      });
    }

    const [posts, total] = await qb.getManyAndCount();
    const data = await this.attachPostMeta(posts, userId);

    return paginate(data, total, page, limit);
  }

  async updateStatus(
    id: string,
    status: PostStatus,
  ): Promise<Post> {
    const post = await this.postsRepo.findOne({
      where: { id },
      relations: {
        author: true,
        club: true,
        event: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.status = status;
    const saved = await this.postsRepo.save(post);

    this.realtime.emitToAll('post.status.updated', {
      postId: saved.id,
      status: saved.status,
    });

    return saved;
  }

  private async findApprovedPostOrThrow(postId: string): Promise<Post> {
    const post = await this.postsRepo.findOne({
      where: {
        id: postId,
        status: PostStatus.APPROVED,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private async attachPostMeta(
    posts: Post[],
    userId: string,
  ): Promise<(Post & PostMeta)[]> {
    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p.id);

    const reactionRows = await this.reactionsRepo
      .createQueryBuilder('reaction')
      .select('reaction.post_id', 'postId')
      .addSelect('reaction.type', 'type')
      .addSelect('COUNT(reaction.id)', 'count')
      .where('reaction.post_id IN (:...postIds)', { postIds })
      .groupBy('reaction.post_id')
      .addGroupBy('reaction.type')
      .getRawMany<{
        postId: string;
        type: PostReactionType;
        count: string;
      }>();

    const myReactionRows = await this.reactionsRepo
      .createQueryBuilder('reaction')
      .select('reaction.post_id', 'postId')
      .addSelect('reaction.type', 'type')
      .where('reaction.post_id IN (:...postIds)', { postIds })
      .andWhere('reaction.user_id = :userId', { userId })
      .getRawMany<{
        postId: string;
        type: PostReactionType;
      }>();

    const commentRows = await this.commentsRepo
      .createQueryBuilder('comment')
      .select('comment.post_id', 'postId')
      .addSelect('COUNT(comment.id)', 'count')
      .where('comment.post_id IN (:...postIds)', { postIds })
      .groupBy('comment.post_id')
      .getRawMany<{ postId: string; count: string }>();

    const viewRows = await this.viewsRepo
      .createQueryBuilder('view')
      .select('view.post_id', 'postId')
      .addSelect('COUNT(view.id)', 'count')
      .where('view.post_id IN (:...postIds)', { postIds })
      .groupBy('view.post_id')
      .getRawMany<{ postId: string; count: string }>();

    const reactionMap = new Map<string, Record<PostReactionType, number>>();
    const totalMap = new Map<string, number>();

    for (const row of reactionRows) {
      if (!reactionMap.has(row.postId)) {
        reactionMap.set(row.postId, {
          like: 0,
          love: 0,
          laugh: 0,
          angry: 0,
        });
      }

      const reactions = reactionMap.get(row.postId)!;
      reactions[row.type] = Number(row.count);

      totalMap.set(
        row.postId,
        (totalMap.get(row.postId) ?? 0) + Number(row.count),
      );
    }

    const myReactionMap = new Map(
      myReactionRows.map((r) => [r.postId, r.type]),
    );

    const commentsMap = new Map(
      commentRows.map((r) => [r.postId, Number(r.count)]),
    );

    const viewsMap = new Map(
      viewRows.map((r) => [r.postId, Number(r.count)]),
    );

    return posts.map((post) => ({
      ...post,
      reactions: reactionMap.get(post.id) ?? {
        like: 0,
        love: 0,
        laugh: 0,
        angry: 0,
      },
      reactionsTotal: totalMap.get(post.id) ?? 0,
      myReaction: myReactionMap.get(post.id) ?? null,
      commentsCount: commentsMap.get(post.id) ?? 0,
      viewsCount: viewsMap.get(post.id) ?? 0,
    }));
  }

  // ------------------------------------------------------------------
  // Reactions
  // ------------------------------------------------------------------

  async setReaction(
    postId: string,
    userId: string,
    type: PostReactionType,
  ): Promise<PostReaction> {
    await this.findApprovedPostOrThrow(postId);

    const existing = await this.reactionsRepo.findOne({
      where: {
        post: { id: postId },
        user: { id: userId },
      },
    });

    if (existing) {
      existing.type = type;
      const saved = await this.reactionsRepo.save(existing);

      this.realtime.emitToAll('post.reaction.updated', { postId });

      return saved;
    }

    const reaction = await this.reactionsRepo.save(
      this.reactionsRepo.create({
        post: { id: postId } as Post,
        user: { id: userId } as User,
        type,
      }),
    );

    this.realtime.emitToAll('post.reaction.updated', { postId });

    return reaction;
  }

  async removeReaction(
    postId: string,
    userId: string,
  ): Promise<void> {
    await this.findApprovedPostOrThrow(postId);

    const existing = await this.reactionsRepo.findOne({
      where: {
        post: { id: postId },
        user: { id: userId },
      },
    });

    if (existing) {
      await this.reactionsRepo.remove(existing);
      this.realtime.emitToAll('post.reaction.updated', { postId });
    }
  }

  // ------------------------------------------------------------------
  // Comments
  // ------------------------------------------------------------------

  async findComments(
    postId: string,
    query: CommentQueryDto,
  ): Promise<Paginated<PostComment>> {
    await this.findApprovedPostOrThrow(postId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.commentsRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.post_id = :postId', { postId })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return paginate(data, total, page, limit);
  }

  async createComment(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<PostComment> {
    await this.findApprovedPostOrThrow(postId);

    const saved = await this.commentsRepo.save(
      this.commentsRepo.create({
        post: { id: postId } as Post,
        author: { id: userId } as User,
        content: dto.content,
      }),
    );

    const comment = await this.commentsRepo.findOne({
      where: { id: saved.id },
      relations: {
        author: true,
      },
    });

    this.realtime.emitToAll('post.comment.created', {
      postId,
      commentId: saved.id,
    });

    return comment!;
  }

  async deleteComment(
    postId: string,
    commentId: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<void> {
    const comment = await this.commentsRepo.findOne({
      where: {
        id: commentId,
        post: { id: postId },
      },
      relations: {
        author: true,
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAuthor = comment.author.id === requesterId;
    const canModerate =
      requesterRole === UserRole.SUPERVISOR ||
      requesterRole === UserRole.ADMIN;

    if (!isAuthor && !canModerate) {
      throw new ForbiddenException(
        'You can only delete your own comment',
      );
    }

    await this.commentsRepo.remove(comment);

    this.realtime.emitToAll('post.comment.deleted', {
      postId,
      commentId,
    });
  }

  // ------------------------------------------------------------------
  // Views
  // ------------------------------------------------------------------

  async registerView(
    postId: string,
    userId: string,
  ): Promise<{ viewed: boolean }> {
    await this.findApprovedPostOrThrow(postId);

    const existing = await this.viewsRepo.findOne({
      where: {
        post: { id: postId },
        user: { id: userId },
      },
    });

    if (existing) {
      return { viewed: false };
    }

    await this.viewsRepo.save(
      this.viewsRepo.create({
        post: { id: postId } as Post,
        user: { id: userId } as User,
      }),
    );

    this.realtime.emitToAll('post.view.updated', { postId });

    return { viewed: true };
  }
}