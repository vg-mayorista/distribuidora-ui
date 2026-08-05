import { DeliveryWindow } from './delivery-window.model';

export interface BusinessConfig {
  minPacksPerLine: number;
  minOrderAmount: number;
  deliveryWindows?: DeliveryWindow[];
  updatedAt?: string;
}
