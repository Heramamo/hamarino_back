import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health renvoie ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /article sans token renvoie 401', () => {
    return request(app.getHttpServer()).get('/article').expect(401);
  });

  it('POST /auth/login avec un body invalide renvoie 400', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(400);
  });

  it('PATCH /admin/validate sans token renvoie 401', () => {
    return request(app.getHttpServer()).patch('/admin/validate').send({}).expect(401);
  });

  it('GET /user/1/proofs sans token renvoie 401', () => {
    return request(app.getHttpServer()).get('/user/1/proofs').expect(401);
  });
});
