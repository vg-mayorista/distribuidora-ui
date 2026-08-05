import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { DeliveryWindow } from '../models/delivery-window.model';

export interface CreateDeliveryWindowRequest {
  cutoffDayOfWeek: number;
  cutoffTime: string;
  deliveryDayOfWeek: number;
  description?: string;
  active?: boolean;
}

export interface UpdateDeliveryWindowRequest {
  cutoffDayOfWeek?: number;
  cutoffTime?: string;
  deliveryDayOfWeek?: number;
  description?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdminDeliveryWindowService {
  private apiUrl = inject(API_BASE) + '/api/admin/delivery-windows';
  private http = inject(HttpClient);

  list(): Observable<DeliveryWindow[]> {
    return this.http.get<DeliveryWindow[]>(this.apiUrl);
  }

  create(req: CreateDeliveryWindowRequest): Observable<DeliveryWindow> {
    return this.http.post<DeliveryWindow>(this.apiUrl, req);
  }

  update(id: string, req: UpdateDeliveryWindowRequest): Observable<DeliveryWindow> {
    return this.http.put<DeliveryWindow>(`${this.apiUrl}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
