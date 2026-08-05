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

  /**
   * Mínimo de packs por línea. Si el backend no responde, caemos a 5.
   */
  readonly defaultMinPacksPerLine = 5;

  /**
   * Subtotal mínimo del pedido (en pesos). Si el backend no responde,
   * caemos a 30.000.
   */
  readonly defaultMinOrderAmount = 30000;

  readonly config = signal<BusinessConfig>({
    minPacksPerLine: this.defaultMinPacksPerLine,
    minOrderAmount: this.defaultMinOrderAmount,
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
            minPacksPerLine: data.minPacksPerLine ?? this.defaultMinPacksPerLine,
            minOrderAmount: data.minOrderAmount ?? this.defaultMinOrderAmount,
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
