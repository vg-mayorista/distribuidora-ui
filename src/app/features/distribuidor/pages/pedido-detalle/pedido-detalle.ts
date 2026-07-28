import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS, nextStatusOptions } from '../../../../models/order.model';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-distribuidor-pedido-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, BadgeComponent, ButtonComponent],
  templateUrl: './pedido-detalle.html',
  styleUrl: './pedido-detalle.css',
})
export class DistribuidorPedidoDetalleComponent implements OnInit {
  order = signal<Order | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  transitioning = signal(false);
  showCancelModal = signal(false);
  transitionError = signal<string | null>(null);
  transitionNotes = signal('');
  tempDeliveryDate = signal<string>('');
  savingDate = signal(false);
  saveDateError = signal<string | null>(null);
  saveDateSuccess = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.get(id).subscribe({
      next: (o) => {
        this.order.set(o);
        if (o && o.deliveryDate) {
          this.tempDeliveryDate.set(o.deliveryDate);
        } else {
          this.tempDeliveryDate.set('');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el pedido.');
        this.loading.set(false);
      }
    });
  }

  nextOptions(): OrderStatus[] {
    const o = this.order();
    if (!o) return [];
    if (this.isRetiro(o)) {
      switch (o.status) {
        case 'PENDIENTE': return ['ARMADO', 'CANCELADO'];
        case 'ARMADO':    return ['ENTREGADO', 'CANCELADO'];
        default:          return [];
      }
    }
    return nextStatusOptions(o.status);
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

  shortId(id?: string): string {
    return id ? id.slice(0, 8).toUpperCase() : '—';
  }

  formatPrice(v: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);
  }

  formatDate(s?: string): string {
    if (!s) return '—';
    const parts = s.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(s?: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  isRetiro(o: Order | null): boolean {
    if (!o?.deliveryMethodName) return false;
    return o.deliveryMethodName.toLowerCase().includes('retiro');
  }

  transitionTo(target: OrderStatus): void {
    const o = this.order();
    if (!o?.id || this.transitioning()) return;
    if (target === 'CANCELADO') {
      this.transitionNotes.set('');
      this.transitionError.set(null);
      this.showCancelModal.set(true);
      return;
    }
    this.doTransition(target, undefined);
  }

  confirmCancel(): void {
    const o = this.order();
    if (!o?.id) return;
    const notes = this.transitionNotes().trim() || undefined;
    this.doTransition('CANCELADO', notes);
  }

  closeCancelModal(): void {
    if (!this.transitioning()) this.showCancelModal.set(false);
  }

  private doTransition(target: OrderStatus, notes?: string): void {
    const o = this.order();
    if (!o?.id) return;
    this.transitioning.set(true);
    this.transitionError.set(null);
    this.saveDateSuccess.set(false);
    this.orderService.transitionStatus(o.id, { targetStatus: target, notes }).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.transitioning.set(false);
        this.showCancelModal.set(false);
      },
      error: (err) => {
        this.transitioning.set(false);
        this.transitionError.set(err?.error?.detail || `No se pudo cambiar el estado a ${target}.`);
      }
    });
  }

  saveDeliveryDate(): void {
    const o = this.order();
    if (!o?.id) return;
    this.savingDate.set(true);
    this.saveDateError.set(null);
    this.saveDateSuccess.set(false);
    const date = this.tempDeliveryDate().trim() || null;
    this.orderService.updateDeliveryDate(o.id, date).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.savingDate.set(false);
        this.saveDateSuccess.set(true);
        setTimeout(() => this.saveDateSuccess.set(false), 3000);
      },
      error: (err) => {
        this.savingDate.set(false);
        this.saveDateError.set(err?.error?.detail || 'No se pudo guardar la fecha de reparto.');
      }
    });
  }
}
