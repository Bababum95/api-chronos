# Testing Guide - API Chronos

Руководство по тестированию NestJS API приложения.

## Содержание

- [Обзор](#обзор)
- [Типы тестов](#типы-тестов)
- [Запуск тестов](#запуск-тестов)
- [Структура тестов](#структура-тестов)
- [Примеры](#примеры)
- [Best Practices](#best-practices)

## Обзор

В проекте настроены три типа тестов:

- **Unit тесты** - тестирование отдельных методов и функций в изоляции
- **Integration тесты** - тестирование взаимодействия нескольких компонентов
- **E2E тесты** - тестирование всего приложения через HTTP запросы

Используемые инструменты:

- Jest - тестовый фреймворк
- SuperTest - тестирование HTTP запросов
- @nestjs/testing - утилиты для тестирования NestJS приложений
- mongodb-memory-server - in-memory MongoDB для integration тестов

## Типы тестов

### Unit тесты

**Назначение:** Тестирование отдельных классов (services, controllers) в изоляции.

**Расположение:** Рядом с тестируемым файлом (например, `users.service.spec.ts`)

**Пример:**

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: getModelToken(User.name), useValue: mockUserModel }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should return user profile', async () => {
    // Arrange, Act, Assert
  });
});
```

### Integration тесты

**Назначение:** Тестирование взаимодействия компонентов с реальной (in-memory) базой данных.

**Расположение:** `test/integration/`

**Особенности:**

- Используют MongoMemoryServer для создания временной БД
- Тестируют реальную работу с базой данных
- Медленнее unit тестов

### E2E тесты

**Назначение:** Тестирование всего приложения через HTTP API.

**Расположение:** `test/`

**Особенности:**

- Запускают полное приложение
- Делают реальные HTTP запросы
- Проверяют работу всех слоев приложения

## Запуск тестов

### Все тесты

```bash
npm test
```

### Unit и Integration тесты с watch mode

```bash
npm run test:watch
```

### Тесты с coverage

```bash
npm run test:cov
```

Результаты coverage сохраняются в папке `coverage/`

### E2E тесты

```bash
npm run test:e2e
```

### Отладка тестов

```bash
npm run test:debug
```

Затем подключите отладчик к процессу на порту 9229.

## Структура тестов

```
api-chronos/
├── src/
│   └── modules/
│       └── users/
│           ├── users.service.ts
│           ├── users.service.spec.ts        # Unit тесты
│           ├── users.controller.ts
│           └── users.controller.spec.ts     # Unit тесты
└── test/
    ├── jest-e2e.json                        # Конфигурация E2E
    ├── app.e2e-spec.ts                      # E2E тесты
    └── integration/
        └── users.integration.spec.ts        # Integration тесты
```

## Примеры

### Unit тест сервиса

```typescript
describe('UsersService', () => {
  it('should throw NotFoundException when user not found', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundException);
  });
});
```

### Unit тест контроллера

```typescript
describe('UsersController', () => {
  it('should return user profile', async () => {
    const mockProfile = { _id: '123', name: 'Test' };
    mockUsersService.getProfile.mockResolvedValue(mockProfile);

    const result = await controller.getProfile(mockUser);

    expect(result).toEqual(mockProfile);
    expect(service.getProfile).toHaveBeenCalledWith(mockUser._id);
  });
});
```

### E2E тест

```typescript
describe('AppController (e2e)', () => {
  it('/ping (GET)', () => {
    return request(app.getHttpServer())
      .get('/ping')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
      });
  });
});
```

### Integration тест

```typescript
describe('UsersService Integration', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersService],
    }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongoServer.stop();
  });
});
```

## Best Practices

### 1. Структура теста (AAA Pattern)

```typescript
it('should do something', () => {
  // Arrange - подготовка данных и моков
  const mockData = { ... };
  mockService.method.mockResolvedValue(mockData);

  // Act - выполнение тестируемого действия
  const result = await service.method();

  // Assert - проверка результатов
  expect(result).toEqual(expected);
});
```

### 2. Именование тестов

- Используйте описательные названия: `should return user when valid id provided`
- Начинайте с `should`
- Описывайте ожидаемое поведение, а не реализацию

### 3. Изоляция тестов

- Каждый тест должен быть независимым
- Используйте `beforeEach` для настройки
- Используйте `afterEach` для очистки
- Не зависьте от порядка выполнения тестов

### 4. Моки

- Мокируйте внешние зависимости (БД, API)
- Используйте `jest.clearAllMocks()` в `afterEach`
- Проверяйте вызовы моков с `toHaveBeenCalledWith()`

### 5. Coverage

Стремитесь к покрытию:

- **Services:** 80%+ (бизнес-логика критична)
- **Controllers:** 70%+ (проверка обработки запросов)
- **Utils:** 90%+ (чистые функции легко тестировать)

### 6. Что не нужно тестировать

- Код фреймворков (NestJS, Express)
- Внешние библиотеки
- Тривиальные геттеры/сеттеры
- Конфигурационные файлы

## Troubleshooting

### Проблема: Тесты не находят модули с алиасом `@/`

**Решение:** Убедитесь, что `moduleNameMapper` в `jest.config.js` настроен правильно:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Проблема: Ошибки с MongoDB в integration тестах

**Решение:** Убедитесь, что установлен `mongodb-memory-server`:

```bash
npm install -D mongodb-memory-server
```

### Проблема: Таймауты в E2E тестах

**Решение:** Увеличьте таймаут в `jest-e2e.json`:

```json
{
  "testTimeout": 30000
}
```

## Дополнительные ресурсы

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [SuperTest](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
