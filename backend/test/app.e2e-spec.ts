import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('UniVibe API (e2e)', () => {
  let app: INestApplication;
  const randomEmail = `test-${Date.now()}@tekup.tn`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('/api/auth/register -> 201', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/register').send({ email: randomEmail, password: 'Passw0rd!', firstName: 'Test', lastName: 'User' }).expect(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('/api/auth/me without token -> 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('/api/clubs returns data+meta', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: randomEmail, password: 'Passw0rd!' }).expect(200);
    const token = login.body.accessToken;
    const res = await request(app.getHttpServer()).get('/api/clubs?status=pending').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
  });
});