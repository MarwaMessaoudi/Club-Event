import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/entities/user-status.enum';
import { Club } from '../clubs/entities/club.entity';
import { ClubStatus } from '../clubs/entities/club-status.enum';
import { Event } from '../events/entities/event.entity';
import { EventStatus } from '../events/entities/event-status.enum';
import { Post } from '../posts/entities/post.entity';
import { PostStatus } from '../posts/entities/post-status.enum';
import { EventRegistration } from '../events/entities/event-registration.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Club)
    private readonly clubsRepo: Repository<Club>,

    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,

    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,

    @InjectRepository(EventRegistration)
    private readonly registrationsRepo: Repository<EventRegistration>,
  ) {}

  async getStats() {
    const [
      usersTotal,
      usersActive,
      usersSuspended,
      clubsPending,
      clubsApproved,
      eventsPending,
      eventsUpcoming,
      postsPending,
      registrationsTotal,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { status: UserStatus.ACTIVE } }),
      this.usersRepo.count({ where: { status: UserStatus.SUSPENDED } }),
      this.clubsRepo.count({ where: { status: ClubStatus.PENDING } }),
      this.clubsRepo.count({ where: { status: ClubStatus.APPROVED } }),
      this.eventsRepo.count({ where: { status: EventStatus.PENDING } }),
      this.eventsRepo.count({
        where: {
          status: EventStatus.APPROVED,
          startsAt: MoreThan(new Date()),
        },
      }),
      this.postsRepo.count({ where: { status: PostStatus.PENDING } }),
      this.registrationsRepo.count(),
    ]);

    return {
      users: {
        total: usersTotal,
        active: usersActive,
        suspended: usersSuspended,
      },
      clubs: {
        pending: clubsPending,
        approved: clubsApproved,
      },
      events: {
        pending: eventsPending,
        upcoming: eventsUpcoming,
      },
      posts: {
        pending: postsPending,
      },
      registrations: {
        total: registrationsTotal,
      },
    };
  }


  
}