import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeliveryNoteService } from '../../../../services/delivery-note.service';
import { DeliveryNote, DeliveryNoteStatus, DELIVERY_NOTE_STATUS_LABELS, DELIVERY_NOTE_STATUS_VARIANTS, nextDeliveryNoteStatusOptions } from '../../../../models/delivery-note.model';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-remito-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BadgeComponent, ButtonComponent],
  templateUrl: './remito-detalle.html',
  styleUrl: './remito-detalle.css',
})
export class RemitoDetalleComponent implements OnInit {
  remito = signal<DeliveryNote | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  downloading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryNoteService: DeliveryNoteService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.deliveryNoteService.get(id).subscribe({
      next: (r) => {
        this.remito.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el remito.');
        this.loading.set(false);
      }
    });
  }

  statusLabel(s: DeliveryNoteStatus): string {
    return DELIVERY_NOTE_STATUS_LABELS[s];
  }

  statusVariant(s: DeliveryNoteStatus): 'warning' | 'info' | 'active' | 'inactive' | 'neutral' {
    return DELIVERY_NOTE_STATUS_VARIANTS[s];
  }

  nextOptions(): DeliveryNoteStatus[] {
    const r = this.remito();
    if (!r) return [];
    return nextDeliveryNoteStatusOptions(r.status);
  }

  canTransition(): boolean {
    return this.nextOptions().length > 0;
  }

  openTransition(): void {
    const r = this.remito();
    if (r?.id) {
      this.router.navigate(['./', r.id, 'transicion'], { relativeTo: this.router.routerState.root });
    }
  }

  download(): void {
    const r = this.remito();
    if (!r?.id) return;

    this.downloading.set(true);
    this.deliveryNoteService.download(r.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remito-${r.deliveryNoteNumber}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => {
        this.error.set('No se pudo descargar el remito.');
        this.downloading.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  }

  totalItems(): number {
    return this.remito()?.items?.length ?? 0;
  }

  totalAmount(): number {
    return (this.remito()?.items ?? []).reduce((sum, item) => sum + item.unitPrice * item.quantityDelivered, 0);
  }
}
