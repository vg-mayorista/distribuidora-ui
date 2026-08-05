import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS } from '../../../../models/order.model';
import { OrderType, ORDER_TYPE_SHORT_LABELS } from '../../../../models/order-type.model';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = false;
  error: string | null = null;
  searchTerm = signal('');

  currentPage = signal(1);
  pageSize = signal(6);
  totalElements = computed(() => this.filteredOrders().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredOrders().length / this.pageSize())));

  selectedOrder = signal<Order | null>(null);

  filteredOrders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.orders().filter(o => {
      if (!term) return true;
      return (o.id ?? '').toLowerCase().includes(term)
        || (o.customerName ?? '').toLowerCase().includes(term);
    });
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredOrders().slice(start, start + this.pageSize());
  });

  constructor(
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;
    this.orderService.listAll({ page: 0, size: 200 }).subscribe({
      next: (data) => {
        this.orders.set(data.content);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ordenes:', err);
        this.error = 'No se pudieron cargar los pedidos.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
  }

  openViewModal(order: Order): void {
    this.selectedOrder.set(order);
  }

  closeViewModal(): void {
    this.selectedOrder.set(null);
  }

  shortId(id?: string): string {
    return id ? id.slice(0, 8).toUpperCase() : '—';
  }

  statusLabel(s: OrderStatus): string {
    return ORDER_STATUS_LABELS[s];
  }

  statusVariant(s: OrderStatus) {
    return ORDER_STATUS_VARIANTS[s];
  }

  typeBadgeLabel(t: OrderType): string {
    return ORDER_TYPE_SHORT_LABELS[t] ?? t;
  }

  typeBadgeVariant(t: OrderType): 'active' | 'info' | 'warning' | 'inactive' | 'neutral' {
    return t === 'WHOLESALE' ? 'info' : 'active';
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  formatDate(s?: string): string {
    if (!s) return '—';
    const parts = s.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  trackById(_i: number, o: Order): string | undefined { return o.id; }
}
