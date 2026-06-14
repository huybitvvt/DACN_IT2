import { api } from './api';
import type { Course } from '@/types';

export interface CourseCheckout {
  course: Pick<Course, 'id' | 'slug' | 'title' | 'priceVnd'>;
  purchase: {
    id: string;
    status: 'PENDING' | 'PAID';
    amountVnd: number;
    paymentCode: string;
  };
  qrUrl: string;
  bank: {
    bankId: string;
    accountNo: string;
    accountName: string;
  };
}

export async function createCourseCheckout(slug: string): Promise<CourseCheckout> {
  const { data } = await api.post<{ checkout: CourseCheckout }>(`/courses/${slug}/checkout`);
  return data.checkout;
}

export async function getCourseCheckoutStatus(slug: string): Promise<CourseCheckout['purchase']> {
  const { data } = await api.get<{ purchase: CourseCheckout['purchase'] }>(`/courses/${slug}/checkout/status`);
  return data.purchase;
}
