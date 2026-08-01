import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartStore, CartLine } from '../../services/cart.store';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';
import { getProductEmoji } from '../../../../shared/utils/product-emoji';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, EmptyStateComponent],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoComponent implements OnInit {
  private cart = inject(CartStore);
  private router = inject(Router);

  cartStore = this.cart;
  lines = this.cart.lines;
  hasItems = this.cart.hasItems;
  productEmoji = getProductEmoji;
  isEmpty = this.cart.isEmpty;
  count = this.cart.count;
  physicalUnits = this.cart.physicalUnits;
  subtotal = this.cart.subtotal;

  cancelModification(): void {
    this.cart.setEditingOrderId(null);
  }

  shortEditingOrderId(): string {
    const id = this.cart.editingOrderId();
    return id ? id.slice(0, 8).toUpperCase() : '';
  }

  ngOnInit(): void {
  }

  /** Cantidad en unidades físicas (= packs × unitsPerPack). Es lo que muestra el input. */
  unitsOf(line: CartLine): number {
    const upp = line.product.unitsPerPack && line.product.unitsPerPack > 0 ? line.product.unitsPerPack : 1;
    return line.packs * upp;
  }

  /** Tope del input en unidades (= maxAllowed packs × unitsPerPack). */
  maxUnitsOf(line: CartLine): number {
    const upp = line.product.unitsPerPack && line.product.unitsPerPack > 0 ? line.product.unitsPerPack : 1;
    return (line.maxAllowed > 0 ? line.maxAllowed : Number.MAX_SAFE_INTEGER) * upp;
  }

  /** Cada click en +/- = 1 PACK (unidad mínima de venta) */
  inc(line: CartLine): void {
    this.cart.setPacks(line.product.id!, line.packs + 1);
  }

  dec(line: CartLine): void {
    this.cart.setPacks(line.product.id!, line.packs - 1);
  }

  /**
   * Cuando el usuario tipea un número en el input, ese número está en UNIDADES.
   * Convertimos a packs dividiendo por unitsPerPack y enviamos al store.
   */
  setPacksFromUnits(line: CartLine, value: any): void {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) return;
    const upp = line.product.unitsPerPack && line.product.unitsPerPack > 0 ? line.product.unitsPerPack : 1;
    const packs = Math.ceil(n / upp);
    this.cart.setPacks(line.product.id!, packs);
  }

  onInputChange(line: CartLine, event: Event): void {
    const target = event.target as HTMLInputElement;
    const n = Math.floor(Number(target.value));
    if (!Number.isFinite(n) || n < 1) {
      target.value = String(this.unitsOf(line));
    }
  }

  remove(line: CartLine): void {
    this.cart.remove(line.product.id!);
  }

  clearAll(): void {
    this.cart.clear();
  }

  continue(): void {
    this.router.navigate(['/cliente/catalogo']);
  }

  goConfirm(): void {
    this.router.navigate(['/cliente/confirmar']);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  trackByProduct(_i: number, line: CartLine): string | undefined {
    return line.product.id;
  }
}
