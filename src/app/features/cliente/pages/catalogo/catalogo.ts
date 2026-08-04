import { Component, OnInit, ChangeDetectorRef, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { CartService } from '../../../../services/cart.service';
import { CartStore } from '../../services/cart.store';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { Product, StockStatus } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { getProductEmoji } from '../../../../shared/utils/product-emoji';
import { firstValueFrom } from 'rxjs';

const MAX_PACKS_PER_LINE = 99;

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, BadgeComponent],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class CatalogoComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  cartStore = inject(CartStore);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<string | null>(null);
  searchTerm = signal('');
  viewMode = signal<'grid' | 'table'>('grid');
  isScrolled = signal(false);
  cartPulse = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 120);
    }
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setViewMode(mode: 'grid' | 'table'): void {
    this.viewMode.set(mode);
  }

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const categoryId = this.selectedCategoryId();
    let list = this.products();

    if (categoryId) {
      list = list.filter(p => p.categoryId === categoryId);
    }

    if (!term) return list;
    return list.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description ?? '').toLowerCase().includes(term)
    );
  });

  loading = signal(false);
  error = signal<string | null>(null);
  quantities: Record<string, number> = {};
  maxPacksByProduct: Record<string, number> = {};
  adding = signal<Record<string, boolean>>({});
  addedJustNow = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (data) => {
        const activeProducts = data.content.filter(p => p.active);
        this.products.set(activeProducts);
        this.loading.set(false);
        for (const p of activeProducts) {
          if (p.id && !(p.id in this.quantities)) {
            this.quantities[p.id] = 1;
          }
        }
        const productIds = activeProducts.map(p => p.id).filter((id): id is string => !!id);
        if (productIds.length > 0) {
          this.cartService.checkStock(productIds).subscribe({
            next: (stockMap) => {
              for (const p of activeProducts) {
                if (p.id && p.id in stockMap) {
                  const physicalStock = Math.max(0, stockMap[p.id] ?? 0);
                  const unitsPerPack = Math.max(p.unitsPerPack ?? 1, 1);
                  this.maxPacksByProduct[p.id] = Math.floor(physicalStock / unitsPerPack);
                }
              }
              this.cdr.detectChanges();
            },
            error: (err) => console.error('Error al consultar stock inicial:', err)
          });
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
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

  getPacks(product: Product): number {
    if (!product.id) return 1;
    if (this.isOutOfStock(product)) return 0;
    const maxPacks = this.maxPacksFor(product);
    if (maxPacks <= 0) return 0;
    const current = this.quantities[product.id] ?? 1;
    return Math.min(Math.max(1, current), maxPacks);
  }

  setPacks(product: Product, packs: number): void {
    if (!product.id) return;
    if (this.isOutOfStock(product)) {
      this.quantities[product.id] = 0;
      return;
    }
    const maxPacks = this.maxPacksFor(product);
    if (maxPacks <= 0) {
      this.quantities[product.id] = 0;
      this.cdr.detectChanges();
      return;
    }
    this.quantities[product.id] = Math.max(1, Math.min(packs, maxPacks));
    this.cdr.detectChanges();
  }

  incPacks(product: Product): void {
    this.setPacks(product, this.getPacks(product) + 1);
  }

  decPacks(product: Product): void {
    this.setPacks(product, this.getPacks(product) - 1);
  }

  physicalUnits(product: Product): number {
    return this.getPacks(product) * Math.max(product.unitsPerPack, 1);
  }

  isInCart(product: Product): boolean {
    return !!product.id && this.cartStore.lines().some(l => l.product.id === product.id);
  }

  isOutOfStock(product: Product): boolean {
    return product.stockStatus === 'OUT_OF_STOCK';
  }

  maxPacksFor(product: Product): number {
    if (!product.id) return 0;
    if (this.isOutOfStock(product)) return 0;

    let totalStockPacks = MAX_PACKS_PER_LINE;

    if (typeof product.stock === 'number' && product.stock > 0) {
      const unitsPerPack = product.unitsPerPack && product.unitsPerPack > 0 ? product.unitsPerPack : 1;
      totalStockPacks = Math.floor(product.stock / unitsPerPack);
    }

    if (this.maxPacksByProduct[product.id] != null) {
      totalStockPacks = Math.min(totalStockPacks, this.maxPacksByProduct[product.id]);
    }

    const lineInCart = this.cartStore.lines().find(l => l.product.id === product.id);
    const packsInCart = lineInCart ? lineInCart.packs : 0;

    return Math.max(0, totalStockPacks - packsInCart);
  }

  stockBadgeVariant(product: Product): 'active' | 'warning' | 'inactive' {
    if (product.stockStatus === 'OUT_OF_STOCK') return 'inactive';
    if (product.stockStatus === 'LOW_STOCK') return 'warning';
    return 'active';
  }

  stockBadgeLabel(product: Product): string {
    if (product.stockStatus === 'OUT_OF_STOCK') return 'Sin stock';
    if (product.stockStatus === 'LOW_STOCK') return 'Stock bajo';
    return 'En stock';
  }

  async addToCart(product: Product): Promise<void> {
    if (!product.id) return;
    if (this.isOutOfStock(product)) return;
    const maxAvailable = this.maxPacksFor(product);
    if (maxAvailable <= 0) return;
    const packs = Math.min(this.getPacks(product), maxAvailable);
    if (packs <= 0) return;

    this.adding.update(s => ({ ...s, [product.id!]: true }));
    try {
      const stockMap = await firstValueFrom(this.cartService.checkStock([product.id]));
      const stock = Math.max(0, stockMap[product.id] ?? 0);
      const unitsPerPack = Math.max(product.unitsPerPack, 1);
      const maxAllowedTotal = Math.floor(stock / unitsPerPack);
      this.maxPacksByProduct[product.id] = maxAllowedTotal;

      const currentLine = this.cartStore.lines().find(l => l.product.id === product.id);
      const alreadyInCart = currentLine ? currentLine.packs : 0;
      const realMaxCanAdd = Math.max(0, maxAllowedTotal - alreadyInCart);
      const capped = Math.min(packs, realMaxCanAdd);
      if (capped <= 0) {
        this.error.set('No hay más stock disponible para este producto.');
        return;
      }
      this.cartStore.add(product, capped, maxAllowedTotal);
      this.triggerCartPulse();
      this.quantities[product.id] = 1;
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
    setTimeout(() => {
      this.cartPulse.set(false);
    }, 1200);
  }

  viewCart(): void {
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
