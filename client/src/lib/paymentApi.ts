import { api } from './api';
import type { Course } from '@/types';

export type PurchaseStatus = 'PENDING' | 'PAID';

export interface CheckoutPurchase {
  id: string;
  status: PurchaseStatus;
  amountVnd: number;
  paymentCode: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  pendingExpiresAt: string | null;
  isExpired: boolean;
}

export interface CourseCheckout {
  course: Pick<Course, 'id' | 'slug' | 'title' | 'priceVnd'>;
  purchase: CheckoutPurchase;
  qrUrl: string;
  bank: {
    bankId: string;
    accountNo: string;
    accountName: string;
  };
  demoPaymentEnabled: boolean;
}

export interface PurchaseHistoryItem extends CheckoutPurchase {
  course: Pick<Course, 'id' | 'slug' | 'title' | 'language' | 'priceVnd'>;
}

export async function createCourseCheckout(slug: string): Promise<CourseCheckout> {
  const { data } = await api.post<{ checkout: CourseCheckout }>(`/courses/${slug}/checkout`);
  return data.checkout;
}

export async function getCourseCheckoutStatus(slug: string): Promise<CourseCheckout['purchase']> {
  const { data } = await api.get<{ purchase: CourseCheckout['purchase'] }>(`/courses/${slug}/checkout/status`);
  return data.purchase;
}

export async function confirmDemoCoursePayment(slug: string): Promise<CourseCheckout['purchase']> {
  const { data } = await api.post<{ purchase: CourseCheckout['purchase'] }>(
    `/courses/${slug}/checkout/demo-confirm`,
  );
  return data.purchase;
}

export async function fetchPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const { data } = await api.get<{ purchases: PurchaseHistoryItem[] }>('/purchases');
  return data.purchases;
}
