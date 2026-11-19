import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from './entities/club.entity';
import { ClubMembership } from './entities/club-membership.entity';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Club, ClubMembership])],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService, TypeOrmModule],
})
export class ClubsModule {}