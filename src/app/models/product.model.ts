export interface Product {
  id?: string;
  categoryId?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  unitsPerPack: number;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
