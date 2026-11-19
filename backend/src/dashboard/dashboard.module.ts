import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Club } from '../clubs/entities/club.entity';
import { ClubMembership } from '../clubs/entities/club-membership.entity';
import { Event } from '../events/entities/event.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { Post } from '../posts/entities/post.entity';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Club,
      ClubMembership,
      Event,
      EventRegistration,
      Post,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}