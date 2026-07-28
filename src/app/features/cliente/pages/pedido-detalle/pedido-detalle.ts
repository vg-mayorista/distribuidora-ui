import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS, UpdateOrderRequest } from '../../../../models/order.model';
import { CartStore } from '../../services/cart.store';
import { Product } from '../../../../models/product.model';
import { DeliveryMethodService, DeliveryMethodSummary } from '../../../../services/delivery-method.service';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-pedido-detalle-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, BadgeComponent, ButtonComponent],
  templateUrl: './pedido-detalle.html',
  styleUrl: './pedido-detalle.css',
})
export class PedidoDetalleClienteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private cart = inject(CartStore);
  private deliveryMethodService = inject(DeliveryMethodService);
  private cdr = inject(ChangeDetectorRef);

  order = signal<Order | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  showCancelModal = signal(false);
  cancelling = signal(false);
  showEditModal = signal(false);
  editing = signal(false);
  editError = signal<string | null>(null);

  editDeliveryMethodId = signal<string>('');
  editDeliveryAddress = signal('');
  editDeliveryPhone = signal('');
  editNotes = signal('');

  deliveryMethods = signal<DeliveryMethodSummary[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
    this.deliveryMethodService.listActive().subscribe({
      next: (methods) => this.deliveryMethods.set(methods),
    });
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.getMine(id).subscribe({
      next: (o) => {
        if (o && o.deliveryPhone) {
          o.deliveryPhone = this.formatPhoneNumber(o.deliveryPhone);
        }
        this.order.set(o);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el pedido.');
        this.loading.set(false);
      }
    });
  }

  shortId(id?: string): string {
    return id ? id.slice(0, 8).toUpperCase() : '—';
  }

  statusLabel(s: OrderStatus): string {
    return ORDER_STATUS_LABELS[s];
  }

  statusVariant(s: OrderStatus): 'warning' | 'info' | 'active' | 'inactive' | 'neutral' {
    switch (s) {
      case 'PENDIENTE': return 'warning';
      case 'ARMADO': return 'info';
      case 'ENVIADO': return 'info';
      case 'ENTREGADO': return 'active';
      case 'CANCELADO': return 'inactive';
    }
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  formatDate(s?: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(s?: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  openCancelModal(): void { this.showCancelModal.set(true); }
  closeCancelModal(): void { if (!this.cancelling()) this.showCancelModal.set(false); }

  confirmCancel(): void {
    const o = this.order();
    if (!o?.id || this.cancelling()) return;
    this.cancelling.set(true);
    this.orderService.cancelMine(o.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.cancelling.set(false);
        this.showCancelModal.set(false);
      },
      error: (err) => {
        this.cancelling.set(false);
        this.error.set(err?.error?.detail || 'No se pudo cancelar el pedido.');
      }
    });
  }

  editProducts(): void {
    const o = this.order();
    if (!o) return;
    this.cart.clear();
    this.cart.setEditingOrderId(o.id ?? null);
    const lines = o.items.map(item => ({
      product: {
        id: item.productId,
        name: item.productName,
        price: item.unitPrice,
        unitsPerPack: item.unitsPerPackAtOrder,
        description: '',
        stock: 9999,
        active: true
      },
      packs: item.packsRequested,
      physicalUnits: item.quantity
    }));
    this.cart.setLines(lines);
    this.router.navigate(['/cliente/catalogo']);
  }

  openEditModal(): void {
    const o = this.order();
    if (!o) return;
    this.editDeliveryMethodId.set(o.deliveryMethodId ?? '');
    this.editDeliveryAddress.set(o.deliveryAddress ?? '');
    this.editDeliveryPhone.set(o.deliveryPhone ?? '');
    this.editNotes.set(o.notes ?? '');
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    if (!this.editing()) this.showEditModal.set(false);
  }

  selectedDeliveryMethod(): DeliveryMethodSummary | null {
    const id = this.editDeliveryMethodId();
    return this.deliveryMethods().find(m => m.id === id) ?? null;
  }

  editRequiresAddress(): boolean {
    const name = (this.selectedDeliveryMethod()?.name ?? '').toLowerCase();
    return !name.includes('retiro') && !name.includes('local');
  }

  canSubmitEdit(): boolean {
    const o = this.order();
    if (!o) return false;
    if (!this.editDeliveryMethodId()) return false;
    if (this.editRequiresAddress() && (!this.editDeliveryAddress().trim() || !this.editDeliveryPhone().trim())) return false;
    return true;
  }

  submitEdit(): void {
    const o = this.order();
    if (!o?.id || !this.canSubmitEdit() || this.editing()) return;
    this.editing.set(true);
    this.editError.set(null);
    const req: UpdateOrderRequest = {
      deliveryMethodId: this.editDeliveryMethodId(),
      deliveryAddress: this.editRequiresAddress() ? this.editDeliveryAddress().trim() : undefined,
      deliveryPhone: this.editRequiresAddress() ? this.editDeliveryPhone().trim() : undefined,
      notes: this.editNotes().trim() || undefined,
      items: o.items.map(item => ({
        productId: item.productId,
        quantity: item.packsRequested,
      })),
    };
    this.orderService.updateMine(o.id, req).subscribe({
      next: (updated) => {
        if (updated && updated.deliveryPhone) {
          updated.deliveryPhone = this.formatPhoneNumber(updated.deliveryPhone);
        }
        this.order.set(updated);
        this.editing.set(false);
        this.showEditModal.set(false);
      },
      error: (err) => {
        this.editing.set(false);
        this.editError.set(err?.error?.detail || 'No se pudo actualizar el pedido.');
      }
    });
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

  onEditPhoneBlur(): void {
    const raw = this.editDeliveryPhone();
    const formatted = this.formatPhoneNumber(raw);
    this.editDeliveryPhone.set(formatted);
  }
}
