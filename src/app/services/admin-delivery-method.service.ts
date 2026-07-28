import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';

export interface DeliveryMethod {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryMethodRequest {
  name: string;
  cost: number;
  estimatedDays: number;
}

export interface UpdateDeliveryMethodRequest {
  name: string;
  cost: number;
  estimatedDays: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDeliveryMethodService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/delivery-methods';
  }

  list(active?: boolean): Observable<{ content: DeliveryMethod[]; totalElements: number; totalPages: number }> {
    let p = new HttpParams().set('size', '100');
    if (active !== undefined) p = p.set('active', active);
    return this.http.get<{ content: DeliveryMethod[]; totalElements: number; totalPages: number }>(this.apiUrl, { params: p });
  }

  create(req: CreateDeliveryMethodRequest): Observable<DeliveryMethod> {
    return this.http.post<DeliveryMethod>(this.apiUrl, req);
  }

  update(id: string, req: UpdateDeliveryMethodRequest): Observable<DeliveryMethod> {
    return this.http.put<DeliveryMethod>(`${this.apiUrl}/${id}`, req);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activate(id: string): Observable<DeliveryMethod> {
    return this.http.patch<DeliveryMethod>(`${this.apiUrl}/${id}/activate`, {});
  }
}
