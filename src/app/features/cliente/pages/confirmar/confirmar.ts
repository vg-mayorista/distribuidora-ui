import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartStore } from '../../services/cart.store';
import { DeliveryMethodService, DeliveryMethodSummary } from '../../../../services/delivery-method.service';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { BusinessConfigService } from '../../../../services/business-config.service';
import { DeliveryWindow } from '../../../../models/delivery-window.model';
import { ButtonComponent } from '../../../../shared/ui/button/button';

type FlowMode = 'wholesale' | 'stock';

@Component({
  selector: 'app-confirmar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './confirmar.html',
  styleUrl: './confirmar.css',
})
export class ConfirmarComponent implements OnInit {
  private cart = inject(CartStore);
  private deliveryMethodService = inject(DeliveryMethodService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private configService = inject(BusinessConfigService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode: FlowMode = 'wholesale';
  cartStore = this.cart;
  lines = this.cart.lines;
  stockLines = this.cart.stockLines;
  subtotal = this.cart.subtotal;
  stockSubtotal = this.cart.stockSubtotal;
  count = this.cart.count;
  stockCount = this.cart.stockCount;

  allDeliveryMethods = signal<DeliveryMethodSummary[]>([]);
  selectedDeliveryMethodId = signal<string>('');
  deliveryAddress = signal('');
  deliveryPhone = signal('');
  notes = signal('');
  deliveryDate = signal<string>('');
  hasSavedAddress = signal(false);

  loading = signal(false);
  error = signal<string | null>(null);

  selectedDeliveryMethod = signal<DeliveryMethodSummary | null>(null);
  deliveryWindows = computed<DeliveryWindow[]>(() => this.configService.config()?.deliveryWindows ?? []);

  /** Para wholesale: próximas 2 fechas; para stock: vacío. */
  availableDeliveryDates = computed<{ date: string; label: string }[]>(() => {
    if (this.mode !== 'wholesale') return [];
    const wins = this.deliveryWindows();
    if (wins.length === 0) return [];
    const dates: { date: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let cursor = new Date(today.getTime() - 24 * 3600 * 1000);
    while (dates.length < 2 && (cursor.getTime() - today.getTime()) < 1000 * 3600 * 24 * 14) {
      cursor = new Date(cursor.getTime() + 24 * 3600 * 1000);
      const dow = ((cursor.getDay() + 6) % 7) + 1; // ISO 1..7, lunes..domingo
      const matching = wins.filter(w => w.deliveryDayOfWeek === dow);
      if (matching.length === 0) continue;
      const cuts = matching
        .map(w => this.windowCutoff(cursor, w))
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime());
      const cutoff = cuts[0];
      if (!cutoff || cutoff.getTime() <= Date.now()) continue;
      const iso = cursor.toISOString().slice(0, 10);
      dates.push({
        date: iso,
        label: this.formatHumanDate(iso),
      });
    }
    return dates;
  });

  /**
   * Métodos de entrega disponibles para el flujo actual.
   *  - wholesale: solo scope WHOLESALE o BOTH (oculta Express).
   *  - stock:     solo scope STOCK o BOTH.
   */
  availableDeliveryMethods = computed<DeliveryMethodSummary[]>(() => {
    const allowed: Record<FlowMode, string[]> = {
      wholesale: ['WHOLESALE', 'BOTH'],
      stock: ['STOCK', 'BOTH'],
    };
    return this.allDeliveryMethods().filter(m =>
      !m.appliesToOrderType || allowed[this.mode].includes(m.appliesToOrderType)
    );
  });

  ngOnInit(): void {
    const fromData = (this.route.snapshot.data?.['mode'] ?? '').toString().toLowerCase();
    if (fromData === 'stock') {
      this.mode = 'stock';
    } else {
      // Por defecto, inferir desde el carrito: si el stockCart tiene líneas -> stock; sino wholesale.
      const hasStock = this.cart.stockLines().length > 0;
      this.mode = hasStock ? 'stock' : 'wholesale';
    }
    this.configService.loadConfig();

    this.deliveryMethodService.listActive().subscribe({
      next: (methods) => {
        this.allDeliveryMethods.set(methods);
        const avail = this.availableDeliveryMethods();
        const def = avail.find(m => m.name.toLowerCase().includes('retiro'))
          ?? avail.find(m => m.name.toLowerCase().includes('domicilio'))
          ?? avail[0];
        if (def) {
          this.selectedDeliveryMethodId.set(def.id);
          this.selectedDeliveryMethod.set(def);
        }
        this.syncEditingOrderDeliveryMethod();
      },
      error: () => this.error.set('No se pudieron cargar los métodos de entrega.'),
    });

    this.orderService.listMine(0, 5).subscribe({
      next: (ordersPage) => {
        const editingId = this.cart.editingOrderId();
        let target = editingId ? ordersPage.content.find(o => o.id === editingId) : null;
        if (!target) {
          target = ordersPage.content.find(o => o.deliveryAddress && o.deliveryAddress.trim());
        }
        if (target) {
          if (target.deliveryAddress) {
            this.hasSavedAddress.set(true);
            this.deliveryAddress.set(target.deliveryAddress);
          }
          if (target.deliveryPhone) {
            this.deliveryPhone.set(this.formatPhoneNumber(target.deliveryPhone));
          }
        }
      }
    });

    const editingId = this.cart.editingOrderId();
    if (editingId) {
      this.orderService.getMine(editingId).subscribe({
        next: (o) => {
          if (o && !o.editable) {
            this.cart.setEditingOrderId(null);
            this.error.set('El pedido que estabas modificando ya fue procesado y no se puede editar. Se procederá a confirmar como un pedido nuevo.');
          }
        },
        error: () => {
          this.cart.setEditingOrderId(null);
        }
      });
    }
  }

  private syncEditingOrderDeliveryMethod(): void {
    const editingId = this.cart.editingOrderId();
    if (!editingId) return;
    this.orderService.getMine(editingId).subscribe({
      next: (o) => {
        if (o?.deliveryMethodId) {
          const match = this.availableDeliveryMethods().find(m => m.id === o.deliveryMethodId);
          if (match) {
            this.selectedDeliveryMethodId.set(match.id);
            this.selectedDeliveryMethod.set(match);
          }
        }
      }
    });
  }

  selectDeliveryMethod(method: DeliveryMethodSummary): void {
    this.selectedDeliveryMethodId.set(method.id);
    this.selectedDeliveryMethod.set(method);
  }

  get requiresAddress(): boolean {
    const name = (this.selectedDeliveryMethod()?.name ?? '').toLowerCase();
    return !name.includes('retiro') && !name.includes('local');
  }

  minPacksPerLine(): number {
    return this.configService.config()?.minPacksPerLine ?? 5;
  }

  minOrderAmount(): number {
    return this.configService.config()?.minOrderAmount ?? 30000;
  }

  hasLinesBelowMin(): boolean {
    const min = this.minPacksPerLine();
    return this.activeLines().some(l => l.packs < min);
  }

  amountBelowMin(): boolean {
    return this.activeSubtotal() < this.minOrderAmount();
  }

  get canSubmit(): boolean {
    if (!this.selectedDeliveryMethodId()) return false;
    if (this.activeLines().length === 0) return false;
    if (this.requiresAddress && (!this.deliveryAddress().trim() || !this.deliveryPhone().trim())) return false;
    if (this.mode === 'wholesale' && !this.deliveryDate()) return false;
    if (this.hasLinesBelowMin()) return false;
    if (this.amountBelowMin()) return false;
    return true;
  }

  get validationErrorMessage(): string | null {
    if (this.activeLines().length === 0) {
      return this.mode === 'stock'
        ? 'Tu carrito de stock está vacío.'
        : 'Tu carrito mayorista está vacío.';
    }
    if (this.amountBelowMin()) {
      const falta = this.formatPrice(this.minOrderAmount() - this.activeSubtotal());
      return `El subtotal debe ser al menos $${this.formatPrice(this.minOrderAmount())}. Te faltan ${falta}.`;
    }
    if (this.hasLinesBelowMin()) {
      return `Cada línea necesita al menos ${this.minPacksPerLine()} packs. Ajustá las cantidades antes de confirmar.`;
    }
    if (!this.selectedDeliveryMethodId()) {
      return 'Seleccioná un método de entrega para continuar.';
    }
    if (this.requiresAddress) {
      const missingAddress = !this.deliveryAddress().trim();
      const missingPhone = !this.deliveryPhone().trim();
      if (missingAddress && missingPhone) {
        return 'Completá la dirección y el teléfono para continuar.';
      }
      if (missingAddress) return 'Completá la dirección para continuar.';
      if (missingPhone) return 'Completá el teléfono para continuar.';
    }
    if (this.mode === 'wholesale' && !this.deliveryDate()) {
      return 'Elegí un día de entrega.';
    }
    return null;
  }

  activeLines() {
    return this.mode === 'wholesale' ? this.cart.lines() : this.cart.stockLines();
  }

  activeSubtotal(): number {
    return this.mode === 'wholesale' ? this.cart.subtotal() : this.cart.stockSubtotal();
  }

  activeCount(): number {
    return this.mode === 'wholesale' ? this.cart.count() : this.cart.stockCount();
  }

  computeTotal(): number {
    return this.activeSubtotal() + (this.selectedDeliveryMethod()?.cost ?? 0);
  }

  submit(): void {
    if (!this.canSubmit || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const items = this.activeLines().map(l => ({
      productId: l.product.id!,
      quantity: l.packs,
    }));

    const base: any = {
      deliveryMethodId: this.selectedDeliveryMethodId(),
      deliveryAddress: this.requiresAddress ? this.deliveryAddress().trim() : undefined,
      deliveryPhone: this.requiresAddress ? this.deliveryPhone().trim() : undefined,
      notes: this.notes().trim() || undefined,
      items,
    };
    if (this.mode === 'wholesale') {
      base.deliveryDate = this.deliveryDate();
    }
    const req = base;

    const editingOrderId = this.cart.editingOrderId();
    const doCall = () =>
      editingOrderId
        ? this.orderService.updateMine(editingOrderId, req)
        : (this.mode === 'wholesale'
            ? this.orderService.createWholesale(req)
            : this.orderService.createStock(req));

    doCall().subscribe({
      next: (order) => {
        if (this.mode === 'wholesale') this.cart.clearWholesale();
        else this.cart.clearStock();
        this.cart.setEditingOrderId(null);
        this.loading.set(false);
        this.router.navigate(['/cliente/mis-pedidos', order.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.mapError(err,
          this.mode === 'wholesale'
            ? 'No se pudo confirmar el pedido mayorista.'
            : 'No se pudo confirmar el pedido de stock.'));
      }
    });
  }

  cancel(): void {
    this.router.navigate([this.mode === 'wholesale' ? '/cliente/catalogo' : '/cliente/stock-disponible']);
  }

  cancelModification(): void {
    this.cart.setEditingOrderId(null);
    this.cart.setStockEditingOrderId(null);
    this.error.set(null);
  }

  shortEditingOrderId(): string {
    const id = this.cart.editingOrderId();
    return id ? id.slice(0, 8).toUpperCase() : '';
  }

  isWholesale(): boolean {
    return this.mode === 'wholesale';
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  trackById(_i: number, m: DeliveryMethodSummary): string {
    return m.id;
  }

  trackByProduct(_i: number, line: { product: { id?: string } }): string | undefined {
    return line.product.id;
  }

  trackByDate(_i: number, d: { date: string }): string {
    return d.date;
  }

  formatPhoneNumber(value: string): string {
    if (!value) return '';
    let cleaned = value.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('54')) {
        cleaned = '+' + cleaned;
      } else {
        if (cleaned.length === 10) cleaned = '+549' + cleaned;
        else if (cleaned.length === 11 && cleaned.startsWith('0')) cleaned = '+549' + cleaned.slice(1);
      }
    }
    const digits = cleaned.replace(/\D/g, '');
    if (cleaned.startsWith('+') && digits.startsWith('549')) {
      const rest = digits.slice(3);
      const areaLen = rest.startsWith('1') ? 2 : 3;
      const area = rest.slice(0, areaLen);
      const remaining = rest.slice(areaLen);
      let formatted = `+54 9 ${area}`;
      if (remaining.length > 0) {
        const first = remaining.slice(0, 3);
        const second = remaining.slice(3, 7);
        formatted += ` ${first}`;
        if (second.length > 0) formatted += `-${second}`;
      }
      return formatted;
    }
    return value;
  }

  onPhoneBlur(): void {
    const raw = this.deliveryPhone();
    this.deliveryPhone.set(this.formatPhoneNumber(raw));
  }

  private formatHumanDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(n => parseInt(n, 10));
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return `${days[date.getDay()]} ${String(d ?? 1).padStart(2, '0')}/${String(m ?? 1).padStart(2, '0')}`;
  }

  private windowCutoff(deliveryDate: Date, w: DeliveryWindow): Date | null {
    if (w.cutoffTime == null || w.cutoffDayOfWeek == null || w.deliveryDayOfWeek == null) return null;
    const [hh, mm, ss] = (w.cutoffTime || '00:00:00').split(':').map(n => parseInt(n, 10));
    const deliveryIso = ((deliveryDate.getDay() + 6) % 7) + 1;
    let diff = ((w.deliveryDayOfWeek - deliveryIso) % 7 + 7) % 7;
    const cutoffDate = new Date(deliveryDate.getTime() - diff * 24 * 3600 * 1000);
    cutoffDate.setHours(hh || 0, mm || 0, ss || 0, 0);
    return cutoffDate;
  }

  private mapError(err: any, fallback: string): string {
    const body = err?.error;
    if (body?.error === 'INSUFFICIENT_STOCK' && Array.isArray(body.items) && body.items.length > 0) {
      const details = body.items.map((it: any) =>
        `${it.productName}: pediste ${it.requested} unid., disponibles ${it.available} unid.`
      ).join('\n');
      return `No hay stock suficiente para:\n${details}`;
    }
    if (body?.error === 'MIN_PACKS_PER_LINE' && Array.isArray(body.offending)) {
      const details = body.offending.map((it: any) =>
        `${it.productName ?? it.productId}: ${it.requestedPacks}/${it.minRequiredPacks} packs`
      ).join('\n');
      return `Cada línea debe tener al menos ${body.offending[0]?.minRequiredPacks ?? 5} packs:\n${details}`;
    }
    if (body?.error === 'MIN_ORDER_AMOUNT' && body.minAmount) {
      return `El subtotal del pedido debe ser al menos $${body.minAmount}. Subtotal actual: $${body.currentAmount}.`;
    }
    if (body?.error === 'DELIVERY_WINDOW_EXPIRED') {
      return `La fecha ${body.deliveryDate} ya no está disponible. Elegí otra.`;
    }
    return body?.detail || fallback;
  }
}
