import { Component, OnInit, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDeliveryMethodService, DeliveryMethod, CreateDeliveryMethodRequest } from '../../../../services/admin-delivery-method.service';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-admin-metodos-entrega',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './metodos-entrega.html',
  styleUrl: './metodos-entrega.css',
})
export class AdminMetodosEntregaComponent implements OnInit {
  private service = inject(AdminDeliveryMethodService);

  methods = signal<DeliveryMethod[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showInactive = signal(false);
  filter = signal('');

  filtered = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const all = this.methods();
    if (!term) return all;
    return all.filter(m => m.name.toLowerCase().includes(term));
  });

  showCreate = signal(false);
  saving = signal(false);
  createError = signal<string | null>(null);
  newMethod = signal<CreateDeliveryMethodRequest>(this.empty());

  showEdit = signal(false);
  editSaving = signal(false);
  editError = signal<string | null>(null);
  editMethod = signal<DeliveryMethod | null>(null);
  editForm = signal<CreateDeliveryMethodRequest>(this.empty());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list(this.showInactive() ? undefined : true).subscribe({
      next: (data) => {
        this.methods.set(data.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los métodos de entrega.');
        this.loading.set(false);
      }
    });
  }

  toggleShowInactive(): void {
    this.showInactive.update(v => !v);
    this.load();
  }

  openCreate(): void {
    this.newMethod.set(this.empty());
    this.createError.set(null);
    this.showCreate.set(true);
  }

  closeCreate(): void {
    if (!this.saving()) this.showCreate.set(false);
  }

  submitCreate(): void {
    if (!this.newMethod().name.trim()) {
      this.createError.set('El nombre es obligatorio.');
      return;
    }
    if (this.newMethod().cost < 0) {
      this.createError.set('El costo no puede ser negativo.');
      return;
    }
    if (this.newMethod().estimatedDays < 0) {
      this.createError.set('Los días estimados no pueden ser negativos.');
      return;
    }
    this.saving.set(true);
    this.createError.set(null);
    this.service.create(this.newMethod()).subscribe({
      next: (created) => {
        this.methods.update(list => [created, ...list]);
        this.saving.set(false);
        this.showCreate.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.createError.set(err?.error?.detail || 'No se pudo crear el método.');
      }
    });
  }

  openEdit(m: DeliveryMethod): void {
    this.editMethod.set(m);
    this.editForm.set({
      name: m.name,
      cost: m.cost,
      estimatedDays: m.estimatedDays ?? 0,
    });
    this.editError.set(null);
    this.showEdit.set(true);
  }

  closeEdit(): void {
    if (!this.editSaving()) this.showEdit.set(false);
  }

  submitEdit(): void {
    const m = this.editMethod();
    if (!m?.id) return;
    this.editSaving.set(true);
    this.editError.set(null);
    this.service.update(m.id, this.editForm()).subscribe({
      next: (updated) => {
        this.methods.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editSaving.set(false);
        this.showEdit.set(false);
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editError.set(err?.error?.detail || 'No se pudo actualizar.');
      }
    });
  }

  toggleActive(m: DeliveryMethod): void {
    if (m.active) {
      this.service.deactivate(m.id).subscribe({
        next: () => this.methods.update(list => list.map(x => x.id === m.id ? { ...x, active: false } : x)),
      });
    } else {
      this.service.activate(m.id).subscribe({
        next: (updated) => this.methods.update(list => list.map(x => x.id === m.id ? updated : x)),
      });
    }
  }

  formatPrice(v: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);
  }

  trackById(_i: number, m: DeliveryMethod): string { return m.id; }

  private empty(): CreateDeliveryMethodRequest {
    return { name: '', cost: 0, estimatedDays: 1 };
  }
}
