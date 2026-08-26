import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
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

@Component({
  selector: 'app-distribuidor-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class DistribuidorPedidosComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  actionLoadingOrderId = signal<string | null>(null);
  downloadingRemitoOrderId = signal<string | null>(null);

  searchTerm = signal('');
  activeStatuses = signal<OrderStatus[]>([]);
  deliveryDate = signal<string>('');
  customerId = signal<string>('');
  typeFilter = signal<'ALL' | OrderType>('ALL');

  customers = signal<CustomerSummary[]>([]);

  statusOptions: { key: OrderStatus; label: string }[] = [
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'ARMADO', label: 'Armados' },
    { key: 'ENVIADO', label: 'Enviados' },
    { key: 'ENTREGADO', label: 'Entregados' },
    { key: 'CANCELADO', label: 'Cancelados' },
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
    const tf = this.typeFilter();
    this.orderService.listAll({
      statuses: this.activeStatuses().length > 0 ? this.activeStatuses() : undefined,
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

  toggleStatus(s: OrderStatus): void {
    this.activeStatuses.update(list => list.includes(s) ? list.filter(x => x !== s) : [...list, s]);
    this.load();
  }

  isStatusActive(s: OrderStatus): boolean {
    return this.activeStatuses().includes(s);
  }

  setType(t: 'ALL' | OrderType): void {
    this.typeFilter.set(t);
    this.load();
  }

  clearFilters(): void {
    this.activeStatuses.set([]);
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
    return ORDER_STATUS_LABELS[s];
  }

  statusVariant(s: OrderStatus): 'warning' | 'info' | 'active' | 'inactive' | 'neutral' {
    switch (s) {
      case 'PENDIENTE': return 'warning';
      case 'ARMADO': return 'warning';
      case 'ENVIADO': return 'info';
      case 'ENTREGADO': return 'active';
      case 'CANCELADO': return 'inactive';
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
    return this.activeStatuses().length > 0
      || !!this.deliveryDate()
      || !!this.customerId()
      || !!this.searchTerm()
      || this.typeFilter() !== 'ALL';
  }

  transitionOrder(order: Order, targetStatus: OrderStatus, event: MouseEvent): void {
    event.stopPropagation();
    if (!order.id || this.actionLoadingOrderId() === order.id) return;
    const orderId = order.id;
    this.actionLoadingOrderId.set(orderId);

    this.orderService.transitionStatus(orderId, { targetStatus }).subscribe({
      next: (updatedOrder) => {
        this.orders.update(list => list.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
        this.actionLoadingOrderId.set(null);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cambiar estado del pedido:', err);
        this.actionLoadingOrderId.set(null);
        alert('No se pudo actualizar el estado del pedido.');
      }
    });
  }

  canDownloadRemito(order: Order): boolean {
    return order.type === 'WHOLESALE' && ['ARMADO', 'ENVIADO', 'ENTREGADO'].includes(order.status);
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
            this.performDownload(remito.id, remito.deliveryNoteNumber ?? orderId, orderId);
          } else {
            this.downloadingRemitoOrderId.set(null);
          }
        } else if (order.status === 'ARMADO' && order.type === 'WHOLESALE') {
          this.deliveryNoteService.generateFromOrder(orderId).subscribe({
            next: (newRemito) => {
              if (newRemito.id) {
                this.performDownload(newRemito.id, newRemito.deliveryNoteNumber ?? orderId, orderId);
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
        } else {
          this.downloadingRemitoOrderId.set(null);
          alert('No hay un remito generado para este pedido.');
        }
      },
      error: (err) => {
        console.error('Error al buscar remito:', err);
        this.downloadingRemitoOrderId.set(null);
        alert('Error al obtener remito.');
      }
    });
  }

  private performDownload(remitoId: string, number: string, _orderId: string): void {
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
