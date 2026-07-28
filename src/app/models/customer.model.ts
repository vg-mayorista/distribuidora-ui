export interface CustomerSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface CustomerPage {
  content: CustomerSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'ROLE_CUSTOMER' | 'ROLE_DISTRIBUTOR' | 'ROLE_SELLER';
}
