import { z } from 'zod';

// Schema validation cho đăng ký. Mật khẩu tối thiểu 8 ký tự (Yêu cầu 1.7).
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự.')
    .max(60, 'Tên hiển thị quá dài.'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự.').max(128),
});

export const verifyRegistrationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Mã xác thực gồm 6 chữ số.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyRegistrationInput = z.infer<typeof verifyRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
