import { api } from './api';
import type { User } from '@/types';

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
}

export interface RegisterVerificationResponse {
  message: string;
  expiresInMinutes: number;
}

export interface VerifyRegistrationPayload {
  email: string;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
}

export async function requestRegistrationCode(payload: RegisterPayload): Promise<RegisterVerificationResponse> {
  const { data } = await api.post<RegisterVerificationResponse>('/auth/register', payload, {
    timeout: 25_000,
  });
  return data;
}

export async function verifyRegistrationCode(payload: VerifyRegistrationPayload): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/register/verify', payload);
  return data.user;
}

export async function loginRequest(payload: LoginPayload): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/login', payload);
  return data.user;
}

export async function forgotPasswordRequest(payload: ForgotPasswordPayload): Promise<string> {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', payload);
  return data.message;
}

export async function resetPasswordRequest(payload: ResetPasswordPayload): Promise<void> {
  await api.post('/auth/reset-password', payload);
}
