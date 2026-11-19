import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClubsService } from '../clubs/clubs.service';
import { Club } from '../clubs/entities/club.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './entities/event.entity';
import { EventStatus } from './entities/event-status.enum';
import { EventQueryDto } from './dto/event-query.dto';
import { Paginated, paginate } from '../common/interfaces/paginated';
import { EventRegistration } from './entities/event-registration.entity';
import { EventRegistrationQueryDto } from './dto/event-registration-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
 constructor(
  @InjectRepository(Event)
  private readonly eventsRepo: Repository<Event>,

  @InjectRepository(EventRegistration)
  private readonly registrationsRepo: Repository<EventRegistration>,

  private readonly dataSource: DataSource,

  private readonly clubsService: ClubsService,
) {}

  async create(
    dto: CreateEventDto,
    userId: string,
    globalRole: UserRole,
  ): Promise<Event> {
    let club: Club | null = null;

    if (dto.clubId) {
      await this.clubsService.assertManagerOrAdmin(
        dto.clubId,
        userId,
        globalRole,
      );

      club = await this.clubsService.findOne(dto.clubId);
    } else if (
      globalRole !== UserRole.SUPERVISOR &&
      globalRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only a supervisor or administrator can create a global event',
      );
    }

    return this.eventsRepo.save(
      this.eventsRepo.create({
        title: dto.title,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        location: dto.location,
        capacity: dto.capacity,
        image: dto.image ?? null, 
        club,
        createdBy: { id: userId } as User,
        status:
          globalRole === UserRole.ADMIN || globalRole === UserRole.SUPERVISOR
            ? EventStatus.APPROVED
            : EventStatus.PENDING,
      }),
    );
  }

