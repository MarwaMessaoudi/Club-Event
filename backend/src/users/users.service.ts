import { ConflictException, Injectable, NotFoundException,UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Paginated, paginate } from '../common/interfaces/paginated';
import { UserQueryDto } from './dto/user-query.dto';
import { UserStatus } from './entities/user-status.enum';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  create(data: Partial<User>): Promise<User> {
    return this.usersRepo.save(this.usersRepo.create(data));
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  // Explicitly re-add the hidden password column (only place we do this)
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.hashedRefreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async setRefreshToken(id: string, hashedRefreshToken: string | null) {
    await this.usersRepo.update(id, { hashedRefreshToken });
  }


async findAll(query: UserQueryDto): Promise<Paginated<User>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const qb = this.usersRepo
    .createQueryBuilder('user')
    .orderBy('user.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  if (query.role) {
    qb.andWhere('user.role = :role', { role: query.role });
  }

  if (query.status) {
    qb.andWhere('user.status = :status', { status: query.status });
  }

  if (query.search) {
    qb.andWhere(
      '(user.email ILIKE :q OR user.firstName ILIKE :q OR user.lastName ILIKE :q)',
      { q: `%${query.search}%` },
    );
  }

  const [data, total] = await qb.getManyAndCount();

  return paginate(data, total, page, limit);
}

async updateRole(
  id: string,
  newRole: UserRole,
  requesterId: string,
): Promise<User> {
  const user = await this.usersRepo.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Prevent admin from demoting themselves
  if (id === requesterId) {
    throw new ConflictException('Cannot change your own role');
  }

  user.role = newRole;
  return this.usersRepo.save(user);
}

async updateStatus(
  id: string,
  newStatus: UserStatus,
  requesterId: string,
): Promise<User> {
  const user = await this.usersRepo.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Prevent admin from suspending themselves
  if (id === requesterId) {
    throw new ConflictException('Cannot change your own status');
  }

  user.status = newStatus;
  return this.usersRepo.save(user);
}

async findOne(id: string): Promise<User> {
  const user = await this.usersRepo.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}



findByIdWithPassword(id: string) {
  return this.usersRepo.createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.id = :id', { id })
    .getOne();
}

async updateProfile(id: string, dto: any) {
  const user = await this.usersRepo.findOne({ where: { id } });
  if (!user) throw new NotFoundException('User not found');
  if (dto.email && dto.email !== user.email) {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');
  }
  Object.assign(user, dto);
  return this.usersRepo.save(user);
}

async changePassword(id: string, currentPassword: string, newPassword: string) {
  const user = await this.findByIdWithPassword(id);
  if (!user) throw new NotFoundException('User not found');
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new UnauthorizedException('Current password is incorrect');
  user.password = await bcrypt.hash(newPassword, 12);
  await this.usersRepo.save(user);
}
  
}