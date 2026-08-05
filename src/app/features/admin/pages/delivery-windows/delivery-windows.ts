import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDeliveryWindowService, CreateDeliveryWindowRequest, UpdateDeliveryWindowRequest } from '../../../../services/admin-delivery-window.service';
import { DeliveryWindow } from '../../../../models/delivery-window.model';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

const DOW_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

@Component({
  selector: 'app-admin-delivery-windows',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, BadgeComponent, EmptyStateComponent],
  templateUrl: './delivery-windows.html',
  styleUrl: './delivery-windows.css',
})
export class AdminDeliveryWindowsComponent implements OnInit {
  private service = inject(AdminDeliveryWindowService);

  windows = signal<DeliveryWindow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showCreate = signal(false);
  saving = signal(false);
  createError = signal<string | null>(null);
  newWindow = signal<CreateDeliveryWindowRequest>(this.empty());

  showEdit = signal(false);
  editSaving = signal(false);
  editError = signal<string | null>(null);
  editing = signal<DeliveryWindow | null>(null);
  editForm = signal<UpdateDeliveryWindowRequest>(this.empty());

  showDelete = signal(false);
  deleting = signal(false);
  toDelete = signal<DeliveryWindow | null>(null);

  dowLabels = DOW_LABELS;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (data) => {
        this.windows.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ventanas de entrega.');
        this.loading.set(false);
      }
    });
  }

  openCreate(): void {
    this.newWindow.set(this.empty());
    this.createError.set(null);
    this.showCreate.set(true);
  }

  closeCreate(): void {
    if (!this.saving()) this.showCreate.set(false);
  }

  submitCreate(): void {
    const w = this.newWindow();
    if (!w.cutoffTime || !w.description) {
      this.createError.set('Todos los campos son obligatorios.');
      return;
    }
    this.saving.set(true);
    this.createError.set(null);
    this.service.create(w).subscribe({
      next: (created) => {
        this.windows.update(list => [...list, created].sort((a, b) => a.cutoffDayOfWeek - b.cutoffDayOfWeek));
        this.saving.set(false);
        this.showCreate.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.createError.set(err?.error?.detail || 'No se pudo crear la ventana.');
      }
    });
  }

  openEdit(w: DeliveryWindow): void {
    this.editing.set(w);
    this.editForm.set({
      cutoffDayOfWeek: w.cutoffDayOfWeek,
      cutoffTime: w.cutoffTime,
      deliveryDayOfWeek: w.deliveryDayOfWeek,
      description: w.description ?? '',
      active: w.active,
    });
    this.editError.set(null);
    this.showEdit.set(true);
  }

  closeEdit(): void {
    if (!this.editSaving()) this.showEdit.set(false);
  }

  submitEdit(): void {
    const w = this.editing();
    if (!w?.id) return;
    this.editSaving.set(true);
    this.editError.set(null);
    this.service.update(w.id, this.editForm()).subscribe({
      next: (updated) => {
        this.windows.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editSaving.set(false);
        this.showEdit.set(false);
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editError.set(err?.error?.detail || 'No se pudo actualizar la ventana.');
      }
    });
  }

  openDelete(w: DeliveryWindow): void {
    this.toDelete.set(w);
    this.showDelete.set(true);
  }

  closeDelete(): void {
    if (!this.deleting()) this.showDelete.set(false);
  }

  confirmDelete(): void {
    const w = this.toDelete();
    if (!w?.id) return;
    this.deleting.set(true);
    this.service.delete(w.id).subscribe({
      next: () => {
        this.windows.update(list => list.filter(x => x.id !== w.id));
        this.deleting.set(false);
        this.showDelete.set(false);
      },
      error: (err) => {
        this.deleting.set(false);
        this.error.set(err?.error?.detail || 'No se pudo eliminar la ventana.');
      }
    });
  }

  toggleActive(w: DeliveryWindow): void {
    this.service.update(w.id, { active: !w.active }).subscribe({
      next: (updated) => {
        this.windows.update(list => list.map(x => x.id === updated.id ? updated : x));
      },
      error: (err) => this.error.set(err?.error?.detail || 'No se pudo cambiar el estado.')
    });
  }

  dowLabel(n?: number): string {
    if (n == null) return '—';
    return DOW_LABELS[(n - 1) % 7] ?? `DOW ${n}`;
  }

  trackById(_i: number, w: DeliveryWindow): string | undefined {
    return w.id;
  }

  private empty<T>(): T {
    return ({
      cutoffDayOfWeek: 2,
      cutoffTime: '18:00',
      deliveryDayOfWeek: 3,
      description: '',
      active: true,
    } as unknown) as T;
  }
}
