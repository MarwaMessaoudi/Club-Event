import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Club } from '../clubs/entities/club.entity';
import { Event } from '../events/entities/event.entity';
import { Post } from '../posts/entities/post.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Club,
      Event,
      Post,
      EventRegistration,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}