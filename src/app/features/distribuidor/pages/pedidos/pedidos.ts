import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { DistributorCustomerService } from '../../../../services/distributor-customer.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS } from '../../../../models/order.model';
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

  searchTerm = signal('');
  activeStatuses = signal<OrderStatus[]>([]);
  deliveryDate = signal<string>('');
  customerId = signal<string>('');

  customers = signal<CustomerSummary[]>([]);

  statusOptions: { key: OrderStatus; label: string }[] = [
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'ARMADO', label: 'Armados' },
    { key: 'ENVIADO', label: 'Enviados' },
    { key: 'ENTREGADO', label: 'Entregados' },
    { key: 'CANCELADO', label: 'Cancelados' },
  ];

  constructor(
    private orderService: OrderService,
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
    this.orderService.listAll({
      statuses: this.activeStatuses().length > 0 ? this.activeStatuses() : undefined,
      deliveryDate: this.deliveryDate() || undefined,
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

  clearFilters(): void {
    this.activeStatuses.set([]);
    this.deliveryDate.set('');
    this.customerId.set('');
    this.searchTerm.set('');
    this.load();
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
      case 'ARMADO': return 'info';
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
    return this.activeStatuses().length > 0 || !!this.deliveryDate() || !!this.customerId() || !!this.searchTerm();
  }
}
