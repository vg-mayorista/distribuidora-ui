import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Redirige a los usuarios autenticados con rol no-cliente fuera de la home pública.
 * - ROLE_DISTRIBUTOR ? /distribuidor
 * - ROLE_ADMIN       ? /admin
 * - ROLE_CUSTOMER o no autenticado ? acceso normal a la home
 */
export const homeRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (user?.role === 'ROLE_DISTRIBUTOR') {
    router.navigate(['/distribuidor']);
    return false;
  }

  if (user?.role === 'ROLE_ADMIN') {
    router.navigate(['/admin']);
    return false;
  }

  return true;
};
