import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { RegisterRequest } from '../../../../models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  formData: RegisterRequest = { firstName: '', lastName: '', email: '', password: '' };
  acceptTerms = false;
  showPassword = false;
  loading = false;
  errorMsg: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMsg = null;

    if (
      !this.formData.firstName.trim() ||
      !this.formData.lastName.trim() ||
      !this.formData.email.trim() ||
      !this.formData.password.trim()
    ) {
      this.errorMsg = 'Por favor completá todos los campos.';
      return;
    }
    if (!this.acceptTerms) {
      this.errorMsg = 'Debés aceptar los términos y condiciones.';
      return;
    }
    if (this.formData.password.length < 6) {
      this.errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (!this.formData.email) {
      this.errorMsg = 'El correo no es correcto.';
      return;
    }

    this.loading = true;

    this.authService.register(this.formData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.status === 409
          ? 'El email ya está registrado.'
          : err.status === 400
            ? 'Revisá los datos ingresados.'
            : 'Error al registrarse. Intentá de nuevo.';
      }
    });
  }
}
