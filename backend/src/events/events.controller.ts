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
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { EventRegistrationQueryDto } from './dto/event-registration-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { EventsService } from './events.service';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(
    @Query() query: EventQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.findAll(query, user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.create(dto, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') eventId: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.update(
      eventId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') eventId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.eventsService.remove(
      eventId,
      user.id,
      user.role,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
  ) {
    return this.eventsService.updateStatus(id, dto.status);
  }

  @Post(':id/register')
  register(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.register(eventId, userId);
  }

  @Delete(':id/register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelRegistration(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.eventsService.cancelRegistration(eventId, userId);
  }

  @Get(':id/registrations')
  listRegistrations(
    @Param('id') eventId: string,
    @Query() query: EventRegistrationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.listRegistrations(
      eventId,
      query,
      user.id,
      user.role,
    );
  }

  @Post(':id/registrations/:registrationId/check-in')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  checkIn(
    @Param('id') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.eventsService.checkIn(eventId, registrationId);
  }
}