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

function loginUrl(attemptedUrl: string): { commands: any[]; extras?: any } {
  return {
    commands: ['/login'],
    extras: { queryParams: { returnUrl: attemptedUrl } },
  };
}

/**
 * Bloquea el acceso a rutas exclusivas del cliente.
 * - Sin sesión          → /login?returnUrl=<intentado>
 * - Sesión sin customer → home que le corresponda
 */
export const customerGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (user?.role === 'ROLE_CUSTOMER') {
    return true;
  }

  if (user) {
    router.navigate([defaultPathForRole(user.role)]);
  } else {
    const dest = loginUrl(state.url);
    router.navigate(dest.commands, dest.extras);
  }
  return false;
};
