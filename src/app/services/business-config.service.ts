import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../core/tokens/api-base.token';
import { BusinessConfig } from '../models/business-config.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessConfigService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_BASE) + '/api/config';

  readonly config = signal<BusinessConfig>({
    minOrderAmount: 30000,
    minOrderUnits: 5,
    deliveryWindows: [],
  });
  readonly loading = signal<boolean>(false);
  readonly loaded = signal<boolean>(false);

  loadConfig(): void {
    this.loading.set(true);
    this.http.get<BusinessConfig>(`${this.apiUrl}/public`).subscribe({
      next: (data) => {
        if (data) {
          this.config.set({
            minOrderAmount: data.minOrderAmount ?? 30000,
            minOrderUnits: data.minOrderUnits ?? 5,
            deliveryWindows: data.deliveryWindows ?? [],
          });
        }
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: (err) => {
        console.warn('Could not load public business config, using fallback defaults:', err);
        this.loading.set(false);
        this.loaded.set(true);
      },
    });
  }
}
