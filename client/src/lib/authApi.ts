import { api } from './api';
import type { User } from '@/types';

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
}

export interface RegisterCodeResponse {
  message: string;
  expiresInMinutes: number;
}

export interface VerifyRegistrationPayload {
  email: string;
  code: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function requestRegistrationCode(payload: RegisterPayload): Promise<RegisterCodeResponse> {
  const { data } = await api.post<RegisterCodeResponse>('/auth/register', payload, {
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
