import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { VolumeAndTicket, TopProduct, TopCustomer, LowStock } from '../models/report.model';

export interface ReportFilters {
  from?: string;
  to?: string;
  limit?: number;
  threshold?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/admin/reports';
  }

  volume(filters: ReportFilters = {}): Observable<VolumeAndTicket> {
    return this.http.get<VolumeAndTicket>(`${this.apiUrl}/volume`, { params: this.toParams(filters) });
  }

  topProducts(filters: ReportFilters = {}): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.apiUrl}/top-products`, { params: this.toParams(filters) });
  }

  topCustomers(filters: ReportFilters = {}): Observable<TopCustomer[]> {
    return this.http.get<TopCustomer[]>(`${this.apiUrl}/top-customers`, { params: this.toParams(filters) });
  }

  lowStock(threshold = 10): Observable<LowStock[]> {
    return this.http.get<LowStock[]>(`${this.apiUrl}/low-stock`, { params: new HttpParams().set('threshold', threshold) });
  }

  exportUrl(kind: 'volume' | 'top-products' | 'top-customers' | 'low-stock', filters: ReportFilters = {}): string {
    const base = `${this.apiUrl}/${kind}.csv`;
    const params = this.toParams(filters);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private toParams(filters: ReportFilters): HttpParams {
    let p = new HttpParams();
    if (filters.from) p = p.set('from', filters.from);
    if (filters.to) p = p.set('to', filters.to);
    if (filters.limit != null) p = p.set('limit', filters.limit);
    if (filters.threshold != null) p = p.set('threshold', filters.threshold);
    return p;
  }
}
