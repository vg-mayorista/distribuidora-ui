import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Base URL del backend Distribuidora.
 *
 * Los servicios construyen sus URLs concatenando `API_BASE` con el path del
 * endpoint (ej. `API_BASE + '/api/products'`).
 *
 * - Desarrollo local: `http://localhost:8080` (definido en environment.ts)
 * - Producción:      vacío (rutas relativas, mismo origen vía proxy inverso)
 * - Túneles HTTPS:   URL pública del túnel del backend
 */
export const API_BASE = new InjectionToken<string>('apiBase', {
    factory: () => environment.backendUrl,
});
