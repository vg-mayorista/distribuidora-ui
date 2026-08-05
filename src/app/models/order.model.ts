import { OrderType } from './order-type.model';

export type OrderStatus = 'PENDIENTE' | 'ARMADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  quantity: number;
  packsRequested: number;
  unitsPerPackAtOrder: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  status: OrderStatus;
  type: OrderType;
  deliveryMethodId?: string;
  deliveryMethodName?: string;
  deliveryCost: number;
  subtotal: number;
  total: number;
  deliveryAddress?: string;
  deliveryPhone?: string;
  notes?: string;
  deliveryDate?: string;
  editable?: boolean;
  itemCount?: number;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
}

export interface CreateOrderRequest {
  deliveryMethodId: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export interface UpdateOrderRequest {
  deliveryMethodId?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export interface UpdateOrderStatusRequest {
  targetStatus: OrderStatus;
  notes?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  ARMADO: 'Armado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const ORDER_STATUS_VARIANTS: Record<OrderStatus, 'warning' | 'info' | 'active' | 'inactive' | 'neutral'> = {
  PENDIENTE: 'warning',
  ARMADO: 'info',
  ENVIADO: 'info',
  ENTREGADO: 'active',
  CANCELADO: 'inactive',
};

export function nextStatusOptions(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case 'PENDIENTE': return ['ARMADO', 'CANCELADO'];
    case 'ARMADO':    return ['ENVIADO', 'CANCELADO'];
    case 'ENVIADO':   return ['ENTREGADO'];
    case 'ENTREGADO':
    case 'CANCELADO': return [];
  }
}
