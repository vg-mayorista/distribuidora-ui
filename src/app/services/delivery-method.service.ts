import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { DeliveryMethodScope } from '../models/delivery-window.model';

export interface DeliveryMethodSummary {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays?: number;
  appliesToOrderType?: DeliveryMethodScope;
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryMethodService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/delivery-methods';
  }

  listActive(): Observable<DeliveryMethodSummary[]> {
    const params = new HttpParams().set('active', 'true').set('size', '50');
    return this.http.get<{ content: DeliveryMethodSummary[] }>(this.apiUrl, { params }).pipe(
      map(res => res.content)
    );
  }

  getById(id: string): Observable<DeliveryMethodSummary> {
    return this.http.get<DeliveryMethodSummary>(`${this.apiUrl}/${id}`);
  }
}
