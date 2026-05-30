import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('băm mật khẩu ra chuỗi khác với bản gốc', async () => {
    const hash = await hashPassword('matkhau123');
    expect(hash).not.toBe('matkhau123');
    expect(hash.startsWith('$argon2')).toBe(true);
  });

  it('xác minh đúng mật khẩu chính xác', async () => {
    const hash = await hashPassword('matkhau123');
    expect(await verifyPassword(hash, 'matkhau123')).toBe(true);
  });

  it('từ chối mật khẩu sai', async () => {
    const hash = await hashPassword('matkhau123');
    expect(await verifyPassword(hash, 'saimatkhau')).toBe(false);
  });

  it('không ném lỗi khi hash không hợp lệ, trả về false', async () => {
    expect(await verifyPassword('khong-phai-hash', 'bat-ky')).toBe(false);
  });
});
