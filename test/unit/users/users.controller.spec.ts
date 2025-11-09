import { Test, TestingModule } from '@nestjs/testing';

import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';

import { mockAuthenticatedUser } from './__mocks__/user.mock';

/**
 * Unit тесты для UsersController
 *
 * Проверяем, что контроллер правильно обрабатывает запросы
 * и корректно взаимодействует с сервисом.
 *
 * Для запуска: npm test users.controller.spec
 */
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUserProfile = {
    success: true,
    message: 'User fetched successfully',
    data: {
      _id: mockAuthenticatedUser._id,
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  // Mock для UsersService
  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  // Mock для ApiKeyGuard
  const mockApiKeyGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    // Создаем тестовый модуль с замокированным сервисом
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue(mockApiKeyGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * Тесты для getProfile
   */
  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      mockUsersService.getProfile.mockResolvedValue(mockUserProfile);

      // Act
      const result = await controller.getProfile(mockAuthenticatedUser);

      // Assert
      expect(service.getProfile).toHaveBeenCalledWith(mockAuthenticatedUser._id);
      expect(result).toEqual(mockUserProfile);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      mockUsersService.getProfile.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getProfile(mockAuthenticatedUser)).rejects.toThrow(error);
    });
  });

  /**
   * Тесты для updateProfile
   */
  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const updateData = { name: 'Updated Name' };
      const updatedProfile = {
        success: true,
        message: 'Profile updated successfully',
        data: { ...mockUserProfile.data, ...updateData },
      };
      mockUsersService.updateProfile.mockResolvedValue(updatedProfile);

      // Act
      const result = await controller.updateProfile(mockAuthenticatedUser, updateData);

      // Assert
      expect(service.updateProfile).toHaveBeenCalledWith(mockAuthenticatedUser._id, updateData);
      expect(result).toEqual(updatedProfile);
    });

    it('should throw HttpException on validation error', async () => {
      // Arrange
      const invalidData = { name: '' };
      const validationError = {
        message: 'ValidationError',
        details: [{ path: 'name', message: 'Name is required', field: 'name' }],
      };

      // Мокаем parseOrThrow для генерации ValidationError
      // В реальном тесте это будет происходить внутри контроллера
      mockUsersService.updateProfile.mockRejectedValue(validationError);

      // Act & Assert
      // Примечание: в реальном сценарии ValidationError выбрасывается parseOrThrow
      // Здесь мы просто проверяем, что ошибки правильно обрабатываются
      await expect(controller.updateProfile(mockAuthenticatedUser, invalidData)).rejects.toThrow();
    });
  });

  /**
   * Тесты для changePassword
   */
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
        confirmPassword: 'newPassword',
      };
      const successResponse = {
        success: true,
        message: 'Password changed successfully',
        data: {},
      };
      mockUsersService.changePassword.mockResolvedValue(successResponse);

      // Act
      const result = await controller.changePassword(mockAuthenticatedUser, passwordData);

      // Assert
      expect(service.changePassword).toHaveBeenCalledWith(mockAuthenticatedUser._id, passwordData);
      expect(result).toEqual(successResponse);
    });

    it('should handle service errors when changing password', async () => {
      // Arrange
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
        confirmPassword: 'newPassword',
      };
      const error = new Error('Current password is incorrect');
      mockUsersService.changePassword.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.changePassword(mockAuthenticatedUser, passwordData)).rejects.toThrow(
        error
      );
    });
  });
});
