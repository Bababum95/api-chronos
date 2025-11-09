import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';

import { User, UserDocument } from '@/schemas/user.schema';

import { UsersService } from './users.service';

/**
 * Unit тесты для UsersService
 *
 * Unit тесты проверяют работу отдельных методов класса в изоляции.
 * Все зависимости (например, база данных) мокируются.
 *
 * Для запуска: npm test users.service.spec
 */
describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  // Mock данные для тестов
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    save: jest.fn(),
    comparePassword: jest.fn(),
  };

  // Mock для Mongoose Model
  const mockUserModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    // Создаем тестовый модуль с замокированной моделью
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterEach(() => {
    // Очищаем все моки после каждого теста
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Тесты для getProfile
   */
  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Arrange: настраиваем моки
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findById.mockReturnValue({ select: selectMock });

      // Act: вызываем тестируемый метод
      const result = await service.getProfile(mockUser._id);

      // Assert: проверяем результат
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result.success).toBe(true);
      expect(result.message).toBe('User fetched successfully');
      expect(result.data).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const selectMock = jest.fn().mockResolvedValue(null);
      mockUserModel.findById.mockReturnValue({ select: selectMock });

      // Act & Assert
      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * Тесты для updateProfile
   */
  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };
      const execMock = jest.fn().mockResolvedValue(updatedUser);

      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      // Act
      const result = await service.updateProfile(mockUser._id, updateData);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { name: updateData.name },
        { new: true, select: '-password' }
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const updateData = { email: 'existing@example.com' };
      mockUserModel.findById.mockResolvedValue({
        ...mockUser,
        email: 'test@example.com',
      });
      mockUserModel.findOne.mockResolvedValue({ email: updateData.email });

      // Act & Assert
      await expect(service.updateProfile(mockUser._id, updateData)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const updateData = { name: 'Updated Name' };
      const execMock = jest.fn().mockResolvedValue(null);

      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      // Act & Assert
      await expect(service.updateProfile('nonexistent', updateData)).rejects.toThrow(
        NotFoundException
      );
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
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest
          .fn()
          .mockResolvedValueOnce(true) // current password is correct
          .mockResolvedValueOnce(false), // new password is different
        save: jest.fn().mockResolvedValue(true),
      };

      const selectMock = jest.fn().mockResolvedValue(userWithPassword);
      mockUserModel.findById.mockReturnValue({ select: selectMock });

      // Act
      const result = await service.changePassword(mockUser._id, passwordData);

      // Assert
      expect(selectMock).toHaveBeenCalledWith('+password');
      expect(userWithPassword.comparePassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(userWithPassword.comparePassword).toHaveBeenCalledWith(passwordData.newPassword);
      expect(userWithPassword.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      // Arrange
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
        confirmPassword: 'newPassword',
      };
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      const selectMock = jest.fn().mockResolvedValue(userWithPassword);
      mockUserModel.findById.mockReturnValue({ select: selectMock });

      // Act & Assert
      await expect(service.changePassword(mockUser._id, passwordData)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when new password is same as current', async () => {
      // Arrange
      const passwordData = {
        currentPassword: 'password',
        newPassword: 'password',
        confirmPassword: 'password',
      };
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true), // both checks return true
      };

      const selectMock = jest.fn().mockResolvedValue(userWithPassword);
      mockUserModel.findById.mockReturnValue({ select: selectMock });

      // Act & Assert
      await expect(service.changePassword(mockUser._id, passwordData)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
