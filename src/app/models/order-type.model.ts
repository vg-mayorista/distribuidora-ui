export type OrderType = 'STOCK' | 'WHOLESALE';

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  STOCK: 'Stock disponible',
  WHOLESALE: 'Pedido mayorista',
};

export const ORDER_TYPE_SHORT_LABELS: Record<OrderType, string> = {
  STOCK: 'Stock',
  WHOLESALE: 'Mayorista',
};
