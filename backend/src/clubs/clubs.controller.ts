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

import { ClubsService } from './clubs.service';

import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubQueryDto } from './dto/club-query.dto';
import { UpdateClubStatusDto } from './dto/update-club-status.dto';
import { UpdateMembershipRoleDto } from './dto/update-membership-role.dto';
import { DecideMembershipRequestDto } from './dto/decide-membership-request.dto';

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly clubsService: ClubsService,
  ) {}

  /**
   * GET /api/clubs
   *
   * Students: approved clubs only.
   * Supervisor/admin: can request a status filter.
   */
  @Get()
  findAll(
    @Query() query: ClubQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clubsService.findAll(
      query,
      user.id,
      user.role,
    );
  }

  /**
   * POST /api/clubs
   *
   * Any authenticated user can propose a club.
   * Club is PENDING; creator becomes APPROVED manager.
   */
  @Post()
  create(
    @Body() dto: CreateClubDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.clubsService.create(dto, userId);
  }

  /**
   * GET /api/clubs/:id/members
   *
   * Returns only approved members.
   */
  @Get(':id/members')
  getMembers(
    @Param('id') clubId: string,
  ) {
    return this.clubsService.getMembers(clubId);
  }

  /**
   * POST /api/clubs/:id/join
   *
   * Creates a PENDING membership request.
   * Student is not automatically a member.
   */
  @Post(':id/join')
  requestToJoin(
    @Param('id') clubId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.clubsService.requestToJoin(
      clubId,
      userId,
    );
  }

  /**
   * DELETE /api/clubs/:id/leave
   *
   * Approved member leaves.
   * Pending applicant cancels request.
   */
  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveClub(
    @Param('id') clubId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.clubsService.leaveClub(
      clubId,
      userId,
    );
  }

  /**
   * GET /api/clubs/:id/join-requests
   *
   * Only the APPROVED manager of this club can see requests.
   */
  @Get(':id/join-requests')
  getPendingJoinRequests(
    @Param('id') clubId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.clubsService.getPendingJoinRequests(
      clubId,
      requesterId,
    );
  }

  /**
   * PATCH /api/clubs/:clubId/join-requests/:requestId
   *
   * Body:
   * { "status": "approved" }
   * or
   * { "status": "rejected" }
   *
   * Only the club manager can decide.
   */
  @Patch(':clubId/join-requests/:requestId')
  decideJoinRequest(
    @Param('clubId') clubId: string,
    @Param('requestId') requestId: string,
    @Body() dto: DecideMembershipRequestDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.clubsService.decideMembershipRequest(
      clubId,
      requestId,
      dto.status,
      requesterId,
    );
  }

  /**
   * PATCH /api/clubs/:clubId/members/:userId/role
   *
   * Only the approved club manager can assign a local role.
   */
  @Patch(':clubId/members/:userId/role')
  updateMemberRole(
    @Param('clubId') clubId: string,
    @Param('userId') memberUserId: string,
    @Body() dto: UpdateMembershipRoleDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.clubsService.updateMemberRole(
      clubId,
      memberUserId,
      dto.role,
      requesterId,
    );
  }

  /**
   * PATCH /api/clubs/:id
   *
   * Only the club manager can edit club information.
   */
  @Patch(':id')
  update(
    @Param('id') clubId: string,
    @Body() dto: UpdateClubDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.clubsService.update(
      clubId,
      dto,
      requesterId,
    );
  }

  /**
   * PATCH /api/clubs/:id/status
   *
   * Only Supervisor/Admin can approve/reject club proposals.
   */
  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  updateStatus(
    @Param('id') clubId: string,
    @Body() dto: UpdateClubStatusDto,
  ) {
    return this.clubsService.updateStatus(
      clubId,
      dto.status,
    );
  }

  /**
   * Keep this dynamic route LAST.
   * Static routes like /members and /join-requests must be declared first.
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.clubsService.findOne(id);
  }
}