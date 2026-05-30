import argon2 from 'argon2';

// Băm mật khẩu bằng argon2id (có salt tự động). KHÔNG bao giờ lưu mật khẩu thường.
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

// So khớp mật khẩu người dùng nhập với chuỗi băm đã lưu.
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
