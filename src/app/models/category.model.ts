export interface Category {
  id?: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPage {
  content: Category[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
