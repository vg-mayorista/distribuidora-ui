import { Component, OnInit, ChangeDetectorRef, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
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
  private cart = inject(CartStore);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<string | null>(null);
  searchTerm = signal('');

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

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data.content.filter(p => p.active));
        this.loading.set(false);
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
    if (product.stock <= 0) return 0;
    return this.quantities[product.id] ?? 1;
  }

  setPacks(product: Product, packs: number): void {
    if (!product.id) return;
    if (product.stock <= 0) {
      this.quantities[product.id] = 0;
      return;
    }
    const maxPacks = Math.floor(product.stock / Math.max(product.unitsPerPack, 1));
    this.quantities[product.id] = Math.max(1, Math.min(packs, maxPacks || 1));
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
    return !!product.id && this.cart.lines().some(l => l.product.id === product.id);
  }

  addToCart(product: Product): void {
    if (!product.id) return;
    const packs = this.getPacks(product);
    if (packs <= 0) return;
    this.cart.add(product, packs);
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
