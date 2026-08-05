export type DeliveryMethodScope = 'WHOLESALE' | 'STOCK' | 'BOTH';

export interface DeliveryWindow {
  id: string;
  cutoffDayOfWeek: number;
  cutoffTime: string;
  deliveryDayOfWeek: number;
  description?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
