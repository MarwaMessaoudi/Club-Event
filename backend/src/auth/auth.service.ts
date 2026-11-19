import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashToken, tokenMatches } from './strategies/token-hash.util';
import { UserStatus } from '../users/entities/user-status.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      status: UserStatus.ACTIVE,

    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    // Same error message for both cases → don't leak which emails exist
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

     if (user.status === UserStatus.SUSPENDED) {
    throw new UnauthorizedException('Account suspended. Contact administration.');
  }
    return this.buildAuthResponse(user);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    if (!tokenMatches(refreshToken, user.hashedRefreshToken)) {
      // Valid signature but not the latest token → an old token is being
      // replayed. Kill the whole session so the thief and the user must re-login.
      await this.usersService.setRefreshToken(user.id, null);
      throw new UnauthorizedException('Access denied');
    }

    // Rotation: a new refresh token is issued and its hash replaces the old one
    return this.buildAuthResponse(user);
  }

  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
  }

  // ---- private helpers ----

  private async buildAuthResponse(user: User) {
    const tokens = await this.generateTokens(user);

    // SHA-256 of the FULL token (bcrypt would only read the first 72 bytes)
    await this.usersService.setRefreshToken(
      user.id,
      hashToken(tokens.refreshToken),
    );

    // Strip secrets before returning the user
    const {
      password: _password,
      hashedRefreshToken: _hashedRefreshToken,
      ...safeUser
    } = user;
    void _password;
    void _hashedRefreshToken;

    return { user: safeUser, ...tokens };
  }

  private generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
        jwtid: randomUUID(), // makes every refresh token unique
      }),
    ]).then(([accessToken, refreshToken]) => ({ accessToken, refreshToken }));
  }
}