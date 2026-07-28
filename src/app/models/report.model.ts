export interface VolumeAndTicket {
  deliveredCount: number;
  deliveredRevenue: number;
  avgTicket: number;
  closedCount: number;
  closedRevenue: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  unitsSold: number;
  packsSold: number;
  orderCount: number;
  revenue: number;
}

export interface TopCustomer {
  userId: string;
  orderCount: number;
  totalSpent: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LowStock {
  productId: string;
  name: string;
  stock: number;
  unitsPerPack: number;
  price: number;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  customerCount: number;
  distributorCount: number;
  adminCount: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  activeDeliveryMethods: number;
  systemStatus: string;
  databaseEngine: string;
  rateLimiterProtection: string;
}
