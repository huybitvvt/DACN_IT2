import { api } from './api';
import type { User } from '@/types';

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerRequest(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/register', payload);
  return data.user;
}

export async function loginRequest(payload: LoginPayload): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/login', payload);
  return data.user;
}
