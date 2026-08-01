import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { FilterDropdownComponent, FilterGroup } from '../../../../shared/components/filter-dropdown/filter-dropdown';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { getProductEmoji } from '../../../../shared/utils/product-emoji';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ModalComponent, PaginationComponent, FilterDropdownComponent,
    BadgeComponent, ButtonComponent, EmptyStateComponent,
  ],
  templateUrl: './stock.html',
  styleUrl: './stock.css',
})
export class StockComponent implements OnInit {

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  createModalOpen = signal(false);
  editModalOpen = signal(false);
  deactivateModalOpen = signal(false);

  saving = signal(false);
  editSaving = signal(false);
  deactivating = signal(false);

  formError = signal<string | null>(null);
  editFormError = signal<string | null>(null);

  newProduct = signal<Product>(this.emptyProduct());
  editProduct = signal<Product>(this.emptyProduct());

  productToDeactivate = signal<Product | null>(null);

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(6);
  totalElements = computed(() => this.filteredProducts().length);
  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize()));

  activeFilters = signal<string[]>([]);

  filterGroups = computed<FilterGroup[]>(() => [
    {
      label: 'Categoría',
      options: this.categories().map(c => ({ label: c.name, value: 'cat:' + (c.id ?? '') })),
      selected: this.activeFilters().filter(f => f.startsWith('cat:')),
    },
    {
      label: 'Estado',
      options: [
        { label: 'Activos', value: 'status:active' },
        { label: 'Inactivos', value: 'status:inactive' },
      ],
      selected: this.activeFilters().filter(f => f.startsWith('status:')),
    },
  ]);

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filters = this.activeFilters();

    return this.products().filter(p => {
      if (term) {
        const matchesSearch =
          p.name.toLowerCase().includes(term) ||
          (p.description ?? '').toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      const catFilters = filters.filter(f => f.startsWith('cat:'));
      if (catFilters.length > 0) {
        const selected = catFilters.map(f => f.replace('cat:', ''));
        if (!selected.includes(p.categoryId ?? '')) return false;
      }
      const statusFilters = filters.filter(f => f.startsWith('status:'));
      if (statusFilters.length > 0) {
        const wantActive = statusFilters.includes('status:active');
        const wantInactive = statusFilters.includes('status:inactive');
        if (wantActive && !p.active) return false;
        if (wantInactive && p.active) return false;
      }
      return true;
    });
  });

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage.set(parseInt(params['page']) || 1);
      this.pageSize.set(parseInt(params['size']) || 6);
    });
    this.loadCategories();
    this.loadProducts();
  }

  private emptyProduct(): Product {
    return {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      stockStatus: 'IN_STOCK',
      lowStockThreshold: null,
      unitsPerPack: 1,
      imageUrl: '',
      active: true,
    };
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
        this.loading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data.content),
      error: () => {},
    });
  }

  openCreateModal(): void {
    this.newProduct.set(this.emptyProduct());
    this.formError.set(null);
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.saving()) return;
    this.createModalOpen.set(false);
  }

  submitCreate(): void {
    const p = this.newProduct();
    if (!p.name.trim()) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }
    if (p.price < 0) {
      this.formError.set('El precio no puede ser negativo.');
      return;
    }
    if ((p.stock ?? 0) < 0) {
      this.formError.set('El stock no puede ser negativo.');
      return;
    }
    if (p.unitsPerPack < 1) {
      this.formError.set('Las unidades por pack deben ser al menos 1.');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    this.productService.addProduct(p).subscribe({
      next: (created) => {
        this.products.update(list => [created, ...list]);
        this.saving.set(false);
        this.createModalOpen.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.detail || 'No se pudo crear el producto.');
      }
    });
  }

  openEditModal(product: Product): void {
    this.editProduct.set({ ...product });
    this.editFormError.set(null);
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    if (this.editSaving()) return;
    this.editModalOpen.set(false);
  }

  submitEdit(): void {
    const p = this.editProduct();
    if (!p.id) return;
    if (!p.name.trim()) {
      this.editFormError.set('El nombre es obligatorio.');
      return;
    }
    this.editSaving.set(true);
    this.editFormError.set(null);
    this.productService.updateProduct(p.id, p).subscribe({
      next: (updated) => {
        this.products.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editSaving.set(false);
        this.editModalOpen.set(false);
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editFormError.set(err?.error?.detail || 'No se pudo actualizar el producto.');
      }
    });
  }

  openDeactivateModal(product: Product): void {
    this.productToDeactivate.set(product);
    this.deactivateModalOpen.set(true);
  }

  closeDeactivateModal(): void {
    if (this.deactivating()) return;
    this.deactivateModalOpen.set(false);
    this.productToDeactivate.set(null);
  }

  confirmDeactivate(): void {
    const product = this.productToDeactivate();
    if (!product?.id) return;
    this.deactivating.set(true);
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update(list => list.map(x => x.id === product.id ? { ...x, active: false } : x));
        this.deactivating.set(false);
        this.deactivateModalOpen.set(false);
        this.productToDeactivate.set(null);
      },
      error: () => {
        this.deactivating.set(false);
      }
    });
  }

  reactivate(product: Product): void {
    if (!product.id) return;
    this.productService.activateProduct(product.id).subscribe({
      next: (updated) => {
        this.products.update(list => list.map(x => x.id === updated.id ? updated : x));
      },
      error: () => {}
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.updateUrl();
  }

  onFilterChange(selected: string[]): void {
    this.activeFilters.set(selected);
    this.currentPage.set(1);
    this.updateUrl();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updateUrl();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.updateUrl();
  }

  private updateUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage() > 1 ? this.currentPage() : null,
        size: this.pageSize() !== 6 ? this.pageSize() : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  trackById(_i: number, p: Product): string | undefined { return p.id; }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }

  categoryName(categoryId: string | undefined): string {
    if (!categoryId) return '—';
    return this.categories().find(c => c.id === categoryId)?.name ?? categoryId.slice(0, 8);
  }

  productEmoji(name: string): string {
    return getProductEmoji(name);
  }
}
