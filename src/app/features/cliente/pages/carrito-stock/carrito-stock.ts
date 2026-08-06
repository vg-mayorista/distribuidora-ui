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
  selector: 'app-carrito-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, EmptyStateComponent],
  templateUrl: './carrito-stock.html',
  styleUrl: './carrito-stock.css',
})
export class CarritoStockComponent implements OnInit {
  private cart = inject(CartStore);
  private router = inject(Router);
  private configService = inject(BusinessConfigService);

  cartStore = this.cart;
  lines = this.cart.stockLines;
  hasItems = this.cart.stockHasItems;
  productEmoji = getProductEmoji;
  isEmpty = this.cart.stockIsEmpty;
  count = this.cart.stockCount;
  physicalUnits = this.cart.stockPhysicalUnits;
  subtotal = this.cart.stockSubtotal;
  offendingLines = this.cart.stockOffendingLines;

  minPacksPerLine(): number {
    return this.configService.config()?.minPacksPerLine ?? 5;
  }

  minOrderAmount(): number {
    return this.configService.config()?.minOrderAmount ?? 30000;
  }

  cancelModification(): void {
    this.cart.setStockEditingOrderId(null);
  }

  shortEditingOrderId(): string {
    const id = this.cart.stockEditingOrderId();
    return id ? id.slice(0, 8).toUpperCase() : '';
  }

  ngOnInit(): void {
    this.configService.loadConfig();
  }

  inc(line: CartLine): void {
    if (line.packs >= line.maxAllowed) return;
    this.cart.setStockPacks(line.product.id!, line.packs + 1);
  }

  dec(line: CartLine): void {
    if (line.packs <= 1) {
      this.cart.removeStock(line.product.id!);
      return;
    }
    this.cart.setStockPacks(line.product.id!, line.packs - 1);
  }

  setPacks(line: CartLine, value: any): void {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) return;
    const capped = Math.min(n, line.maxAllowed);
    this.cart.setStockPacks(line.product.id!, capped);
  }

  onInputChange(line: CartLine, event: Event): void {
    const target = event.target as HTMLInputElement;
    const n = Math.floor(Number(target.value));
    if (!Number.isFinite(n) || n < 1) {
      target.value = String(line.packs);
    }
  }

  remove(line: CartLine): void {
    this.cart.removeStock(line.product.id!);
  }

  clearAll(): void {
    this.cart.clearStock();
  }

  continue(): void {
    this.router.navigate(['/cliente/stock-disponible']);
  }

  goConfirm(): void {
    if (!this.cart.stockMeetsMinimumRequirements()) return;
    this.router.navigate(['/cliente/confirmar-stock']);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  trackByProduct(_i: number, line: CartLine): string | undefined {
    return line.product.id;
  }

  isOffending(line: CartLine): boolean {
    return line.packs < this.cart.effectiveMinPacksFor(line.product.unitsPerPack);
  }
}