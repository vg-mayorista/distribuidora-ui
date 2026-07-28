import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Adjunta el header "Authorization: Bearer <token>" a las peticiones
 * dirigidas a la API del backend, siempre que haya una sesión activa.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Agregar token a todas las requests que van al backend
  // Incluye: localhost:8080, cloudflared tunnel, o cualquier URL con /api
  const isApiRequest = 
    req.url.startsWith('http://localhost:8080') ||
    (environment.backendUrl && req.url.startsWith(environment.backendUrl)) ||
    req.url.includes('/api/');

  if (token && isApiRequest) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
