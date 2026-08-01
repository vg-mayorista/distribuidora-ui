import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartStore } from '../../services/cart.store';
import { DeliveryMethodService, DeliveryMethodSummary } from '../../../../services/delivery-method.service';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { ButtonComponent } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-confirmar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './confirmar.html',
  styleUrl: './confirmar.css',
})
export class ConfirmarComponent implements OnInit {
  private cart = inject(CartStore);
  private deliveryMethodService = inject(DeliveryMethodService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cartStore = this.cart;
  lines = this.cart.lines;
  subtotal = this.cart.subtotal;
  count = this.cart.count;

  deliveryMethods = signal<DeliveryMethodSummary[]>([]);
  selectedDeliveryMethodId = signal<string>('');
  deliveryAddress = signal('');
  deliveryPhone = signal('');
  notes = signal('');
  deliveryDate = signal<string>('');
  hasSavedAddress = signal(false);

  loading = signal(false);
  error = signal<string | null>(null);

  selectedDeliveryMethod = signal<DeliveryMethodSummary | null>(null);

  ngOnInit(): void {
    this.deliveryMethodService.listActive().subscribe({
      next: (methods) => {
        this.deliveryMethods.set(methods);
        const currentId = this.selectedDeliveryMethodId();
        if (currentId) {
          const found = methods.find(m => m.id === currentId);
          if (found) {
            this.selectedDeliveryMethod.set(found);
            return;
          }
        }
        const ret = methods.find(m => m.name.toLowerCase().includes('retiro'));
        const def = ret ?? methods[0];
        if (def) {
          this.selectedDeliveryMethodId.set(def.id);
          this.selectedDeliveryMethod.set(def);
        }
      },
      error: () => this.error.set('No se pudieron cargar los métodos de entrega.'),
    });

    this.orderService.listMine(0, 5).subscribe({
      next: (ordersPage) => {
        const editingId = this.cart.editingOrderId();
        let targetOrder = editingId ? ordersPage.content.find(o => o.id === editingId) : null;
        if (!targetOrder) {
          targetOrder = ordersPage.content.find(o => o.deliveryAddress && o.deliveryAddress.trim());
        }
        
        if (targetOrder) {
          if (targetOrder.deliveryAddress) {
            this.hasSavedAddress.set(true);
            this.deliveryAddress.set(targetOrder.deliveryAddress);
          }
          if (targetOrder.deliveryPhone) {
            this.deliveryPhone.set(this.formatPhoneNumber(targetOrder.deliveryPhone));
          }
          if (editingId && targetOrder.deliveryMethodId) {
            this.selectedDeliveryMethodId.set(targetOrder.deliveryMethodId);
            const methods = this.deliveryMethods();
            if (methods.length > 0) {
              const found = methods.find(m => m.id === targetOrder.deliveryMethodId);
              if (found) this.selectedDeliveryMethod.set(found);
            }
          }
        }
      }
    });

    const editingId = this.cart.editingOrderId();
    if (editingId) {
      this.orderService.getMine(editingId).subscribe({
        next: (o) => {
          if (o && !o.editable) {
            this.cart.setEditingOrderId(null);
            this.error.set('El pedido que estabas modificando ya fue procesado y no se puede editar. Se procederá a confirmar como un pedido nuevo.');
          }
        },
        error: () => {
          this.cart.setEditingOrderId(null);
        }
      });
    }
  }

  selectDeliveryMethod(method: DeliveryMethodSummary): void {
    this.selectedDeliveryMethodId.set(method.id);
    this.selectedDeliveryMethod.set(method);
  }

  computeTotal(): number {
    return (this.subtotal() + (this.selectedDeliveryMethod()?.cost ?? 0));
  }

  get requiresAddress(): boolean {
    const name = (this.selectedDeliveryMethod()?.name ?? '').toLowerCase();
    return !name.includes('retiro') && !name.includes('local');
  }

  get canSubmit(): boolean {
    if (!this.selectedDeliveryMethodId() || this.lines().length === 0) return false;
    if (this.requiresAddress && (!this.deliveryAddress().trim() || !this.deliveryPhone().trim())) return false;
    return true;
  }

  get validationErrorMessage(): string | null {
    if (!this.selectedDeliveryMethodId()) {
      return 'Seleccioná un método de entrega para continuar.';
    }
    if (this.lines().length === 0) {
      return 'El carrito está vacío.';
    }
    if (this.requiresAddress) {
      const missingAddress = !this.deliveryAddress().trim();
      const missingPhone = !this.deliveryPhone().trim();
      if (missingAddress && missingPhone) {
        return 'Completá la dirección y el teléfono para continuar.';
      }
      if (missingAddress) {
        return 'Completá la dirección para continuar.';
      }
      if (missingPhone) {
        return 'Completá el teléfono para continuar.';
      }
    }
    return null;
  }

  submit(): void {
    if (!this.canSubmit || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const req = {
      deliveryMethodId: this.selectedDeliveryMethodId(),
      deliveryDate: this.deliveryDate() || undefined,
      deliveryAddress: this.requiresAddress ? this.deliveryAddress().trim() : undefined,
      deliveryPhone: this.requiresAddress ? this.deliveryPhone().trim() : undefined,
      notes: this.notes().trim() || undefined,
      items: this.lines().map(l => ({ productId: l.product.id!, quantity: l.packs })),
    };

    const editingOrderId = this.cart.editingOrderId();
    if (editingOrderId) {
      this.orderService.updateMine(editingOrderId, req).subscribe({
        next: (order) => {
          this.cart.clear();
          this.loading.set(false);
          this.router.navigate(['/cliente/mis-pedidos', order.id]);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.mapError(err, 'No se pudieron guardar los cambios del pedido.'));
        }
      });
    } else {
      this.orderService.create(req).subscribe({
        next: (order) => {
          this.cart.clear();
          this.loading.set(false);
          this.router.navigate(['/cliente/mis-pedidos', order.id]);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.mapError(err, 'No se pudo confirmar el pedido.'));
        }
      });
    }
  }

