import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../../../models/product.model';

export interface CartLine {
  product: Product;
  packs: number;
  physicalUnits: number;
}

const STORAGE_KEY = 'distribuidora.cart.v1';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private _lines = signal<CartLine[]>(this.loadFromStorage());
  private _editingOrderId = signal<string | null>(this.loadEditingOrderIdFromStorage());

  readonly lines = this._lines.asReadonly();
  readonly editingOrderId = this._editingOrderId.asReadonly();

  setEditingOrderId(orderId: string | null): void {
    this._editingOrderId.set(orderId);
    if (typeof sessionStorage !== 'undefined') {
      if (orderId) {
        sessionStorage.setItem('distribuidora.cart.editingOrderId', orderId);
      } else {
        sessionStorage.removeItem('distribuidora.cart.editingOrderId');
      }
    }
  }

  setLines(lines: CartLine[]): void {
    this._lines.set(lines);
    this.persist();
  }

  private loadEditingOrderIdFromStorage(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem('distribuidora.cart.editingOrderId');
  }

  readonly count = computed(() =>
    this._lines().reduce((s, l) => s + l.packs, 0)
  );

  readonly physicalUnits = computed(() =>
    this._lines().reduce((s, l) => s + l.physicalUnits, 0)
  );

  readonly subtotal = computed(() =>
    this._lines().reduce((s, l) => s + l.packs * l.product.price, 0)
  );

  readonly hasItems = computed(() => this._lines().length > 0);

  readonly isEmpty = computed(() => this._lines().length === 0);

  add(product: Product, packs: number): void {
    const unitsPerPack = product.unitsPerPack > 0 ? product.unitsPerPack : 1;
    const existing = this._lines().find(l => l.product.id === product.id);
    if (existing) {
      this._lines.update(list =>
        list.map(l => l.product.id === product.id
          ? { ...l, packs: l.packs + packs, physicalUnits: (l.packs + packs) * unitsPerPack }
          : l));
    } else {
      this._lines.update(list => [
        ...list,
        { product, packs, physicalUnits: packs * unitsPerPack },
      ]);
    }
    this.persist();
  }

  setPacks(productId: string, packs: number): void {
    if (packs <= 0) {
      this.remove(productId);
      return;
    }
    this._lines.update(list =>
      list.map(l => l.product.id === productId
        ? { ...l, packs, physicalUnits: packs * (l.product.unitsPerPack || 1) }
        : l));
    this.persist();
  }

  remove(productId: string): void {
    this._lines.update(list => list.filter(l => l.product.id !== productId));
    this.persist();
  }

  clear(): void {
    this._lines.set([]);
    this.setEditingOrderId(null);
    this.persist();
  }

  private loadFromStorage(): CartLine[] {
    if (typeof sessionStorage === 'undefined') return [];
    // Migración defensiva: si quedó un carrito viejo en localStorage, lo movemos.
    try {
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (legacy && !sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this._lines()));
    } catch {
      // ignore quota errors
    }
  }
}
