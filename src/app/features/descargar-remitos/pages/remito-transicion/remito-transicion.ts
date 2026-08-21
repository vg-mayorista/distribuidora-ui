import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeliveryNoteService } from '../../../../services/delivery-note.service';
import { DeliveryNote, DeliveryNoteStatus, DELIVERY_NOTE_STATUS_LABELS, DELIVERY_NOTE_STATUS_VARIANTS, nextDeliveryNoteStatusOptions } from '../../../../models/delivery-note.model';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-remito-transicion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BadgeComponent, ButtonComponent],
  templateUrl: './remito-transicion.html',
  styleUrl: './remito-transicion.css',
})
export class RemitoTransicionComponent implements OnInit {
  remito = signal<DeliveryNote | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  targetStatus: DeliveryNoteStatus | '' = '';
  notes = '';

  statusLabels = DELIVERY_NOTE_STATUS_LABELS;
  statusVariants = DELIVERY_NOTE_STATUS_VARIANTS;

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
        this.targetStatus = '';
        this.notes = '';
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el remito.');
        this.loading.set(false);
      }
    });
  }

  nextOptions(): DeliveryNoteStatus[] {
    const r = this.remito();
    if (!r) return [];
    return nextDeliveryNoteStatusOptions(r.status);
  }

  statusLabel(s: DeliveryNoteStatus): string {
    return this.statusLabels[s];
  }

  statusVariant(s: DeliveryNoteStatus): 'warning' | 'info' | 'active' | 'inactive' | 'neutral' {
    return this.statusVariants[s];
  }

  onSubmit(): void {
    const r = this.remito();
    if (!r || !this.targetStatus || !r.id) return;

    this.saving.set(true);
    this.error.set(null);
    this.deliveryNoteService.transitionStatus(r.id, { targetStatus: this.targetStatus, notes: this.notes || undefined }).subscribe({
      next: () => {
        this.success.set(true);
        this.saving.set(false);
        setTimeout(() => {
          this.router.navigate(['..', r!.id], { relativeTo: this.router.routerState.root });
        }, 1200);
      },
      error: () => {
        this.error.set('No se pudo actualizar el estado del remito.');
        this.saving.set(false);
      }
    });
  }
}
