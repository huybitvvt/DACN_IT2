import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock module prisma trước khi import service.
vi.mock('../../db/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../../db/prisma.js';
import { registerUser, authenticate, toPublicUser } from './auth.service.js';
import { hashPassword } from '../../utils/password.js';
import { AppError } from '../../utils/AppError.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedPrisma = prisma as any;

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    email: 'a@b.com',
    displayName: 'Người Học',
    passwordHash: 'hash',
    role: 'LEARNER',
    streakCount: 0,
    lastActiveDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toPublicUser', () => {
    it('không để lộ passwordHash', () => {
      const pub = toPublicUser(fakeUser() as never);
      expect(pub).not.toHaveProperty('passwordHash');
      expect(pub.email).toBe('a@b.com');
    });
  });

  describe('registerUser', () => {
    it('từ chối khi email đã tồn tại', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(fakeUser());
      await expect(
        registerUser({ email: 'a@b.com', displayName: 'X', password: 'matkhau123' }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it('tạo người dùng mới khi email chưa tồn tại', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockImplementation(async ({ data }: never) =>
        fakeUser(data as Record<string, unknown>),
      );

      const result = await registerUser({
        email: 'new@b.com',
        displayName: 'Mới',
        password: 'matkhau123',
      });

      expect(result.email).toBe('new@b.com');
      // passwordHash truyền vào create phải là chuỗi băm, không phải mật khẩu thường.
      const createArg = mockedPrisma.user.create.mock.calls[0][0];
      expect(createArg.data.passwordHash).not.toBe('matkhau123');
      expect(createArg.data.passwordHash.startsWith('$argon2')).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('ném 401 khi không tìm thấy user', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        authenticate({ email: 'no@b.com', password: 'matkhau123' }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it('ném 401 khi sai mật khẩu', async () => {
      const hash = await hashPassword('dungmatkhau');
      mockedPrisma.user.findUnique.mockResolvedValue(fakeUser({ passwordHash: hash }));
      await expect(
        authenticate({ email: 'a@b.com', password: 'saimatkhau' }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it('thành công khi đúng mật khẩu', async () => {
      const hash = await hashPassword('dungmatkhau');
      mockedPrisma.user.findUnique.mockResolvedValue(fakeUser({ passwordHash: hash }));
      const user = await authenticate({ email: 'a@b.com', password: 'dungmatkhau' });
      expect(user.email).toBe('a@b.com');
    });
  });
});
