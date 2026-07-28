import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS } from '../../../../models/order.model';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
})
export class MisPedidosComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<OrderStatus | 'ALL'>('ALL');

  tabs: { key: OrderStatus | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'ARMADO', label: 'Armados' },
    { key: 'ENVIADO', label: 'Enviados' },
    { key: 'ENTREGADO', label: 'Entregados' },
    { key: 'CANCELADO', label: 'Cancelados' },
  ];

  filteredOrders = computed(() => {
    const t = this.activeTab();
    if (t === 'ALL') return this.orders();
    return this.orders().filter(o => o.status === t);
  });

  constructor(
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.listMine(0, 100).subscribe({
      next: (data) => {
        this.orders.set(data.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus pedidos.');
        this.loading.set(false);
      }
    });
  }

  view(order: Order): void {
    if (!order.id) return;
    this.router.navigate(['/cliente/mis-pedidos', order.id]);
  }

  goToCatalog(): void {
    this.router.navigate(['/cliente/catalogo']);
  }

  statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }

  statusVariant(status: OrderStatus): 'warning' | 'info' | 'active' | 'inactive' | 'neutral' {
    switch (status) {
      case 'PENDIENTE': return 'warning';
      case 'ARMADO': return 'info';
      case 'ENVIADO': return 'info';
      case 'ENTREGADO': return 'active';
      case 'CANCELADO': return 'inactive';
    }
  }

  /**
   * Clases para el badge de conteo de cada tab.
   * Solo se usan colores semánticos cuando el estado lo amerita:
   * - PENDIENTE  → orange (acción pendiente)
   * - ENTREGADO  → verde (éxito del sistema)
   * - CANCELADO  → rojo (estado terminal negativo)
   * - Resto     → neutral (ARMADO, ENVIADO son estados intermedios, no de éxito/error)
   */
  badgeClass(key: OrderStatus | 'ALL'): string {
    switch (key) {
      case 'PENDIENTE': return 'tab-badge--pending';
      case 'ENTREGADO': return 'tab-badge--success';
      case 'CANCELADO': return 'tab-badge--cancelled';
      default: return 'tab-badge--neutral';
    }
  }

  /**
   * El tab activo usa el mismo border-bottom naranja que el catálogo,
   * para consistencia del indicador de "sección seleccionada".
   */
  tabClass(key: OrderStatus | 'ALL'): string {
    return '';
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  shortId(id?: string): string {
    return id ? id.slice(0, 8).toUpperCase() : '—';
  }

  formatDate(s?: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  countByStatus(status: OrderStatus): number {
    return this.orders().filter(o => o.status === status).length;
  }

  trackById(_i: number, o: Order): string | undefined {
    return o.id;
  }
}
