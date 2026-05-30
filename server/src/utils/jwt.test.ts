import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from './jwt.js';

describe('JWT', () => {
  it('ký và giải mã token giữ nguyên payload', () => {
    const token = signToken({ sub: 'user-1', role: 'LEARNER' });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.role).toBe('LEARNER');
  });

  it('ném lỗi với token không hợp lệ', () => {
    expect(() => verifyToken('token.bia.dat')).toThrow();
  });
});
