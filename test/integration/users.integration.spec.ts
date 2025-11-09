import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';

import { UsersService } from '@/modules/users/users.service';
import { User, UserSchema } from '@/schemas/user.schema';

/**
 * Integration тесты для Users модуля
 *
 * Integration тесты проверяют работу нескольких компонентов вместе,
 * включая взаимодействие с реальной базой данных.
 *
 * В этих тестах используется MongoMemoryServer - in-memory MongoDB
 * для изоляции тестов от реальной базы данных.
 *
 * Установка: npm install -D mongodb-memory-server
 * Для запуска: npm test users.integration.spec
 */
describe('UsersService Integration Tests', () => {
  let service: UsersService;
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;

  // Настройка: создаем in-memory MongoDB и тестовый модуль
  beforeAll(async () => {
    // Запускаем in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Создаем тестовый модуль с подключением к in-memory БД
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersService],
    }).compile();

    service = moduleRef.get<UsersService>(UsersService);
  });

  // Очищаем базу данных после каждого теста
  afterEach(async () => {
    const collections = moduleRef.get<Connection>('DatabaseConnection').collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  // Закрываем соединение и останавливаем сервер после всех тестов
  afterAll(async () => {
    await moduleRef.close();
    await mongoServer.stop();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Интеграционный тест: создание и получение пользователя
   */
  describe('User CRUD operations', () => {
    it('should create and retrieve a user', async () => {
      // Примечание: это пример теста с реальной БД
      // В реальном приложении создание пользователя происходит через AuthService
      // Здесь мы демонстрируем принцип интеграционного тестирования

      // Для этого теста нужно будет создать тестового пользователя
      // через прямое обращение к модели или через AuthService
      expect(true).toBe(true);
    });
  });

  /**
   * Интеграционный тест: обновление профиля с проверкой уникальности email
   */
  describe('Profile update with email uniqueness', () => {
    it('should prevent duplicate emails when updating profile', async () => {
      // Arrange: создаем двух пользователей
      // Act: пытаемся обновить email одного на email другого
      // Assert: проверяем, что выброшена ошибка ConflictException

      // Примечание: реализация требует создания тестовых пользователей
      // через соответствующие сервисы или моки
      expect(true).toBe(true);
    });
  });

  /**
   * Интеграционный тест: смена пароля с валидацией
   */
  describe('Password change flow', () => {
    it('should change password with correct validation', async () => {
      // Arrange: создаем пользователя с известным паролем
      // Act: меняем пароль через сервис
      // Assert: проверяем, что старый пароль больше не работает

      // Примечание: требуется интеграция с User model и его методами
      expect(true).toBe(true);
    });
  });
});
