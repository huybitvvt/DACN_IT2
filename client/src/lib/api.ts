import axios, { AxiosError } from 'axios';

// Client gọi API dùng chung.
// - Mặc định baseURL '/api' (dev dùng Vite proxy; production dùng chung domain
//   khi Express phục vụ luôn frontend).
// - Nếu deploy tách domain, đặt biến VITE_API_URL=https://api-cua-ban.com/api
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true, // gửi kèm cookie phiên (JWT HttpOnly)
  headers: { 'Content-Type': 'application/json' },
});

// Cấu trúc lỗi chuẩn từ backend.
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Trích thông điệp lỗi thân thiện từ một lỗi bất kỳ.
export function getErrorMessage(err: unknown, fallback = 'Đã có lỗi xảy ra.'): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorBody>;
    return axiosErr.response?.data?.error?.message ?? axiosErr.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
