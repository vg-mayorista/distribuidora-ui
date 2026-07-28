import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { CustomerSummary, CustomerPage, CreateUserRequest } from '../models/customer.model';
import { AuthResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl: string;
  private authUrl: string;

  constructor(private http: HttpClient) {
    const base = inject(API_BASE);
    this.apiUrl = base + '/api/admin/customers';
    this.authUrl = base + '/api/auth';
  }

  getCustomers(search?: string, page = 0, size = 20): Observable<CustomerPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<CustomerPage>(this.apiUrl, { params });
  }

  toggleActive(id: string): Observable<CustomerSummary> {
    return this.http.patch<CustomerSummary>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  createUser(request: CreateUserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/register`, request);
  }
}
