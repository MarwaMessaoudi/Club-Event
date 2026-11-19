import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ClubsModule } from '../clubs/clubs.module';
import { EventRegistration } from './entities/event-registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event,EventRegistration]),ClubsModule,
],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}



