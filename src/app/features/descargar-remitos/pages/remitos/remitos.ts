import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryNoteService } from '../../../../services/delivery-note.service';
import { DeliveryNote, DeliveryNoteStatus, DELIVERY_NOTE_STATUS_LABELS, DELIVERY_NOTE_STATUS_VARIANTS, nextDeliveryNoteStatusOptions } from '../../../../models/delivery-note.model';
import { PageResponse } from '../../../../models/order.model';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-remitos',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './remitos.html',
  styleUrl: './remitos.css',
})
export class RemitosComponent implements OnInit {
  remitos = signal<DeliveryNote[]>([]);
  loading = false;
  error: string | null = null;
  searchTerm = signal('');
  statusFilter = signal<DeliveryNoteStatus | ''>('');

  currentPage = signal(1);
  pageSize = signal(20);
  totalElements = computed(() => this.filteredRemitos().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRemitos().length / this.pageSize())));

  filteredRemitos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.remitos().filter(r => {
      if (status && r.status !== status) return false;
      if (!term) return true;
      return (r.deliveryNoteNumber ?? '').toLowerCase().includes(term)
        || (r.id ?? '').toLowerCase().includes(term)
        || (r.orderId ?? '').toLowerCase().includes(term);
    });
  });

  paginatedRemitos = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredRemitos().slice(start, start + this.pageSize());
  });

  statusLabels = DELIVERY_NOTE_STATUS_LABELS;
  statusVariants = DELIVERY_NOTE_STATUS_VARIANTS;
  statusOptions: DeliveryNoteStatus[] = ['PENDING', 'GENERATED', 'DELIVERED', 'CANCELED'];

  constructor(
    private deliveryNoteService: DeliveryNoteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRemitos();
  }

  loadRemitos(): void {
    this.loading = true;
    this.error = null;
    this.deliveryNoteService.list({ page: 0, size: 200 }).subscribe({
      next: (data) => {
        this.remitos.set(data.content);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar remitos:', err);
        this.error = 'No se pudieron cargar los remitos.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
  }

  onStatusFilter(): void {
    this.currentPage.set(1);
  }

  openDetail(remito: DeliveryNote): void {
    this.router.navigate(['./', remito.id], { relativeTo: this.router.routerState.root });
  }

  download(remito: DeliveryNote): void {
    if (!remito.id) return;
    this.deliveryNoteService.download(remito.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remito-${remito.deliveryNoteNumber}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar remito:', err);
        alert('No se pudo descargar el remito.');
      }
    });
  }

  openTransition(remito: DeliveryNote): void {
    this.router.navigate(['./', remito.id, 'transicion'], { relativeTo: this.router.routerState.root });
  }

  canTransition(remito: DeliveryNote): boolean {
    return nextDeliveryNoteStatusOptions(remito.status).length > 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  }

  prevPage(): void {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }
}
