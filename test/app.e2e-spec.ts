import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '@/app.module';

/**
 * E2E тесты для основных эндпоинтов приложения
 *
 * E2E тесты проверяют работу всего приложения от начала до конца,
 * включая все модули, контроллеры, сервисы и взаимодействие с БД.
 *
 * Для запуска: npm run test:e2e
 */
describe('AppController (e2e)', () => {
  let app: INestApplication;

  // Настройка: создаем тестовое приложение перед всеми тестами
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Очистка: закрываем приложение после всех тестов
  afterAll(async () => {
    await app.close();
  });

  /**
   * Тест проверки health endpoint
   * Убеждаемся, что сервер отвечает и возвращает корректный статус
   */
  it('/ping (GET)', () => {
    return request(app.getHttpServer())
      .get('/ping')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.message).toBe('string');
      });
  });

  /**
   * Пример теста для несуществующего роута
   * Проверяем, что приложение корректно обрабатывает 404 ошибки
   */
  it('/non-existent-route (GET) should return 404', () => {
    return request(app.getHttpServer()).get('/non-existent-route').expect(404);
  });
});