private async attachRegistrationMeta(
  events: Event[],
  userId: string,
): Promise<(Event & { registeredCount: number; amIRegistered: boolean })[]> {
  if (events.length === 0) return [];

  const ids = events.map((e) => e.id);

  const rawCounts = await this.registrationsRepo
    .createQueryBuilder('registration')
    .select('registration.event_id', 'eventId')
    .addSelect('COUNT(*)', 'count')
    .where('registration.event_id IN (:...ids)', { ids })
    .groupBy('registration.event_id')
    .getRawMany<{ eventId: string; count: string }>();

  const rawMine = await this.registrationsRepo
    .createQueryBuilder('registration')
    .select('registration.event_id', 'eventId')
    .where('registration.event_id IN (:...ids)', { ids })
    .andWhere('registration.user_id = :userId', { userId })
    .getRawMany<{ eventId: string }>();

  const countMap = new Map(rawCounts.map((r) => [r.eventId, Number(r.count)]));
  const mineSet = new Set(rawMine.map((r) => r.eventId));

  return events.map((event) => ({
    ...event,
    registeredCount: countMap.get(event.id) ?? 0,
    amIRegistered: mineSet.has(event.id),
  }));
}
async findAll(
  query: EventQueryDto,
  userId: string,
  role: UserRole,
): Promise<Paginated<Event & { registeredCount: number; amIRegistered: boolean }>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const qb = this.eventsRepo
    .createQueryBuilder('event')
    .leftJoinAndSelect('event.club', 'club')
    .leftJoinAndSelect('event.createdBy', 'createdBy')
    .orderBy('event.startsAt', 'ASC')
    .skip((page - 1) * limit)
    .take(limit);

  const canModerate = role === UserRole.ADMIN || role === UserRole.SUPERVISOR;
  const effectiveStatus = canModerate ? query.status : EventStatus.APPROVED;

  if (effectiveStatus) {
    qb.andWhere('event.status = :status', { status: effectiveStatus });
  }

  if (query.search) {
    qb.andWhere(
      '(event.title ILIKE :q OR event.description ILIKE :q OR event.location ILIKE :q)',
      { q: `%${query.search}%` },
    );
  }

  if (query.clubId) {
    qb.andWhere('club.id = :clubId', { clubId: query.clubId });
  }

  const [events, total] = await qb.getManyAndCount();
  const data = await this.attachRegistrationMeta(events, userId);

  return paginate(data, total, page, limit);
}

 async findOne(id: string): Promise<Event> {
  const event = await this.eventsRepo.findOne({
    where: { id },
    relations: {
      club: true,
      createdBy: true,
    },
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  return event;
}

  async updateStatus(id: string, status: EventStatus): Promise<Event> {
    const event = await this.findOne(id);
    event.status = status;
    return this.eventsRepo.save(event);
  }




  async register(eventId: string, userId: string): Promise<EventRegistration> {
  return this.dataSource.transaction(async (manager) => {
    const event = await manager.findOne(Event, {
      where: { id: eventId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.APPROVED) {
      throw new ConflictException('Event is not open for registration');
    }

    const alreadyRegistered = await manager.findOne(EventRegistration, {
      where: {
        event: { id: eventId },
        user: { id: userId },
      },
    });

    if (alreadyRegistered) {
      throw new ConflictException('Already registered for this event');
    }

    const registeredCount = await manager.count(EventRegistration, {
      where: {
        event: { id: eventId },
      },
    });

    if (event.capacity > 0 && registeredCount >= event.capacity) {
      throw new ConflictException('Event is full');
    }

    return manager.save(
      manager.create(EventRegistration, {
        event: { id: eventId } as Event,
        user: { id: userId } as User,
        checkedInAt: null,
      }),
    );
  });
}

async cancelRegistration(eventId: string, userId: string): Promise<void> {
  const registration = await this.registrationsRepo.findOne({
    where: {
      event: { id: eventId },
      user: { id: userId },
    },
  });

  if (!registration) {
    throw new NotFoundException('Registration not found');
  }

  await this.registrationsRepo.remove(registration);
}

async listRegistrations(
  eventId: string,
  query: EventRegistrationQueryDto,
  requesterId: string,
  requesterRole: UserRole,
): Promise<Paginated<EventRegistration>> {
  const event = await this.findOne(eventId);

  const canModerate =
    requesterRole === UserRole.ADMIN || requesterRole === UserRole.SUPERVISOR;

  if (!canModerate) {
    if (!event.club) {
      throw new ForbiddenException(
        'Only supervisors or administrators can view registrations for global events',
      );
    }

    await this.clubsService.assertManagerOrAdmin(
      event.club.id,
      requesterId,
      requesterRole,
    );
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const qb = this.registrationsRepo
    .createQueryBuilder('registration')
    .leftJoinAndSelect('registration.user', 'user')
    .leftJoinAndSelect('registration.event', 'event')
    .where('event.id = :eventId', { eventId })
    .orderBy('registration.registeredAt', 'ASC')
    .skip((page - 1) * limit)
    .take(limit);

  if (query.search) {
    qb.andWhere(
      '(user.email ILIKE :q OR user.firstName ILIKE :q OR user.lastName ILIKE :q)',
      { q: `%${query.search}%` },
    );
  }

  const [data, total] = await qb.getManyAndCount();

  return paginate(data, total, page, limit);
}


async checkIn(
  eventId: string,
  registrationId: string,
): Promise<EventRegistration> {
  const registration = await this.registrationsRepo.findOne({
    where: {
      id: registrationId,
      event: { id: eventId },
    },
    relations: {
      user: true,
      event: true,
    },
  });

  if (!registration) {
    throw new NotFoundException('Registration not found');
  }

  if (registration.checkedInAt) {
    throw new ConflictException('Registration already checked in');
  }

  registration.checkedInAt = new Date();

  return this.registrationsRepo.save(registration);
}



async update(
  eventId: string,
  dto: UpdateEventDto,
  requesterId: string,
  requesterRole: UserRole,
): Promise<Event> {
  const event = await this.findOne(eventId);

  await this.assertCanManageEvent(event, requesterId, requesterRole);

  // Cannot reduce capacity below the current number of registrations.
  if (dto.capacity !== undefined) {
    const registrationsCount = await this.registrationsRepo.count({
      where: {
        event: { id: eventId },
      },
    });

    if (dto.capacity < registrationsCount) {
      throw new ConflictException(
        `Capacity cannot be lower than the current registrations (${registrationsCount})`,
      );
    }
  }

  Object.assign(event, {
    ...(dto.title !== undefined && { title: dto.title }),
    ...(dto.description !== undefined && { description: dto.description }),
    ...(dto.location !== undefined && { location: dto.location }),
    ...(dto.capacity !== undefined && { capacity: dto.capacity }),
    ...(dto.image !== undefined && { image: dto.image }),
    ...(dto.startsAt !== undefined && {
      startsAt: new Date(dto.startsAt),
    }),
    ...(dto.endsAt !== undefined && {
      endsAt: new Date(dto.endsAt),
    }),
  });

  return this.eventsRepo.save(event);
}

async remove(
  eventId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> {
  const event = await this.findOne(eventId);

  await this.assertCanManageEvent(event, requesterId, requesterRole);

  await this.eventsRepo.remove(event);
}

private async assertCanManageEvent(
  event: Event,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> {
  // Admins and supervisors manage all events.
  if (
    requesterRole === UserRole.ADMIN ||
    requesterRole === UserRole.SUPERVISOR
  ) {
    return;
  }

  // Student can manage only an event from a club they manage.
  if (event.club) {
    await this.clubsService.assertManagerOrAdmin(
      event.club.id,
      requesterId,
      requesterRole,
    );
    return;
  }

  throw new ForbiddenException(
    'Only supervisors or administrators can manage global events',
  );
}

}