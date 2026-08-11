import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
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
export class ConfirmarComponent implements OnInit, OnDestroy {
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

  /** Tick reactivo que se actualiza cada 30s. Lo consume `availableDeliveryDates`
   *  para que la disponibilidad de fechas (cutoffs) se reevalúe sin recargar la
   *  página: si el cliente abrió la pantalla a las 17:50, el `computed` cacheaba
   *  miércoles como disponible aunque a las 18:01 ya no lo sea. */
  private nowTick = signal(Date.now());
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  /** Wholesale: SOLO miércoles y viernes como días de entrega. Esto es una
   *  regla de negocio hardcoded — no depende del config de delivery windows.
   *  El cutoff sigue viniendo del config (la ventana de pedido cierra a las
   *  18:00 del día anterior). Si el admin desactiva las ventanas, el array
   *  queda vacío y el cliente no puede confirmar. */
  availableDeliveryDates = computed<{ date: string; label: string }[]>(() => {
    if (this.mode !== 'wholesale') return [];
    const nowMs = this.nowTick(); // dependencia reactiva: reevalúa cada 30s
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: { date: string; label: string }[] = [];
    for (let i = 0; i < 14 && dates.length < 2; i++) {
      const date = new Date(today.getTime() + i * 24 * 3600 * 1000);
      const dow = date.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed, 5=Fri
      if (dow !== 3 && dow !== 5) continue; // ← solo miércoles o viernes
      const iso = date.toISOString().slice(0, 10);
      const cuts = this.deliveryWindows()
        .filter(w => w.deliveryDayOfWeek === ((dow + 6) % 7) + 1)
        .map(w => this.windowCutoff(date, w))
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime());
      const cutoff = cuts[0];
      if (cutoff && cutoff.getTime() <= nowMs) continue;
      dates.push({
        date: iso,
        label: this.formatHumanDate(iso),
      });
    }
    // Pickup: el cliente normalmente quiere retirar cuanto antes → solo la más cercana.
    if (!this.requiresAddress && dates.length > 0) {
      return [dates[0]];
    }
    return dates;
  });

  /**
   * Banner de cierre de ventana: aparece cuando el próximo cutoff está a ≤ 60 min,
   * o cuando acaba de pasar (≤ 5 min). Devuelve `null` fuera de wholesale o si no
   * hay próximo cutoff (caso patológico: no hay ventanas activas).
   */
  cutoffWarning = computed<{
    isClosed: boolean;
    humanLabel: string;
    cutoffHourLabel: string;
    nextDeliveryLabel: string;
  } | null>(() => {
    if (this.mode !== 'wholesale') return null;
    const nextIso = this.configService.config()?.nextCutoffInstant;
    if (!nextIso) return null;
    const nextCutoff = new Date(nextIso);
    if (Number.isNaN(nextCutoff.getTime())) return null;

    const now = Date.now();
    const diffMs = nextCutoff.getTime() - now;
    const minLeft = Math.round(diffMs / 60000);

    // Próximo día de entrega disponible (después del cutoff actual)
    const nextDates = this.availableDeliveryDates();
    const nextDeliveryLabel = nextDates[0]?.label ?? 'el próximo día hábil';

    // Cortada hace menos de 5 min
    if (diffMs < -5 * 60_000) return null;
    const isClosed = diffMs <= 0;
    if (isClosed) {
      return {
        isClosed: true,
        humanLabel: '0 min',
        cutoffHourLabel: String(nextCutoff.getHours()).padStart(2, '0'),
        nextDeliveryLabel,
      };
    }
    // Más de 60 min → no mostrar banner
    if (minLeft > 60) return null;
    const humanLabel = this.humanizeMinutes(minLeft);
    return {
      isClosed: false,
      humanLabel,
      cutoffHourLabel: String(nextCutoff.getHours()).padStart(2, '0'),
      nextDeliveryLabel,
    };
  });

  private humanizeMinutes(min: number): string {
    if (min < 1) return 'menos de 1 min';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }

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
    // El modo se determina SIEMPRE por la URL. /cliente/confirmar-stock => stock,
    // todo lo demás => wholesale. NO inferirlo desde el contenido del carrito,
    // porque si el cliente tiene ítems en ambas carts (wholesale sin confirmar +
    // stock agregado después) el modo debería ser estable según la ruta.
    const fromData = (this.route.snapshot.data?.['mode'] ?? '').toString().toLowerCase();
    this.mode = fromData === 'stock' ? 'stock' : 'wholesale';
    this.configService.loadConfig();

    // Tick cada 30s: hace que `availableDeliveryDates` reevalúe cutoffs sin
    // necesidad de recargar la página.
    this.tickHandle = setInterval(() => this.nowTick.set(Date.now()), 30_000);

    this.deliveryMethodService.listActive().subscribe({
      next: (methods) => {
        this.allDeliveryMethods.set(methods);
        const avail = this.availableDeliveryMethods();
        const def = avail.find(m => m.name.toLowerCase().includes('retiro'))
          ?? avail.find(m => m.name.toLowerCase().includes('domicilio'))
          ?? avail[0];
        if (def) {
          this.selectDeliveryMethod(def);
        }
        this.syncEditingOrderDeliveryMethod();
      },
      error: () => this.error.set('No se pudieron cargar los métodos de entrega.'),
    });

    this.orderService.listMine(0, 5).subscribe({
      next: (ordersPage) => {
        const editingId = this.currentEditingOrderId();
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
        } else {
          this.prefillFromProfile();
        }
      },
      error: () => this.prefillFromProfile()
    });

    const editingId = this.currentEditingOrderId();
    if (editingId) {
      this.orderService.getMine(editingId).subscribe({
        next: (o) => {
          if (o && !o.editable) {
            this.cancelModification();
            this.error.set('El pedido que estabas modificando ya fue procesado y no se puede editar. Se procederá a confirmar como un pedido nuevo.');
          }
        },
        error: () => {
          this.cancelModification();
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.tickHandle !== null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private syncEditingOrderDeliveryMethod(): void {
    const editingId = this.currentEditingOrderId();
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

  private prefillFromProfile(): void {
    const session = this.authService.getCurrentUser();
    if (!session) return;
    if (session.address && session.address.trim()) {
      this.hasSavedAddress.set(true);
      this.deliveryAddress.set(session.address.trim());
    }
    if (session.phone && session.phone.trim()) {
      this.deliveryPhone.set(this.formatPhoneNumber(session.phone.trim()));
    }
  }

  selectDeliveryMethod(method: DeliveryMethodSummary): void {
    this.selectedDeliveryMethodId.set(method.id);
    this.selectedDeliveryMethod.set(method);
    this.error.set(null); // limpiamos error stale al cambiar método

    // Para pickup, autoseleccionamos la fecha más cercana disponible.
    if (!this.requiresAddress) {
      const dates = this.availableDeliveryDates();
      if (dates.length > 0) {
        this.deliveryDate.set(dates[0].date);
      }
    }
  }

  /** Limpia errores visibles cuando el cliente corrige un input. Sin esto,
   *  un 500 stale quedaba en pantalla aunque el usuario ya hubiera cambiado
   *  la fecha o la dirección. */
  clearError(): void {
    if (this.error() !== null) {
      this.error.set(null);
    }
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

  /**
   * Mínimo de unidades físicas por línea. Toma el valor del config y, si el
   * producto es Unitario, packs = unidades. Coherente con cart.store.
   */
  hasLinesBelowMin(): boolean {
    const min = this.minPacksPerLine();
    return this.activeLines().some(
      l => l.packs * Math.max(l.product.unitsPerPack, 1) < min
    );
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
      return `Cada línea necesita al menos ${this.minPacksPerLine()} unidades físicas. Ajustá las cantidades antes de confirmar.`;
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

  /**
   * Costo del envío tal como lo verá el cliente. Refleja la misma regla
   * que el backend (computeDeliveryCost): "Envío a Domicilio" es gratis
   * cuando la entrega cae en miércoles o viernes.
   */
  computedDeliveryCost = computed<number>(() => {
    const m = this.selectedDeliveryMethod();
    if (!m) return 0;
    if (this.mode === 'wholesale'
        && m.name.toLowerCase().includes('domicilio')
        && this.deliveryDate()) {
      const [y, m, d] = this.deliveryDate().split('-').map(n => parseInt(n, 10));
      const date = new Date(y, (m ?? 1) - 1, d ?? 1);
      const dow = date.getDay();
      if (dow === 3 || dow === 5) return 0;  // miércoles o viernes
    }
    return m.cost;
  });

  /**
   * Etiqueta de costo para la card del método. Mismo cálculo que
   * computedDeliveryCost pero aplicado a cualquier método.
   */
  methodCardCost(method: DeliveryMethodSummary): string {
    if (method.cost === 0) return 'Gratis';
    if (this.mode === 'wholesale'
        && method.name.toLowerCase().includes('domicilio')
        && this.deliveryDate()) {
      const [y, m, d] = this.deliveryDate().split('-').map(n => parseInt(n, 10));
      const date = new Date(y, (m ?? 1) - 1, d ?? 1);
      const dow = date.getDay();
      if (dow === 3 || dow === 5) return 'Gratis';
    }
    return `+$${this.formatPrice(method.cost)}`;
  }

  computeTotal(): number {
    return this.activeSubtotal() + this.computedDeliveryCost();
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

    const editingOrderId = this.currentEditingOrderId();
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
        this.cart.setStockEditingOrderId(null);
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

  /** Editing ID del flujo activo (wholesale vs stock). */
  currentEditingOrderId(): string | null {
    return this.mode === 'wholesale'
      ? this.cart.editingOrderId()
      : this.cart.stockEditingOrderId();
  }

  shortId(id: string): string {
    return id ? id.slice(0, 8).toUpperCase() : '';
  }

  shortEditingOrderId(): string {
    return this.shortId(this.currentEditingOrderId() ?? '');
  }

  isWholesale(): boolean {
    return this.mode === 'wholesale';
  }

  /**
   * Numeración auto-incrementada de secciones, omitiendo las que no aplican al flujo.
   * Útil para que el título "3." no quede en blanco si `requiresAddress` es false.
   */
  sectionNumber(currentSection: 1 | 2 | 3 | 4): number {
    const sectionsVisible: Record<1 | 2 | 3 | 4, boolean> = {
      1: true,
      2: this.isWholesale(),
      3: this.requiresAddress,
      4: true,
    };
    let n = 0;
    for (const k of [1, 2, 3, 4] as const) {
      if (sectionsVisible[k]) n++;
      if (k === currentSection) return n;
    }
    return n;
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
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('54')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 0) return '';

    const areaLen = digits.startsWith('1') ? 2 : 3;
    const area = digits.slice(0, areaLen);
    const remaining = digits.slice(areaLen);
    if (remaining.length === 0) return area;

    const first = remaining.slice(0, 3);
    const second = remaining.slice(3, 7);
    let formatted = `${area} ${first}`;
    if (second.length > 0) formatted += `-${second}`;
    return formatted;
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
    // Distancia en días desde el día del cutoff hasta el día de la entrega.
    // Debe coincidir con la fórmula del backend: `Math.floorMod(deliveryDow - cutoffDow, 7)`.
    // Si la entrega es Viernes (5) y el cutoff es Jueves (4), diff = 1.
    const diff = ((deliveryIso - w.cutoffDayOfWeek) % 7 + 7) % 7;
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
      const minUnits = body.offending[0]?.minRequiredUnits ?? 5;
      const details = body.offending.map((it: any) =>
        `${it.productName ?? it.productId}: ${it.requestedUnits}/${minUnits} u. (${it.requestedPacks} packs)`
      ).join('\n');
      return `Cada línea debe tener al menos ${minUnits} unidades físicas:\n${details}`;
    }
    if (body?.error === 'MIN_ORDER_AMOUNT' && body.minAmount) {
      return `El subtotal del pedido debe ser al menos $${body.minAmount}. Subtotal actual: $${body.currentAmount}.`;
    }
    if (body?.error === 'DELIVERY_WINDOW_EXPIRED') {
      return `La fecha ${body.deliveryDate} ya no está disponible. Elegí otra.`;
    }
    // 5xx: el body.detail viene del GlobalExceptionHandler ("Error interno del servidor").
    // Mostrar eso al usuario es hostil — lo traducimos a un mensaje accionable.
    if (err?.status >= 500 && err?.status < 600) {
      return 'Tuvimos un problema procesando tu pedido. Por favor reintentá en unos minutos.';
    }
    return body?.detail || fallback;
  }
}
