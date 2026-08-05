import { DeliveryWindow } from './delivery-window.model';

export interface BusinessConfig {
  minOrderAmount: number;
  minOrderUnits: number;
  deliveryWindows?: DeliveryWindow[];
  updatedAt?: string;
}
