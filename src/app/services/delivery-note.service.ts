import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { AuthService } from './auth.service';
import { PageResponse } from '../models/order.model';
import {
  DeliveryNote,
  DeliveryNoteStatus,
  UpdateDeliveryNoteStatusRequest,
} from '../models/delivery-note.model';

@Injectable({
  providedIn: 'root',
})
export class DeliveryNoteService {
  private apiBase = inject(API_BASE);

  private get apiUrl(): string {
    const role = this.authService.getCurrentUser()?.role;
    const prefix = role === 'ROLE_DISTRIBUTOR' ? 'distributor' : 'admin';
    return `${this.apiBase}/api/${prefix}/delivery-notes`;
  }

  constructor(private http: HttpClient, private authService: AuthService) {}

  generateFromOrder(orderId: string): Observable<DeliveryNote> {
    return this.http.post<DeliveryNote>(`${this.apiUrl}/generate/${orderId}`, {});
  }

  get(id: string): Observable<DeliveryNote> {
    return this.http.get<DeliveryNote>(`${this.apiUrl}/${id}`);
  }

  list(filters: {
    status?: DeliveryNoteStatus;
    orderId?: string;
    page?: number;
    size?: number;
  } = {}): Observable<PageResponse<DeliveryNote>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.orderId) {
      params = params.set('orderId', filters.orderId);
    }

    if (filters.orderId) {
      return this.http.get<PageResponse<DeliveryNote>>(`${this.apiUrl}/order/${filters.orderId}`, { params });
    }

    return this.http.get<PageResponse<DeliveryNote>>(this.apiUrl, { params });
  }

  listByOrder(orderId: string, page = 0, size = 20): Observable<PageResponse<DeliveryNote>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<DeliveryNote>>(`${this.apiUrl}/order/${orderId}`, { params });
  }

  transitionStatus(id: string, req: UpdateDeliveryNoteStatusRequest): Observable<DeliveryNote> {
    return this.http.patch<DeliveryNote>(`${this.apiUrl}/${id}/status`, req);
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }
}
