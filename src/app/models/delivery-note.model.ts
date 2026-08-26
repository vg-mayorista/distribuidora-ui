import { PaymentMethod } from './order.model';
export type DeliveryNoteStatus = 'PENDING' | 'GENERATED' | 'DELIVERED' | 'CANCELED';

export interface DeliveryNoteItem {
  id?: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantityDelivered: number;
}

export interface DeliveryNote {
  id?: string;
  orderId: string;
  deliveryNoteNumber: string;
  status: DeliveryNoteStatus;
  issueDate?: string;
  deliveryDate?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  items: DeliveryNoteItem[];
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
}

export interface CreateDeliveryNoteRequest {
  orderId: string;
  notes?: string;
}

export interface UpdateDeliveryNoteStatusRequest {
  targetStatus: DeliveryNoteStatus;
  notes?: string;
}

export const DELIVERY_NOTE_STATUS_LABELS: Record<DeliveryNoteStatus, string> = {
  PENDING: 'Pendiente',
  GENERATED: 'Generado',
  DELIVERED: 'Entregado',
  CANCELED: 'Cancelado',
};

export const DELIVERY_NOTE_STATUS_VARIANTS: Record<DeliveryNoteStatus, 'warning' | 'info' | 'active' | 'inactive'> = {
  PENDING: 'warning',
  GENERATED: 'info',
  DELIVERED: 'active',
  CANCELED: 'inactive',
};

export function nextDeliveryNoteStatusOptions(current: DeliveryNoteStatus): DeliveryNoteStatus[] {
  switch (current) {
    case 'PENDING': return ['GENERATED', 'CANCELED'];
    case 'GENERATED': return ['DELIVERED', 'CANCELED'];
    case 'DELIVERED':
    case 'CANCELED': return [];
  }
}
