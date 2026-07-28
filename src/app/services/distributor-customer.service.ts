import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { CustomerSummary } from '../models/customer.model';
import { PageResponse } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class DistributorCustomerService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/distributor/customers';
  }

  list(search?: string, page = 0, size = 50): Observable<PageResponse<CustomerSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PageResponse<CustomerSummary>>(this.apiUrl, { params });
  }
}
