import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { RegisterRequest } from '../../../../models/auth.model';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { LocationPickerComponent, LocationResult } from '../../../../shared/components/location-picker/location-picker';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, LocationPickerComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  formData: RegisterRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    zone: '',
    latitude: '',
    longitude: '',
  };

  acceptTerms = false;
  showPassword = false;
  loading = false;
  errorMsg: string | null = null;

  pickerOpen = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  openPicker(): void {
    this.errorMsg = null;
    this.pickerOpen.set(true);
  }

  onLocationPicked(result: LocationResult): void {
    this.formData.address = result.address;
    this.formData.zone = result.zone;
    this.formData.latitude = result.latitude.toFixed(7);
    this.formData.longitude = result.longitude.toFixed(7);
    this.pickerOpen.set(false);
  }

  onPickerCancel(): void {
    this.pickerOpen.set(false);
  }

  hasLocation(): boolean {
    return !!(this.formData.address && this.formData.latitude && this.formData.longitude);
  }

  onPhoneBlur(): void {
    this.formData.phone = this.formatPhone(this.formData.phone);
  }

  /**
   * Formatea teléfonos celulares argentinos sin prefijo internacional.
   * Acepta dígitos con separadores y un eventual 0 inicial de marcación local.
   * Salida: `370 451-6054` (Área 3 + abonado 7) o `11 4516-6054` (Área 2 + abonado 8).
   */
  private formatPhone(value: string): string {
    if (!value) return '';
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 0) return '';

    const areaLen = digits.startsWith('1') ? 2 : 3;
    const area = digits.slice(0, areaLen);
    const remaining = digits.slice(areaLen);
    if (remaining.length === 0) return area;

    const first = remaining.slice(0, 3);
    const second = remaining.slice(3, 7);
    let formatted = `${area} ${first}`;
    if (second.length > 0) formatted += `-${second}`;
    return formatted;
  }

  onSubmit(): void {
    this.errorMsg = null;

    if (
      !this.formData.firstName.trim() ||
      !this.formData.lastName.trim() ||
      !this.formData.email.trim() ||
      !this.formData.password.trim() ||
      !this.formData.phone.trim() ||
      !this.formData.address.trim()
    ) {
      this.errorMsg = 'Por favor completá todos los campos obligatorios.';
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

    const payload: RegisterRequest = {
      firstName: this.formData.firstName.trim(),
      lastName: this.formData.lastName.trim(),
      email: this.formData.email.trim(),
      password: this.formData.password,
      phone: this.formData.phone.trim(),
      address: this.formData.address.trim(),
      zone: this.formData.zone?.trim() || undefined,
      latitude: this.formData.latitude || undefined,
      longitude: this.formData.longitude || undefined,
    };

    this.authService.register(payload).subscribe({
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
