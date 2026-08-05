import { Injectable, computed, signal, inject } from '@angular/core';
import { Product } from '../../../models/product.model';
import { BusinessConfigService } from '../../../services/business-config.service';

export interface CartLine {
  product: Product;
  packs: number;
  physicalUnits: number;
  /**
   * Máximo de packs permitidos. En el flujo mayorista se inicializa en
   * {@link Number.MAX_SAFE_INTEGER} (no se capa por stock). En el flujo de stock se
   * setea con el stock real del producto.
   */
  maxAllowed: number;
}

const STORAGE_KEY = 'distribuidora.cart.v1';
const STOCK_STORAGE_KEY = 'distribuidora.cart.stock.v1';
const EDITING_KEY = 'distribuidora.cart.editingOrderId';
const STOCK_EDITING_KEY = 'distribuidora.cart.editingOrderId.stock';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private configService = inject(BusinessConfigService);

  private readonly _wholesaleLines = signal<CartLine[]>(this.loadFromStorage(STORAGE_KEY));
  private readonly _wholesaleEditingId = signal<string | null>(this.loadEditingId(EDITING_KEY));
  private readonly _stockLines = signal<CartLine[]>(this.loadFromStorage(STOCK_STORAGE_KEY));
  private readonly _stockEditingId = signal<string | null>(this.loadEditingId(STOCK_EDITING_KEY));

  readonly lines = this._wholesaleLines.asReadonly();
  readonly editingOrderId = this._wholesaleEditingId.asReadonly();
  readonly stockLines = this._stockLines.asReadonly();
  readonly stockEditingOrderId = this._stockEditingId.asReadonly();

  // ── Wholesale cart (mayorista, sin cap por stock) ────────────────────

  setEditingOrderId(orderId: string | null): void {
    this._wholesaleEditingId.set(orderId);
    this.persistEditingId(orderId, EDITING_KEY);
  }

  setLines(lines: CartLine[]): void {
    this._wholesaleLines.set(lines);
    this.persist(this._wholesaleLines(), STORAGE_KEY);
  }

  // ── Stock cart (excedente, capeado por stock) ────────────────────────

  setStockEditingOrderId(orderId: string | null): void {
    this._stockEditingId.set(orderId);
    this.persistEditingId(orderId, STOCK_EDITING_KEY);
  }

  setStockLines(lines: CartLine[]): void {
    this._stockLines.set(lines);
    this.persist(this._stockLines(), STOCK_STORAGE_KEY);
  }

  // ── Helpers genéricos (sobre el carrito wholesale) ─────────────────────

  readonly count = computed(() =>
    this._wholesaleLines().reduce((s, l) => s + l.packs, 0)
  );

  readonly stockCount = computed(() =>
    this._stockLines().reduce((s, l) => s + l.packs, 0)
  );

  readonly physicalUnits = computed(() =>
    this._wholesaleLines().reduce((s, l) => s + l.physicalUnits, 0)
  );

  readonly stockPhysicalUnits = computed(() =>
    this._stockLines().reduce((s, l) => s + l.physicalUnits, 0)
  );

  readonly subtotal = computed(() =>
    this._wholesaleLines().reduce((s, l) => s + l.packs * l.product.price, 0)
  );

  readonly stockSubtotal = computed(() =>
    this._stockLines().reduce((s, l) => s + l.packs * l.product.price, 0)
  );

  readonly hasItems = computed(() => this._wholesaleLines().length > 0);
  readonly stockHasItems = computed(() => this._stockLines().length > 0);

  readonly isEmpty = computed(() => this._wholesaleLines().length === 0);
  readonly stockIsEmpty = computed(() => this._stockLines().length === 0);

  readonly minOrderAmount = computed(() => this.configService.config()?.minOrderAmount ?? 30000);

  readonly minOrderUnits = computed(() => this.configService.config()?.minOrderUnits ?? 5);

  readonly montoFaltante = computed(() =>
    Math.max(0, this.minOrderAmount() - this.subtotal())
  );

  readonly stockMontoFaltante = computed(() =>
    Math.max(0, this.minOrderAmount() - this.stockSubtotal())
  );

  readonly unidadesFaltantes = computed(() =>
    Math.max(0, this.minOrderUnits() - this.count())
  );

  readonly stockUnidadesFaltantes = computed(() =>
    Math.max(0, this.minOrderUnits() - this.stockCount())
  );

  readonly meetsMinimumRequirements = computed(() =>
    this.montoFaltante() === 0 && this.unidadesFaltantes() === 0
  );

  readonly stockMeetsMinimumRequirements = computed(() =>
    this.stockMontoFaltante() === 0 && this.stockUnidadesFaltantes() === 0
  );

  readonly progressPercentage = computed(() => {
    const amountRatio = Math.min(1, this.subtotal() / (this.minOrderAmount() || 1));
    const unitsRatio = Math.min(1, this.count() / (this.minOrderUnits() || 1));
    return Math.floor(((amountRatio + unitsRatio) / 2) * 100);
  });

  readonly stockProgressPercentage = computed(() => {
    const amountRatio = Math.min(1, this.stockSubtotal() / (this.minOrderAmount() || 1));
    const unitsRatio = Math.min(1, this.stockCount() / (this.minOrderUnits() || 1));
    return Math.floor(((amountRatio + unitsRatio) / 2) * 100);
  });

  // ── Mutaciones mayorista ───────────────────────────────────────────────

  add(product: Product, packs: number): void {
    this._addTo('wholesale', product, packs, Number.MAX_SAFE_INTEGER, STORAGE_KEY);
  }

  setPacks(productId: string, packs: number): void {
    this._setPacks('wholesale', productId, packs, STORAGE_KEY);
  }

  setMaxAllowed(productId: string, maxAllowed: number): void {
    this._wholesaleLines.update(list =>
      list.map(l => l.product.id === productId ? { ...l, maxAllowed } : l)
    );
    this.persist(this._wholesaleLines(), STORAGE_KEY);
  }

  // ── Mutaciones stock (con cap) ────────────────────────────────────────

  addStock(product: Product, packs: number, maxAllowed: number): void {
    this._addTo('stock', product, packs, maxAllowed, STOCK_STORAGE_KEY);
  }

  setStockPacks(productId: string, packs: number): void {
    this._setPacks('stock', productId, packs, STOCK_STORAGE_KEY);
  }

  setStockMaxAllowed(productId: string, maxAllowed: number): void {
    this._stockLines.update(list =>
      list.map(l => l.product.id === productId
        ? { ...l, maxAllowed: Math.max(l.maxAllowed, maxAllowed) } : l)
    );
    this.persist(this._stockLines(), STOCK_STORAGE_KEY);
  }

  // ── Eliminación ──────────────────────────────────────────────────────

  remove(productId: string): void {
    this._removeFrom('wholesale', productId, STORAGE_KEY);
  }

  removeStock(productId: string): void {
    this._removeFrom('stock', productId, STOCK_STORAGE_KEY);
  }

  clear(): void {
    this._wholesaleLines.set([]);
    this._stockLines.set([]);
    this.setEditingOrderId(null);
    this.setStockEditingOrderId(null);
    this.persist(this._wholesaleLines(), STORAGE_KEY);
    this.persist(this._stockLines(), STOCK_STORAGE_KEY);
  }

  clearWholesale(): void {
    this._wholesaleLines.set([]);
    this.setEditingOrderId(null);
    this.persist(this._wholesaleLines(), STORAGE_KEY);
  }

  clearStock(): void {
    this._stockLines.set([]);
    this.setStockEditingOrderId(null);
    this.persist(this._stockLines(), STOCK_STORAGE_KEY);
  }

  // ── Internals ───────────────────────────────────────────────────────

  private _addTo(
    target: 'wholesale' | 'stock',
    product: Product,
    packs: number,
    maxAllowed: number,
    storageKey: string
  ): void {
    const unitsPerPack = product.unitsPerPack > 0 ? product.unitsPerPack : 1;
    const apply = (list: CartLine[]): CartLine[] => {
      const existing = list.find(l => l.product.id === product.id);
      if (existing) {
        return list.map(l => l.product.id === product.id
          ? {
              ...l,
              packs: l.packs + packs,
              physicalUnits: (l.packs + packs) * unitsPerPack,
              maxAllowed: target === 'wholesale' ? maxAllowed : Math.max(l.maxAllowed, maxAllowed),
            }
          : l);
      }
      return [...list, { product, packs, physicalUnits: packs * unitsPerPack, maxAllowed }];
    };
    if (target === 'wholesale') {
      this._wholesaleLines.update(apply);
    } else {
      this._stockLines.update(apply);
    }
    this.persistByKey(storageKey);
  }

  private _setPacks(
    target: 'wholesale' | 'stock',
    productId: string,
    packs: number,
    storageKey: string
  ): void {
    const apply = (list: CartLine[]): CartLine[] =>
      list.map(l => {
        if (l.product.id !== productId) return l;
        const safeMax = l.maxAllowed > 0 ? l.maxAllowed : Number.MAX_SAFE_INTEGER;
        const clamped = Math.min(Math.max(1, Math.floor(packs)), safeMax);
        return { ...l, packs: clamped, physicalUnits: clamped * (l.product.unitsPerPack || 1) };
      });

    if (packs <= 0) {
      this._removeFromOnly(target, productId);
      this.persistByKey(storageKey);
      return;
    }
    if (target === 'wholesale') {
      this._wholesaleLines.update(apply);
    } else {
      this._stockLines.update(apply);
    }
    this.persistByKey(storageKey);
  }

  private _removeFrom(
    target: 'wholesale' | 'stock',
    productId: string,
    storageKey: string
  ): void {
    this._removeFromOnly(target, productId);
    this.persistByKey(storageKey);
  }

  private _removeFromOnly(
    target: 'wholesale' | 'stock',
    productId: string
  ): void {
    const filter = (l: CartLine[]) => l.filter(x => x.product.id !== productId);
    if (target === 'wholesale') {
      this._wholesaleLines.update(filter);
    } else {
      this._stockLines.update(filter);
    }
  }

  // ── Storage helpers ─────────────────────────────────────────────────

  private loadFromStorage(key: string): CartLine[] {
    if (typeof sessionStorage === 'undefined') return [];
    try {
      const legacy = localStorage.getItem(key);
      if (legacy && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, legacy);
        localStorage.removeItem(key);
      }
    } catch {}
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartLine[];
      return parsed.map(l => ({
        ...l,
        maxAllowed: typeof l.maxAllowed === 'number' ? l.maxAllowed : Number.MAX_SAFE_INTEGER,
      }));
    } catch {
      return [];
    }
  }

  private loadEditingId(key: string): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(key);
  }

  private persist(lines: CartLine[], key: string): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(key, JSON.stringify(lines));
    } catch {
      // ignore quota errors
    }
  }

  private persistByKey(key: string): void {
    if (key === STOCK_STORAGE_KEY) {
      this.persist(this._stockLines(), STOCK_STORAGE_KEY);
    } else {
      this.persist(this._wholesaleLines(), STORAGE_KEY);
    }
  }

  private persistEditingId(orderId: string | null, key: string): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      if (orderId) sessionStorage.setItem(key, orderId);
      else sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
