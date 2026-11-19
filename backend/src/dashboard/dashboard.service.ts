import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/entities/user-status.enum';

import { Club } from '../clubs/entities/club.entity';
import { ClubMembership } from '../clubs/entities/club-membership.entity';
import { ClubStatus } from '../clubs/entities/club-status.enum';

import { Event } from '../events/entities/event.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { EventStatus } from '../events/entities/event-status.enum';

import { Post } from '../posts/entities/post.entity';
import { PostStatus } from '../posts/entities/post-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Club)
    private readonly clubsRepo: Repository<Club>,

    @InjectRepository(ClubMembership)
    private readonly membershipsRepo: Repository<ClubMembership>,

    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,

    @InjectRepository(EventRegistration)
    private readonly registrationsRepo: Repository<EventRegistration>,

    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
  ) {}

  async getStats() {
    const now = new Date();

    const [
      usersTotal,
      usersActive,
      usersSuspended,

      clubsTotal,
      clubsApproved,
      clubsPending,
      clubsRejected,
      membershipsTotal,

      eventsTotal,
      eventsApproved,
      eventsPending,
      eventsUpcoming,

      
      postsTotal,
      postsApproved,
      postsPending,

      registrationsTotal,
      checkedInTotal,
      eventsRejected,
      postsRejected,
    ] = await Promise.all([
      // Users
      this.usersRepo.count(),
      this.usersRepo.count({
        where: { status: UserStatus.ACTIVE },
      }),
      this.usersRepo.count({
        where: { status: UserStatus.SUSPENDED },
      }),

      // Clubs
      this.clubsRepo.count(),
      this.clubsRepo.count({
        where: { status: ClubStatus.APPROVED },
      }),
      this.clubsRepo.count({
        where: { status: ClubStatus.PENDING },
      }),
      this.clubsRepo.count({
        where: { status: ClubStatus.REJECTED },
      }),
      this.membershipsRepo.count(),


      this.eventsRepo.count({
  where: { status: EventStatus.REJECTED },
}),

this.postsRepo.count({
  where: { status: PostStatus.REJECTED },
}),
      // Events
      this.eventsRepo.count(),
      this.eventsRepo.count({
        where: { status: EventStatus.APPROVED },
      }),
      this.eventsRepo.count({
        where: { status: EventStatus.PENDING },
      }),
      this.eventsRepo.count({
        where: {
          status: EventStatus.APPROVED,
          startsAt: MoreThan(now),
        },
      }),

      // Posts
      this.postsRepo.count(),
      this.postsRepo.count({
        where: { status: PostStatus.APPROVED },
      }),
      this.postsRepo.count({
        where: { status: PostStatus.PENDING },
      }),

      // Event attendance
      this.registrationsRepo.count(),
      this.registrationsRepo.count({
        where: {
          checkedInAt: Not(IsNull()),
        },
      }),
    ]);


    return {
      generatedAt: new Date().toISOString(),

      users: {
        total: usersTotal,
        active: usersActive,
        suspended: usersSuspended,
      },

      clubs: {
        total: clubsTotal,
        approved: clubsApproved,
        pending: clubsPending,
        rejected: clubsRejected,
        memberships: membershipsTotal,
      },

      events: {
  total: eventsTotal,
  approved: eventsApproved,
  pending: eventsPending,
  rejected: eventsRejected,
  upcoming: eventsUpcoming,
},

posts: {
  total: postsTotal,
  approved: postsApproved,
  pending: postsPending,
  rejected: postsRejected,
},

      attendance: {
        registrations: registrationsTotal,
        checkedIn: checkedInTotal,
      },
    };
  }
}