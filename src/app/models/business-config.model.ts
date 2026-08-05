import { DeliveryWindow } from './delivery-window.model';

export interface BusinessConfig {
  minPacksPerLine: number;
  deliveryWindows?: DeliveryWindow[];
  updatedAt?: string;
}
