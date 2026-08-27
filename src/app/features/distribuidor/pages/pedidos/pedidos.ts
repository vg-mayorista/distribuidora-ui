import { getUpcomingDeliveryDates, DeliveryDayOption } from '../../../../utils/delivery-date.utils';
import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { DeliveryNoteService } from '../../../../services/delivery-note.service';
import { DistributorCustomerService } from '../../../../services/distributor-customer.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS } from '../../../../models/order.model';
import { OrderType, ORDER_TYPE_SHORT_LABELS } from '../../../../models/order-type.model';
import { CustomerSummary } from '../../../../models/customer.model';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

export type SimpleStatusFilter = 'ALL' | 'PENDIENTE' | 'ENTREGADO';

@Component({
  selector: 'app-distribuidor-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class DistribuidorPedidosComponent implements OnInit {
  orders = signal<Order[]>([]);
  deliveryDayOptions: DeliveryDayOption[] = getUpcomingDeliveryDates(12);
  loading = signal(false);
  error = signal<string | null>(null);

  actionLoadingOrderId = signal<string | null>(null);
  downloadingRemitoOrderId = signal<string | null>(null);

  searchTerm = signal('');
  selectedStatusFilter = signal<SimpleStatusFilter>('ALL');
  deliveryDate = signal<string>('');
  customerId = signal<string>('');
  typeFilter = signal<'ALL' | OrderType>('ALL');

  customers = signal<CustomerSummary[]>([]);

  statusOptions: { key: SimpleStatusFilter; label: string }[] = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'ENTREGADO', label: 'Entregados' },
  ];

  typeOptions: { key: 'ALL' | OrderType; label: string }[] = [
    { key: 'ALL', label: 'Todos los flujos' },
    { key: 'WHOLESALE', label: 'A fábrica' },
    { key: 'STOCK', label: 'Stock' },
  ];

  constructor(
    private orderService: OrderService,
    private deliveryNoteService: DeliveryNoteService,
    private customerService: DistributorCustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.customerService.list().subscribe({
      next: (data) => this.customers.set(data.content),
      error: () => {},
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    let statuses: OrderStatus[] | undefined;
    const filter = this.selectedStatusFilter();
    if (filter === 'PENDIENTE') {
      statuses = ['PENDIENTE', 'ARMADO', 'ENVIADO'];
    } else if (filter === 'ENTREGADO') {
      statuses = ['ENTREGADO'];
    }

    const tf = this.typeFilter();
    this.orderService.listAll({
      statuses,
      deliveryDate: this.deliveryDate() || undefined,
      type: tf === 'ALL' ? undefined : tf,
      customerId: this.customerId() || undefined,
      search: this.searchTerm().trim() || undefined,
      page: 0,
      size: 100,
    }).subscribe({
      next: (data) => {
        this.orders.set(data.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los pedidos.');
        this.loading.set(false);
      }
    });
  }

  setStatusFilter(filter: SimpleStatusFilter): void {
    this.selectedStatusFilter.set(filter);
    this.load();
  }

  setType(t: 'ALL' | OrderType): void {
    this.typeFilter.set(t);
    this.load();
  }

  clearFilters(): void {
    this.selectedStatusFilter.set('ALL');
    this.deliveryDate.set('');
    this.customerId.set('');
    this.searchTerm.set('');
    this.typeFilter.set('ALL');
    this.load();
  }

  typeBadgeLabel(t: OrderType): string {
    return ORDER_TYPE_SHORT_LABELS[t] ?? t;
  }

  typeBadgeVariant(t: OrderType): 'active' | 'info' | 'warning' | 'inactive' | 'neutral' | 'accent' {
    return t === 'WHOLESALE' ? 'info' : 'accent';
  }

  trackByType(_i: number, t: { key: string }): string {
    return t.key;
  }

  trackByTypeOpt(_i: number, t: { key: 'ALL' | OrderType }): 'ALL' | OrderType {
    return t.key;
  }

  view(order: Order): void {
    if (!order.id) return;
    this.router.navigate(['/distribuidor/pedidos', order.id]);
  }

  statusLabel(s: OrderStatus): string {
    if (s === 'ENTREGADO') return 'Entregado';
    if (s === 'CANCELADO') return 'Cancelado';
    return 'Pendiente';
  }

  statusVariant(s: OrderStatus): 'warning' | 'info' | 'active' | 'inactive' | 'neutral' {
    switch (s) {
      case 'ENTREGADO': return 'active';
      case 'CANCELADO': return 'inactive';
      default: return 'warning';
    }
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

  shortId(id?: string): string {
    return id ? id.slice(0, 8).toUpperCase() : '—';
  }

  trackById(_i: number, o: Order): string | undefined {
    return o.id;
  }

  hasActiveFilters(): boolean {
    return this.selectedStatusFilter() !== 'ALL'
      || !!this.deliveryDate()
      || !!this.customerId()
      || !!this.searchTerm()
      || this.typeFilter() !== 'ALL';
  }

  markAsDelivered(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    if (!order.id || this.actionLoadingOrderId() === order.id) return;
    const orderId = order.id;
    this.actionLoadingOrderId.set(orderId);

    const isRetiro = order.deliveryMethodName?.toLowerCase().includes('retiro') ?? false;
    const steps: OrderStatus[] = [];

    if (order.status === 'PENDIENTE') {
      if (isRetiro) {
        steps.push('ARMADO', 'ENTREGADO');
      } else {
        steps.push('ARMADO', 'ENVIADO', 'ENTREGADO');
      }
    } else if (order.status === 'ARMADO') {
      if (isRetiro) {
        steps.push('ENTREGADO');
      } else {
        steps.push('ENVIADO', 'ENTREGADO');
      }
    } else if (order.status === 'ENVIADO') {
      steps.push('ENTREGADO');
    }

    if (steps.length === 0) {
      this.actionLoadingOrderId.set(null);
      return;
    }

    this.executeTransitionSteps(orderId, steps, 0);
  }

  private executeTransitionSteps(orderId: string, steps: OrderStatus[], index: number): void {
    if (index >= steps.length) {
      this.actionLoadingOrderId.set(null);
      this.orders.update(list => list.map(o => o.id === orderId ? { ...o, status: 'ENTREGADO' } : o));
      this.cdr.markForCheck();
      return;
    }

    const targetStatus = steps[index];
    this.orderService.transitionStatus(orderId, { targetStatus }).subscribe({
      next: (updatedOrder) => {
        this.orders.update(list => list.map(o => o.id === orderId ? { ...o, status: updatedOrder.status } : o));
        this.executeTransitionSteps(orderId, steps, index + 1);
      },
      error: (err) => {
        console.error(`Error al pasar a ${targetStatus}:`, err);
        this.actionLoadingOrderId.set(null);
        alert('No se pudo completar el cambio a Entregado.');
      }
    });
  }

  canDownloadRemito(order: Order): boolean {
    return true;
  }

  downloadRemito(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    if (!order.id || this.downloadingRemitoOrderId() === order.id) return;
    const orderId = order.id;
    this.downloadingRemitoOrderId.set(orderId);

    this.deliveryNoteService.listByOrder(orderId).subscribe({
      next: (res) => {
        if (res.content && res.content.length > 0) {
          const remito = res.content[0];
          if (remito.id) {
            this.performDownload(remito.id, remito.deliveryNoteNumber ?? orderId);
          } else {
            this.downloadingRemitoOrderId.set(null);
          }
        } else {
          this.ensureArmadoAndGenerateRemito(order, orderId);
        }
      },
      error: () => {
        this.ensureArmadoAndGenerateRemito(order, orderId);
      }
    });
  }

  private ensureArmadoAndGenerateRemito(order: Order, orderId: string): void {
    if (order.status === 'PENDIENTE') {
      this.orderService.transitionStatus(orderId, { targetStatus: 'ARMADO' }).subscribe({
        next: (updated) => {
          this.orders.update(list => list.map(o => o.id === orderId ? { ...o, status: updated.status } : o));
          this.generateAndDownloadRemito(orderId);
        },
        error: (err) => {
          console.error('Error al armar pedido para remito:', err);
          this.downloadingRemitoOrderId.set(null);
          alert('No se pudo armar el pedido para generar remito.');
        }
      });
    } else {
      this.generateAndDownloadRemito(orderId);
    }
  }

  private generateAndDownloadRemito(orderId: string): void {
    this.deliveryNoteService.generateFromOrder(orderId).subscribe({
      next: (newRemito) => {
        if (newRemito.id) {
          this.performDownload(newRemito.id, newRemito.deliveryNoteNumber ?? orderId);
        } else {
          this.downloadingRemitoOrderId.set(null);
        }
      },
      error: (err) => {
        console.error('Error al generar remito:', err);
        this.downloadingRemitoOrderId.set(null);
        alert('No se pudo generar el remito para este pedido.');
      }
    });
  }

  private performDownload(remitoId: string, number: string): void {
    this.deliveryNoteService.download(remitoId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remito-${number}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingRemitoOrderId.set(null);
      },
      error: (err) => {
        console.error('Error al descargar remito:', err);
        this.downloadingRemitoOrderId.set(null);
        alert('No se pudo descargar el archivo del remito.');
      }
    });
  }
}
