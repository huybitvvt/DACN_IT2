import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// Mock module prisma trước khi import service.
vi.mock('../../db/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    registrationVerification: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../services/email.js', () => ({
  sendRegistrationVerificationEmail: vi.fn(),
}));

import { prisma } from '../../db/prisma.js';
import {
  authenticate,
  registerUser,
  requestRegistrationCode,
  toPublicUser,
  verifyRegistrationCode,
} from './auth.service.js';
import { hashPassword } from '../../utils/password.js';
import { AppError } from '../../utils/AppError.js';
import { sendRegistrationVerificationEmail } from '../../services/email.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedPrisma = prisma as any;
const mockedSendEmail = vi.mocked(sendRegistrationVerificationEmail);

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

function hashRegistrationToken(email: string, token: string) {
  return createHash('sha256').update(`${email}:${token}`).digest('hex');
}

function extractToken(verifyUrl: string) {
  return new URL(verifyUrl).searchParams.get('token') ?? '';
}

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) =>
      callback(mockedPrisma),
    );
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

  describe('requestRegistrationCode', () => {
    it('lưu token dạng hash và gửi link xác thực', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.registrationVerification.upsert.mockResolvedValue({});

      const result = await requestRegistrationCode({
        email: 'new@b.com',
        displayName: 'Mới',
        password: 'matkhau123',
      });

      expect(result.expiresInMinutes).toBe(30);
      expect(mockedPrisma.registrationVerification.upsert).toHaveBeenCalledOnce();
      expect(mockedSendEmail).toHaveBeenCalledOnce();

      const verifyUrl = mockedSendEmail.mock.calls[0][0].verifyUrl;
      const sentToken = extractToken(verifyUrl);
      expect(sentToken.length).toBeGreaterThanOrEqual(32);

      const upsertArg = mockedPrisma.registrationVerification.upsert.mock.calls[0][0];
      expect(upsertArg.create.codeHash).toBe(hashRegistrationToken('new@b.com', sentToken));
      expect(upsertArg.create.codeHash).not.toBe(sentToken);
      expect(upsertArg.create.passwordHash).not.toBe('matkhau123');
    });
  });

  describe('verifyRegistrationCode', () => {
    it('tạo user và xoá mã chờ khi token đúng', async () => {
      const token = 'abcdefghijklmnopqrstuvwxyz1234567890';
      const pending = {
        id: 'v1',
        email: 'new@b.com',
        displayName: 'Mới',
        passwordHash: 'hash123',
        codeHash: hashRegistrationToken('new@b.com', token),
        attempts: 0,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockedPrisma.registrationVerification.findUnique.mockResolvedValue(pending);
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockImplementation(async ({ data }: never) =>
        fakeUser(data as Record<string, unknown>),
      );
      mockedPrisma.registrationVerification.delete.mockResolvedValue(pending);

      const user = await verifyRegistrationCode({ email: 'new@b.com', token });

      expect(user.email).toBe('new@b.com');
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@b.com',
          displayName: 'Mới',
          passwordHash: 'hash123',
        },
      });
      expect(mockedPrisma.registrationVerification.delete).toHaveBeenCalledWith({
        where: { email: 'new@b.com' },
      });
    });

    it('từ chối khi token sai', async () => {
      mockedPrisma.registrationVerification.findUnique.mockResolvedValue({
        id: 'v1',
        email: 'new@b.com',
        displayName: 'Mới',
        passwordHash: 'hash123',
        codeHash: hashRegistrationToken('new@b.com', 'abcdefghijklmnopqrstuvwxyz1234567890'),
        attempts: 0,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        verifyRegistrationCode({ email: 'new@b.com', token: 'wrong-token-abcdefghijklmnopqrstuvwxyz' }),
      ).rejects.toBeInstanceOf(AppError);

      expect(mockedPrisma.registrationVerification.update).not.toHaveBeenCalled();
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
