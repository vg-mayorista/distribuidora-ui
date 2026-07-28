import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { LoginRequest } from '../../../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = { email: '', password: '' };
  showPassword = false;
  loading = false;
  errorMsg: string | null = null;
  returnUrl: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMsg = null;

    if (!this.credentials.email.trim() || !this.credentials.password.trim()) {
      this.errorMsg = 'Por favor completá todos los campos.';
      return;
    }

    this.loading = true;

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.loading = false;
        const user = this.authService.getCurrentUser();

        // 1) Si el guard nos dejó una returnUrl, volvemos ahí (si la ruta permite el rol).
        if (this.returnUrl && this.canAccess(this.returnUrl, user?.role)) {
          this.router.navigateByUrl(this.returnUrl);
          return;
        }

        // 2) Si no, mandamos al home que le corresponda al rol.
        const target = this.defaultForRole(user?.role);
        this.router.navigate([target]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.status === 401
          ? 'Email o contraseña incorrectos.'
          : err.status === 0
            ? 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo en :8080.'
            : err.status === 403
              ? 'No tenés permiso para acceder a esa sección.'
              : 'Error al iniciar sesión. Intentá de nuevo.';
      }
    });
  }

  private defaultForRole(role: string | undefined): string {
    switch (role) {
      case 'ROLE_ADMIN': return '/admin';
      case 'ROLE_DISTRIBUTOR': return '/distribuidor';
      case 'ROLE_CUSTOMER': return '/cliente/catalogo';
      default: return '/';
    }
  }

  private canAccess(url: string, role: string | undefined): boolean {
    if (!url || !role) return false;
    if (url.startsWith('/admin')) return role === 'ROLE_ADMIN';
    if (url.startsWith('/distribuidor')) return role === 'ROLE_DISTRIBUTOR' || role === 'ROLE_ADMIN';
    if (url.startsWith('/cliente')) return role === 'ROLE_CUSTOMER' || role === 'ROLE_ADMIN';
    if (url === '/productos' || url === '/') return true;
    return false;
  }
}
