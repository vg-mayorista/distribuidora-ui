import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartStore, CartLine } from '../../services/cart.store';
import { BusinessConfigService } from '../../../../services/business-config.service';
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
  private configService = inject(BusinessConfigService);

  cartStore = this.cart;
  lines = this.cart.lines;
  hasItems = this.cart.hasItems;
  productEmoji = getProductEmoji;
  isEmpty = this.cart.isEmpty;
  count = this.cart.count;
  physicalUnits = this.cart.physicalUnits;
  subtotal = this.cart.subtotal;
  offendingLines = this.cart.offendingLines;

  /** Mínimo de packs por línea tomado del BusinessConfig del backend (default 5). */
  minPacksPerLine(): number {
    return this.configService.config()?.minPacksPerLine ?? 5;
  }

  cancelModification(): void {
    this.cart.setEditingOrderId(null);
  }

  shortEditingOrderId(): string {
    const id = this.cart.editingOrderId();
    return id ? id.slice(0, 8).toUpperCase() : '';
  }

  ngOnInit(): void {
    this.configService.loadConfig();
  }

  inc(line: CartLine): void {
    this.cart.setPacks(line.product.id!, line.packs + 1);
  }

  dec(line: CartLine): void {
    this.cart.setPacks(line.product.id!, line.packs - 1);
  }

  setPacks(line: CartLine, value: any): void {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) return;
    this.cart.setPacks(line.product.id!, n);
  }

  onInputChange(line: CartLine, event: Event): void {
    const target = event.target as HTMLInputElement;
    const min = this.minPacksPerLine();
    const n = Math.floor(Number(target.value));
    if (!Number.isFinite(n) || n < min) {
      target.value = String(line.packs);
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
    if (!this.cart.meetsPerLineMinimum()) {
      return;
    }
    this.router.navigate(['/cliente/confirmar']);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  trackByProduct(_i: number, line: CartLine): string | undefined {
    return line.product.id;
  }

  isOffending(line: CartLine): boolean {
    return line.packs < this.minPacksPerLine();
  }
}
