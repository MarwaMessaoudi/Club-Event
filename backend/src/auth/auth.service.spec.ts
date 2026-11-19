import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByIdWithRefreshToken: jest.fn(),
      create: jest.fn().mockImplementation((d) => Promise.resolve({ id: '1', ...d, role: 'student', status: 'active' })),
      setRefreshToken: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('mock.jwt') } },
        { provide: ConfigService, useValue: { get: () => 'test', getOrThrow: () => 'test' } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('register -> 409 if email exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: '1' });
    await expect(service.register({ email: 'a@tekup.tn', password: 'Passw0rd!', firstName: 'A', lastName: 'B' } as any)).rejects.toThrow(ConflictException);
  });

  it('login -> 401 if wrong password', async () => {
    const hash = await bcrypt.hash('Passw0rd!', 10);
    usersService.findByEmailWithPassword.mockResolvedValue({ id: '1', email: 'a@tekup.tn', password: hash, role: 'student', status: 'active' });
    await expect(service.login({ email: 'a@tekup.tn', password: 'Wrong1!' } as any)).rejects.toThrow(UnauthorizedException);
  });

  it('login -> 401 if suspended', async () => {
    const hash = await bcrypt.hash('Passw0rd!', 10);
    usersService.findByEmailWithPassword.mockResolvedValue({ id: '1', email: 'a@tekup.tn', password: hash, role: 'student', status: 'suspended' });
    await expect(service.login({ email: 'a@tekup.tn', password: 'Passw0rd!' } as any)).rejects.toThrow(UnauthorizedException);
  });
});