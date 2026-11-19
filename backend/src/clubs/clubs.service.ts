import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from '../users/entities/user.entity';
import { Paginated, paginate } from '../common/interfaces/paginated';

import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubQueryDto } from './dto/club-query.dto';

import { Club } from './entities/club.entity';
import { ClubMembership } from './entities/club-membership.entity';
import { ClubMemberRole } from './entities/club-member-role.enum';
import { ClubStatus } from './entities/club-status.enum';
import { MembershipStatus } from './entities/membership-status.enum';

type ClubListItem = Club & {
  membersCount: number;
  pendingCount: number;
  isMember: boolean;
  myRole: ClubMemberRole | null;
  membershipStatus: MembershipStatus | null;
};

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private readonly clubsRepo: Repository<Club>,

    @InjectRepository(ClubMembership)
    private readonly membershipsRepo: Repository<ClubMembership>,
  ) {}

  /**
   * Any authenticated user can propose a club.
   * The proposer automatically becomes the approved manager.
   * The club itself remains PENDING until supervisor/admin approval.
   */
  async create(dto: CreateClubDto, userId: string): Promise<Club> {
    const existing = await this.clubsRepo.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('A club with this name already exists');
    }

    const club = await this.clubsRepo.save(
      this.clubsRepo.create({
        ...dto,
        createdBy: { id: userId } as User,
        status: ClubStatus.PENDING,
      }),
    );

    await this.membershipsRepo.save(
      this.membershipsRepo.create({
        club: { id: club.id } as Club,
        user: { id: userId } as User,
        role: ClubMemberRole.MANAGER,
        status: MembershipStatus.APPROVED,
      }),
    );

    return club;
  }

  /**
   * Students can only see approved clubs.
   * Supervisors/admins can filter by a requested status or see all.
   */
  async findAll(
    query: ClubQueryDto,
    userId: string,
    globalRole: UserRole,
  ): Promise<Paginated<ClubListItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.clubsRepo
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.createdBy', 'createdBy')
      .orderBy('club.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const canModerate =
      globalRole === UserRole.ADMIN ||
      globalRole === UserRole.SUPERVISOR;

    const effectiveStatus = canModerate
      ? query.status
      : ClubStatus.APPROVED;

    if (effectiveStatus) {
      qb.andWhere('club.status = :status', {
        status: effectiveStatus,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(club.name ILIKE :search OR club.description ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.category) {
      qb.andWhere('club.category ILIKE :category', {
        category: query.category,
      });
    }

    const [clubs, total] = await qb.getManyAndCount();

    const data = await this.attachMembershipMeta(clubs, userId);

    return paginate(data, total, page, limit);
  }

  /**
   * Adds frontend-ready membership information:
   *
   * membersCount      = approved members only
   * pendingCount      = pending join requests
   * membershipStatus  = current logged-in user's request state
   * myRole            = local club role if approved
   * isMember          = true only when approved
   */
  private async attachMembershipMeta(
    clubs: Club[],
    userId: string,
  ): Promise<ClubListItem[]> {
    if (clubs.length === 0) {
      return [];
    }

    const clubIds = clubs.map((club) => club.id);

    const rawApprovedCounts = await this.membershipsRepo
      .createQueryBuilder('membership')
      .select('membership.club_id', 'clubId')
      .addSelect('COUNT(membership.id)', 'count')
      .where('membership.club_id IN (:...clubIds)', { clubIds })
      .andWhere('membership.status = :approvedStatus', {
        approvedStatus: MembershipStatus.APPROVED,
      })
      .groupBy('membership.club_id')
      .getRawMany<{ clubId: string; count: string }>();

    const rawPendingCounts = await this.membershipsRepo
      .createQueryBuilder('membership')
      .select('membership.club_id', 'clubId')
      .addSelect('COUNT(membership.id)', 'count')
      .where('membership.club_id IN (:...clubIds)', { clubIds })
      .andWhere('membership.status = :pendingStatus', {
        pendingStatus: MembershipStatus.PENDING,
      })
      .groupBy('membership.club_id')
      .getRawMany<{ clubId: string; count: string }>();

    const rawCurrentUserMemberships = await this.membershipsRepo
      .createQueryBuilder('membership')
      .select('membership.club_id', 'clubId')
      .addSelect('membership.role', 'role')
      .addSelect('membership.status', 'status')
      .where('membership.club_id IN (:...clubIds)', { clubIds })
      .andWhere('membership.user_id = :userId', { userId })
      .getRawMany<{
        clubId: string;
        role: ClubMemberRole;
        status: MembershipStatus;
      }>();

    const approvedCountMap = new Map(
      rawApprovedCounts.map((row) => [
        row.clubId,
        Number(row.count),
      ]),
    );

    const pendingCountMap = new Map(
      rawPendingCounts.map((row) => [
        row.clubId,
        Number(row.count),
      ]),
    );

    const currentUserMembershipMap = new Map(
      rawCurrentUserMemberships.map((row) => [
        row.clubId,
        row,
      ]),
    );

    return clubs.map((club) => {
      const membership = currentUserMembershipMap.get(club.id);

      const isApprovedMember =
        membership?.status === MembershipStatus.APPROVED;

      return {
        ...club,
        membersCount: approvedCountMap.get(club.id) ?? 0,
        pendingCount: pendingCountMap.get(club.id) ?? 0,
        membershipStatus: membership?.status ?? null,
        myRole: isApprovedMember
          ? membership?.role ?? null
          : null,
        isMember: isApprovedMember,
      };
    });
  }

  async findOne(id: string): Promise<Club> {
    const club = await this.clubsRepo.findOne({
      where: { id },
      relations: {
        createdBy: true,
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return club;
  }

  /**
   * Only the approved club manager can edit club content.
   * Supervisor/admin moderation happens through updateStatus().
   */
  async update(
    clubId: string,
    dto: UpdateClubDto,
    requesterId: string,
  ): Promise<Club> {
    await this.assertManager(clubId, requesterId);

    const club = await this.findOne(clubId);

    Object.assign(club, dto);

    return this.clubsRepo.save(club);
  }

  /**
   * Called only by Supervisor/Admin through the controller guard.
   */
  async updateStatus(
    clubId: string,
    status: ClubStatus,
  ): Promise<Club> {
    const club = await this.findOne(clubId);

    club.status = status;

    return this.clubsRepo.save(club);
  }

  /**
   * Student submits a request. They are NOT immediately a club member.
   */
  async requestToJoin(
    clubId: string,
    userId: string,
  ): Promise<ClubMembership> {
    const club = await this.findOne(clubId);

    if (club.status !== ClubStatus.APPROVED) {
      throw new ConflictException(
        'You can only request to join an approved club',
      );
    }

    const existing = await this.membershipsRepo.findOne({
      where: {
        club: { id: clubId },
        user: { id: userId },
      },
    });

    if (existing?.status === MembershipStatus.APPROVED) {
      throw new ConflictException(
        'You are already an approved member of this club',
      );
    }

    if (existing?.status === MembershipStatus.PENDING) {
      throw new ConflictException(
        'Your membership request is already pending manager approval',
      );
    }

    // Rejected user is allowed to send a new request.
    if (existing?.status === MembershipStatus.REJECTED) {
      existing.status = MembershipStatus.PENDING;
      existing.role = ClubMemberRole.MEMBER;

      return this.membershipsRepo.save(existing);
    }

    return this.membershipsRepo.save(
      this.membershipsRepo.create({
        club: { id: clubId } as Club,
        user: { id: userId } as User,
        role: ClubMemberRole.MEMBER,
        status: MembershipStatus.PENDING,
      }),
    );
  }

  /**
   * An approved member can leave.
   * A pending request can be cancelled.
   * A manager cannot leave while still manager.
   */
  async leaveClub(
    clubId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.membershipsRepo.findOne({
      where: {
        club: { id: clubId },
        user: { id: userId },
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'You do not have a membership or join request in this club',
      );
    }

    // Student can cancel a pending request.
    if (membership.status === MembershipStatus.PENDING) {
      await this.membershipsRepo.remove(membership);
      return;
    }

    // A rejected record can be deleted before requesting again.
    if (membership.status === MembershipStatus.REJECTED) {
      await this.membershipsRepo.remove(membership);
      return;
    }

    if (membership.role === ClubMemberRole.MANAGER) {
      throw new ConflictException(
        'Club manager cannot leave. Assign another approved manager first.',
      );
    }

    await this.membershipsRepo.remove(membership);
  }

  /**
   * Public accepted-member list.
   * Pending requests are intentionally hidden here.
   */
  async getMembers(
    clubId: string,
  ): Promise<ClubMembership[]> {
    await this.findOne(clubId);

    return this.membershipsRepo.find({
      where: {
        club: { id: clubId },
        status: MembershipStatus.APPROVED,
      },
      relations: {
        user: true,
      },
      order: {
        joinedAt: 'ASC',
      },
    });
  }

  /**
   * Only the approved club manager sees join requests.
   */
  async getPendingJoinRequests(
    clubId: string,
    requesterId: string,
  ): Promise<ClubMembership[]> {
    await this.assertManager(clubId, requesterId);

    return this.membershipsRepo.find({
      where: {
        club: { id: clubId },
        status: MembershipStatus.PENDING,
      },
      relations: {
        user: true,
      },
      order: {
        joinedAt: 'ASC',
      },
    });
  }

  /**
   * Club manager accepts/rejects a pending request.
   */
  async decideMembershipRequest(
    clubId: string,
    requestId: string,
    decision:
      | MembershipStatus.APPROVED
      | MembershipStatus.REJECTED,
    requesterId: string,
  ): Promise<ClubMembership> {
    await this.assertManager(clubId, requesterId);

    const request = await this.membershipsRepo.findOne({
      where: {
        id: requestId,
        club: { id: clubId },
        status: MembershipStatus.PENDING,
      },
      relations: {
        user: true,
        club: true,
      },
    });

    if (!request) {
      throw new NotFoundException(
        'Pending membership request not found',
      );
    }

    request.status = decision;

    return this.membershipsRepo.save(request);
  }

  /**
   * Only the approved club manager can assign local club roles.
   *
   * Note:
   * One ClubMembership currently has ONE role.
   * A user can be manager in Club A and treasurer in Club B.
   *
   * If you truly need multiple simultaneous roles in one club,
   * create a separate ClubMembershipRole entity later.
   */
  async updateMemberRole(
    clubId: string,
    memberUserId: string,
    newRole: ClubMemberRole,
    requesterId: string,
  ): Promise<ClubMembership> {
    await this.assertManager(clubId, requesterId);

    const membership = await this.membershipsRepo.findOne({
      where: {
        club: { id: clubId },
        user: { id: memberUserId },
        status: MembershipStatus.APPROVED,
      },
      relations: {
        user: true,
        club: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Approved club membership not found',
      );
    }

    // Prevent the last manager from removing their own manager role.
    if (
      membership.role === ClubMemberRole.MANAGER &&
      newRole !== ClubMemberRole.MANAGER
    ) {
      const managerCount = await this.membershipsRepo.count({
        where: {
          club: { id: clubId },
          role: ClubMemberRole.MANAGER,
          status: MembershipStatus.APPROVED,
        },
      });

      if (managerCount <= 1) {
        throw new ConflictException(
          'This club must always have at least one approved manager',
        );
      }
    }

    membership.role = newRole;

    return this.membershipsRepo.save(membership);
  }

  async getMyMembership(
    clubId: string,
    userId: string,
  ): Promise<ClubMembership | null> {
    return this.membershipsRepo.findOne({
      where: {
        club: { id: clubId },
        user: { id: userId },
      },
      relations: {
        club: true,
      },
    });
  }

  /**
   * Strict local permission:
   * Only an APPROVED MANAGER can handle join requests
   * or assign club roles.
   */
  async assertManager(
    clubId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.membershipsRepo.findOne({
      where: {
        club: { id: clubId },
        user: { id: userId },
        role: ClubMemberRole.MANAGER,
        status: MembershipStatus.APPROVED,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only the approved manager of this club can perform this action',
      );
    }
  }

  /**
   * Kept because EventsService may already use this method.
   * It is for event management only.
   *
   * Do NOT use it for join-request decisions or local-role assignment.
   */
  async assertManagerOrAdmin(
    clubId: string,
    userId: string,
    globalRole: UserRole,
  ): Promise<void> {
    if (globalRole === UserRole.ADMIN) {
      return;
    }

    await this.assertManager(clubId, userId);
  }

  /**
   * Only approved members can create a club post.
   * Pending join requests cannot create club posts.
   */
  async assertMember(
    clubId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.membershipsRepo.findOne({
      where: {
        club: { id: clubId },
        user: { id: userId },
        status: MembershipStatus.APPROVED,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be an approved member of this club to perform this action',
      );
    }
  }
}