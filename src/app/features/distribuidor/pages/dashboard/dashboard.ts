import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS } from '../../../../models/order.model';

@Component({
  selector: 'app-distribuidor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DistribuidorDashboardComponent implements OnInit {
  pendingCount = signal(0);
  armadoCount = signal(0);
  enviadoCount = signal(0);
  todayDeliveryCount = signal(0);

  recentPending = signal<Order[]>([]);
  loading = signal(false);

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loading.set(true);
    const today = new Date().toISOString().slice(0, 10);
    this.orderService.listAll({ statuses: ['PENDIENTE'], page: 0, size: 5 }).subscribe({
      next: (data) => {
        this.pendingCount.set(data.totalElements);
        this.recentPending.set(data.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.orderService.listAll({ statuses: ['ARMADO'], page: 0, size: 1 }).subscribe({
      next: (data) => this.armadoCount.set(data.totalElements),
      error: () => {},
    });
    this.orderService.listAll({ statuses: ['ENVIADO'], page: 0, size: 1 }).subscribe({
      next: (data) => this.enviadoCount.set(data.totalElements),
      error: () => {},
    });
    this.orderService.listAll({ deliveryDate: today, page: 0, size: 1 }).subscribe({
      next: (data) => this.todayDeliveryCount.set(data.totalElements),
      error: () => {},
    });
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
}
