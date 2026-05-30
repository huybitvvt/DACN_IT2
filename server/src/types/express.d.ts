import type { JwtPayload } from '../utils/jwt.js';

// Mở rộng kiểu Request của Express để mang thông tin người dùng đã xác thực.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
