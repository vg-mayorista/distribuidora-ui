import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/cart';
  }

  checkStock(productIds: string[]): Observable<Record<string, number>> {
    return this.http.post<Record<string, number>>(this.apiUrl + '/check-stock', productIds);
  }
}