  private mapError(err: any, fallback: string): string {
    const body = err?.error;
    if (body?.error === 'INSUFFICIENT_STOCK' && Array.isArray(body.items) && body.items.length > 0) {
      const details = body.items.map((it: any) =>
        `${it.productName}: pediste ${it.requested} unid., disponibles ${it.available} unid.`
      ).join('\n');
      return `No hay stock suficiente para:\n${details}`;
    }
    return body?.detail || fallback;
  }

  cancel(): void {
    this.router.navigate(['/cliente/carrito']);
  }

  cancelModification(): void {
    this.cart.setEditingOrderId(null);
    this.error.set(null);
  }

  shortEditingOrderId(): string {
    const id = this.cart.editingOrderId();
    return id ? id.slice(0, 8).toUpperCase() : '';
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  trackById(_i: number, m: DeliveryMethodSummary): string {
    return m.id;
  }

  trackByProduct(_i: number, line: { product: { id?: string } }): string | undefined {
    return line.product.id;
  }


  formatPhoneNumber(value: string): string {
    if (!value) return '';
    let cleaned = value.replace(/[^\d+]/g, '');
    
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('54')) {
        cleaned = '+' + cleaned;
      } else {
        if (cleaned.length === 10) {
          cleaned = '+549' + cleaned;
        } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
          cleaned = '+549' + cleaned.slice(1);
        }
      }
    }
    
    const digits = cleaned.replace(/\D/g, '');
    
    if (cleaned.startsWith('+') && digits.startsWith('549')) {
      const rest = digits.slice(3);
      const areaLen = rest.startsWith('1') ? 2 : 3;
      const area = rest.slice(0, areaLen);
      const remaining = rest.slice(areaLen);
      
      let formatted = `+54 9 ${area}`;
      if (remaining.length > 0) {
        const first = remaining.slice(0, 3);
        const second = remaining.slice(3, 7);
        formatted += ` ${first}`;
        if (second.length > 0) {
          formatted += `-${second}`;
        }
      }
      return formatted;
    }
    
    return value;
  }

  onPhoneBlur(): void {
    const raw = this.deliveryPhone();
    const formatted = this.formatPhoneNumber(raw);
    this.deliveryPhone.set(formatted);
  }
}
