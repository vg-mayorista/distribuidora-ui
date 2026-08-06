import { Component, OnInit, ChangeDetectorRef, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { CartService } from '../../../../services/cart.service';
import { BusinessConfigService } from '../../../../services/business-config.service';
import { CartStore } from '../../services/cart.store';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { getProductEmoji } from '../../../../shared/utils/product-emoji';

const MAX_PACKS_PER_LINE = 99;

@Component({
  selector: 'app-stock-disponible',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonComponent, BadgeComponent],
  templateUrl: './stock-disponible.html',
  styleUrl: './stock-disponible.css',
})
export class StockDisponibleComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  configService = inject(BusinessConfigService);
  cartStore = inject(CartStore);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<string | null>(null);
  searchTerm = signal('');
  quantities: Record<string, number> = {};
  maxPacksByProduct: Record<string, number> = {};

  loading = signal(false);
  error = signal<string | null>(null);
  cartPulse = signal(false);
  isScrolled = signal(false);
  adding = signal<Record<string, boolean>>({});
  addedJustNow = signal<Record<string, boolean>>({});

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const categoryId = this.selectedCategoryId();
    let list = this.products();
    if (categoryId) {
      list = list.filter(p => p.categoryId === categoryId);
    }
    if (!term) {
      return [...list].sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    }
    return list
      .filter(p => p.name.toLowerCase().includes(term) || (p.description ?? '').toLowerCase().includes(term))
      .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
  });

  private minPacks(): number {
    return this.configService.config()?.minPacksPerLine ?? 5;
  }

  minPacksPerLine(): number {
    return this.minPacks();
  }

  ngOnInit(): void {
    this.configService.loadConfig();
    this.loadProducts();
    this.loadCategories();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 120);
    }
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (data) => {
        const inStock = data.content.filter(p => p.active && (p.stock ?? 0) > 0);
        this.products.set(inStock);
        this.loading.set(false);
        const min = this.minPacks();
        for (const p of inStock) {
          if (p.id && !(p.id in this.quantities)) {
            this.quantities[p.id] = min;
          }
          if (p.id && p.unitsPerPack > 0) {
            const stockPacks = Math.floor((p.stock ?? 0) / p.unitsPerPack);
            this.maxPacksByProduct[p.id] = Math.max(stockPacks, min);
          }
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos disponibles.');
        this.loading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (data) => this.categories.set(data.content),
      error: () => console.error('No se pudieron cargar las categorías.')
    });
  }

  isInStockCart(product: Product): boolean {
    return !!product.id && this.cartStore.stockLines().some(l => l.product.id === product.id);
  }

  stockInCart(product: Product): number {
    if (!product.id) return 0;
    const line = this.cartStore.stockLines().find(l => l.product.id === product.id);
    return line ? line.packs : 0;
  }

  physicalUnits(product: Product, packs: number): number {
    return packs * Math.max(product.unitsPerPack, 1);
  }

  getPacks(product: Product): number {
    if (!product.id) return this.minPacks();
    const lineInCart = this.cartStore.stockLines().find(l => l.product.id === product.id);
    if (lineInCart) return lineInCart.packs;
    const current = this.quantities[product.id] ?? this.minPacks();
    const maxPacks = this.maxPacksFor(product);
    if (maxPacks <= 0) return 0;
    return Math.min(Math.max(this.minPacks(), current), maxPacks);
  }

  maxPacksFor(product: Product): number {
    if (!product.id) return 0;
    const cartLine = this.cartStore.stockLines().find(l => l.product.id === product.id);
    const inCart = cartLine ? cartLine.packs : 0;
    const live = this.maxPacksByProduct[product.id] ?? Math.floor((product.stock ?? 0) / Math.max(product.unitsPerPack, 1));
    return Math.max(0, live - inCart);
  }

  setPacks(product: Product, packs: number): void {
    if (!product.id) return;
    const min = this.minPacks();
    const lineInCart = this.cartStore.stockLines().find(l => l.product.id === product.id);
    if (lineInCart) {
      if (packs <= 0) {
        this.cartStore.removeStock(product.id);
        this.quantities[product.id] = min;
      } else {
        const cartLineMax = this.maxPacksByProduct[product.id] ?? 999;
        const clamped = Math.min(packs, cartLineMax + lineInCart.packs);
        this.cartStore.setStockPacks(product.id, clamped);
      }
      this.triggerCartPulse();
    } else {
      const max = this.maxPacksByProduct[product.id] ?? min;
      this.quantities[product.id] = Math.max(min, Math.min(packs, max));
    }
    this.cdr.detectChanges();
  }

  incPacks(product: Product): void {
    if (!product.id) return;
    const lineInCart = this.cartStore.stockLines().find(l => l.product.id === product.id);
    if (lineInCart) {
      if (this.maxPacksFor(product) > 0) {
        this.cartStore.setStockPacks(product.id, lineInCart.packs + 1);
        this.triggerCartPulse();
      }
    } else {
      const max = this.maxPacksByProduct[product.id] ?? 0;
      const current = this.getPacks(product);
      if (current < max) this.quantities[product.id] = current + 1;
    }
  }

  decPacks(product: Product): void {
    if (!product.id) return;
    const min = this.minPacks();
    const lineInCart = this.cartStore.stockLines().find(l => l.product.id === product.id);
    if (lineInCart) {
      if (lineInCart.packs > min) {
        this.cartStore.setStockPacks(product.id, lineInCart.packs - 1);
      } else {
        this.cartStore.removeStock(product.id);
        this.quantities[product.id] = min;
      }
      this.triggerCartPulse();
    } else {
      const current = this.getPacks(product);
      if (current > min) this.quantities[product.id] = current - 1;
    }
  }

  async addToCart(product: Product): Promise<void> {
    if (!product.id) return;
    const min = this.minPacks();
    const packs = this.getPacks(product);
    if (packs <= 0) return;
    this.adding.update(s => ({ ...s, [product.id!]: true }));
    try {
      const stockMap = await firstValueFrom(this.cartService.checkStock([product.id]));
      const stock = Math.max(0, stockMap[product.id] ?? 0);
      const unitsPerPack = Math.max(product.unitsPerPack, 1);
      const stockPacks = Math.floor(stock / unitsPerPack);
      const maxAllowedTotal = Math.max(stockPacks, min);
      this.maxPacksByProduct[product.id] = maxAllowedTotal;

      const currentLine = this.cartStore.stockLines().find(l => l.product.id === product.id);
      const alreadyInCart = currentLine ? currentLine.packs : 0;
      const realMaxCanAdd = Math.max(0, maxAllowedTotal - alreadyInCart);
      const capped = Math.min(packs, realMaxCanAdd);
      if (capped <= 0) {
        this.error.set('No hay más stock disponible para este producto.');
        return;
      }
      this.cartStore.addStock(product, capped, maxAllowedTotal);
      this.triggerCartPulse();
      this.quantities[product.id] = min;
      this.addedJustNow.update(s => ({ ...s, [product.id!]: true }));
      setTimeout(() => {
        this.addedJustNow.update(s => ({ ...s, [product.id!]: false }));
      }, 1500);
    } catch {
      this.error.set('No se pudo agregar el producto al carrito.');
    } finally {
      this.adding.update(s => ({ ...s, [product.id!]: false }));
    }
  }

  triggerCartPulse(): void {
    this.cartPulse.set(true);
    setTimeout(() => this.cartPulse.set(false), 1200);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  viewCart(): void {
    this.router.navigate(['/cliente/carrito-stock']);
  }

  viewMayoristaCart(): void {
    this.router.navigate(['/cliente/carrito']);
  }

  packLabel(product: Product): string {
    if (product.unitsPerPack > 1) return `Pack × ${product.unitsPerPack}`;
    return 'Unitario';
  }

  productEmoji(name: string): string {
    return getProductEmoji(name);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  trackById(_i: number, p: Product): string | undefined {
    return p.id;
  }
}
