import { api } from './api';

export interface Certificate {
  learnerName: string;
  courseTitle: string;
  issuedAt: string;
  code: string;
}

export async function fetchCertificate(slug: string): Promise<Certificate> {
  const { data } = await api.get<Certificate>(`/certificate/${slug}`);
  return data;
}
