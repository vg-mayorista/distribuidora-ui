export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id?: string;
  categoryId?: string;
  name: string;
  description: string;
  price: number;
  stock?: number | null;
  stockStatus: StockStatus;
  lowStockThreshold?: number | null;
  unitsPerPack: number;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
