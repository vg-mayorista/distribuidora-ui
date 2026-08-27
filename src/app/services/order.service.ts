import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { environment } from '../../environments/environment';
import {
  CreateOrderRequest,
  Order,
  OrderStatus,
  PageResponse,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
} from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/orders';
  }

  private get distributorUrl(): string {
    return environment.backendUrl ? `${environment.backendUrl}/api/distributor/orders` : '/api/distributor/orders';
  }

  // ── Cliente ────────────────────────────────────────────────

  /** Pedido mayorista a fábrica. Requiere deliveryDate. */
  createWholesale(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/wholesale`, req);
  }

  /** Pedido contra el excedente en depósito. deliveryDate debe ser null. */
  createStock(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/stock`, req);
  }

  /** Compatibilidad: dispatch retrocompatible según presence de deliveryDate. */
  create(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, req);
  }

  listMine(page = 0, size = 20): Observable<PageResponse<Order>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Order>>(this.apiUrl, { params });
  }

  getMine(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  updateMine(id: string, req: UpdateOrderRequest): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}`, req);
  }

  uploadReceipt(id: string, receiptUrl: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/receipt`, { receiptUrl });
  }

  cancelMine(id: string): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${id}`);
  }

  // ── Distribuidor ───────────────────────────────────────────

  listAll(filters: {
    statuses?: OrderStatus[];
    deliveryDate?: string;
    type?: 'STOCK' | 'WHOLESALE';
    customerId?: string;
    search?: string;
    page?: number;
    size?: number;
  } = {}): Observable<PageResponse<Order>> {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 20);
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(s => { params = params.append('statuses', s); });
    }
    if (filters.deliveryDate) params = params.set('deliveryDate', filters.deliveryDate);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<PageResponse<Order>>(this.distributorUrl, { params });
  }

  get(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.distributorUrl}/${id}`);
  }

  transitionStatus(id: string, req: UpdateOrderStatusRequest): Observable<Order> {
    return this.http.patch<Order>(`${this.distributorUrl}/${id}/status`, req);
  }

  updateDeliveryDate(id: string, deliveryDate: string | null): Observable<Order> {
    return this.http.patch<Order>(`${this.distributorUrl}/${id}/delivery-date`, { deliveryDate });
  }
}
