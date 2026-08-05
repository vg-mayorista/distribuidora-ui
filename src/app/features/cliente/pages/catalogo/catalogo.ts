import { Component, OnInit, ChangeDetectorRef, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { BusinessConfigService } from '../../../../services/business-config.service';
import { CartStore } from '../../services/cart.store';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { getProductEmoji } from '../../../../shared/utils/product-emoji';

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
  configService = inject(BusinessConfigService);
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
  adding = signal<Record<string, boolean>>({});
  addedJustNow = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.configService.loadConfig();
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

  /**
   * Mayorista: el input no se capa por stock. Devuelve la cantidad pretendida.
   * Se mantiene el badge `isOutOfStock` solo como información; el cliente igual puede
   * pedir (será un pedido a fábrica).
   */
  getPacks(product: Product): number {
    if (!product.id) return 1;
    const lineInCart = this.cartStore.lines().find(l => l.product.id === product.id);
    if (lineInCart) {
      return lineInCart.packs;
    }
    const current = this.quantities[product.id] ?? 1;
    return Math.max(1, Math.floor(current));
  }

  setPacks(product: Product, packs: number): void {
    if (!product.id) return;
    const lineInCart = this.cartStore.lines().find(l => l.product.id === product.id);
    const safeMax = Number.MAX_SAFE_INTEGER;
    if (lineInCart) {
      if (packs <= 0) {
        this.cartStore.remove(product.id);
        this.quantities[product.id] = 1;
      } else {
        const clamped = Math.min(Math.max(1, Math.floor(packs)), safeMax);
        this.cartStore.setPacks(product.id, clamped);
      }
      this.triggerCartPulse();
    } else {
      this.quantities[product.id] = Math.max(1, Math.floor(packs));
    }
    this.cdr.detectChanges();
  }

  incPacks(product: Product): void {
    if (!product.id) return;
    const lineInCart = this.cartStore.lines().find(l => l.product.id === product.id);
    if (lineInCart) {
      this.cartStore.setPacks(product.id, lineInCart.packs + 1);
      this.triggerCartPulse();
    } else {
      const current = this.getPacks(product);
      this.quantities[product.id] = current + 1;
    }
  }

  decPacks(product: Product): void {
    if (!product.id) return;
    const lineInCart = this.cartStore.lines().find(l => l.product.id === product.id);
    if (lineInCart) {
      if (lineInCart.packs > 1) {
        this.cartStore.setPacks(product.id, lineInCart.packs - 1);
      } else {
        this.cartStore.remove(product.id);
        this.quantities[product.id] = 1;
      }
      this.triggerCartPulse();
    } else {
      const current = this.getPacks(product);
      if (current > 1) {
        this.quantities[product.id] = current - 1;
      }
    }
  }

  physicalUnits(product: Product): number {
    return this.getPacks(product) * Math.max(product.unitsPerPack, 1);
  }

  isInCart(product: Product): boolean {
    return !!product.id && this.cartStore.lines().some(l => l.product.id === product.id);
  }

  /**
   * Informativo. El catálogo mayorista no bloquea por stock: muestra el badge pero
   * permite pedir. La lógica de stock la maneja el flujo `/cliente/stock-disponible`.
   */
  isOutOfStock(product: Product): boolean {
    return product.stockStatus === 'OUT_OF_STOCK';
  }

  /**
   * Compat: en el flujo mayorista siempre hay "espacio" — devolvemos un número
   * muy alto para que la UI permita sumar sin tope. Se mantiene el método por si
   * alguna parte lo invoca.
   */
  maxPacksFor(product: Product): number {
    if (!product.id) return 0;
    return Number.MAX_SAFE_INTEGER;
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
    const packs = this.getPacks(product);
    if (packs <= 0) return;

    this.adding.update(s => ({ ...s, [product.id!]: true }));
    try {
      this.cartStore.add(product, packs);
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
