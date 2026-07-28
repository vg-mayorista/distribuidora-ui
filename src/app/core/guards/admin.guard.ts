import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function defaultPathForRole(role: string | undefined): string {
  switch (role) {
    case 'ROLE_ADMIN': return '/admin';
    case 'ROLE_DISTRIBUTOR': return '/distribuidor';
    case 'ROLE_CUSTOMER': return '/cliente/catalogo';
    default: return '/';
  }
}

/**
 * Bloquea el acceso a rutas exclusivas de administrador.
 * El backend devuelve role = "ROLE_ADMIN" (con prefijo ROLE_).
 * - Sin sesión       → /login?returnUrl=<intentado>
 * - Sesión sin admin → home del rol correspondiente
 */
export const adminGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (user?.role === 'ROLE_ADMIN') {
    return true;
  }

  if (user) {
    router.navigate([defaultPathForRole(user.role)]);
  } else {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  }
  return false;
};

