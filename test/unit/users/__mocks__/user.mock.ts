import { AuthenticatedUser } from '@/common/types/authenticated-user';

export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedPassword123',
  save: jest.fn(),
  comparePassword: jest.fn(),
};

export const mockAuthenticatedUser: AuthenticatedUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  apiKey: 'test-api-key',
};
