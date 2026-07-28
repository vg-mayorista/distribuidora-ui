import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../../../services/category.service';
import { ProductService } from '../../../../services/product.service';
import { Category } from '../../../../models/category.model';
import { Product } from '../../../../models/product.model';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';
import { FilterDropdownComponent, FilterGroup } from '../../../../shared/components/filter-dropdown/filter-dropdown';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, FilterDropdownComponent, PaginationComponent, ButtonComponent, BadgeComponent, EmptyStateComponent],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  loading = false;
  error: string | null = null;
  searchTerm = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(6);
  totalElements = computed(() => this.filteredCategories().length);
  totalPages = computed(() => Math.ceil(this.filteredCategories().length / this.pageSize()));
  
  // Filters
  activeFilters = signal<string[]>([]);
  
  filterGroups = computed<FilterGroup[]>(() => [
    {
      label: 'Estado',
      options: [
        { label: 'Activas', value: 'status:active' },
        { label: 'Inactivas', value: 'status:inactive' },
      ],
      selected: this.activeFilters().filter(f => f.startsWith('status:')),
    },
  ]);
  
  filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filters = this.activeFilters();
    const statusFilters = filters.filter(f => f.startsWith('status:'));
    
    return this.categories().filter(c => {
      // Search filter
      if (term && !c.name.toLowerCase().includes(term)) {
        return false;
      }
      
      // Status filter
      if (statusFilters.length > 0) {
        const isActive = c.active;
        if (statusFilters.includes('status:active') && !isActive) return false;
        if (statusFilters.includes('status:inactive') && isActive) return false;
      }
      
      return true;
    });
  });
  
  paginatedCategories = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCategories().slice(start, start + this.pageSize());
  });

  showModal = signal(false);
  saving = signal(false);
  formError = signal<string | null>(null);
  newCategoryName = '';

  showEditModal = signal(false);
  editSaving = signal(false);
  editFormError = signal<string | null>(null);
  editCategory: Category | null = null;
  editName = '';

  showDeactivateModal = signal(false);
  deactivating = signal(false);
  categoryToDeactivate: Category | null = null;

  showActivateModal = signal(false);
  activating = signal(false);
  categoryToActivate: Category | null = null;

  // Warning modal
  showWarningModal = signal(false);
  warningMessage = signal('');
  categoryWithWarning: Category | null = null;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage.set(parseInt(params['page']) || 1);
      this.pageSize.set(parseInt(params['size']) || 6);
    });
    this.loadCategories();
    this.loadProducts();
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

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    this.categoryService.getCategories(true).subscribe({
      next: (activeData) => {
        const active = activeData.content;
        this.categoryService.getCategories(false).subscribe({
          next: (inactiveData) => {
            this.categories.set([...active, ...inactiveData.content]);
            this.loading = false;
          },
          error: () => {
            this.categories.set(active);
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar las categorías.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadProducts(): void {
    this.productService.getProducts(0, 1000).subscribe({
      next: (data) => {
        this.products.set(data.content);
        this.cdr.detectChanges();
      },
      error: () => {
        this.products.set([]);
      }
    });
  }

  getProductCount(categoryId: string | undefined): number {
    if (!categoryId) return 0;
    return this.products().filter(p => p.categoryId === categoryId).length;
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

  openModal(): void { this.formError.set(null); this.newCategoryName = ''; this.showModal.set(true); }
  closeModal(): void { if (this.saving()) return; this.showModal.set(false); }

  submitCategory(): void {
    if (!this.newCategoryName.trim()) { this.formError.set('El nombre es obligatorio.'); return; }
    this.saving.set(true); this.formError.set(null);
    this.categoryService.createCategory(this.newCategoryName.trim()).subscribe({
      next: (created) => {
        this.categories.update(cats => [...cats, created]);
        this.saving.set(false); this.showModal.set(false); this.cdr.detectChanges();
      },
      error: (err) => {
        this.formError.set(err.status === 409 ? 'Ya existe una categoría con ese nombre.' : 'No se pudo crear la categoría.');
        this.saving.set(false); this.cdr.detectChanges();
      },
    });
  }

  openEditModal(cat: Category): void {
    this.editFormError.set(null);
    this.editCategory = cat;
    this.editName = cat.name;
    this.showEditModal.set(true);
  }
  closeEditModal(): void { if (this.editSaving()) return; this.showEditModal.set(false); this.editCategory = null; }

  submitEdit(): void {
    if (!this.editName.trim()) { this.editFormError.set('El nombre es obligatorio.'); return; }
    if (!this.editCategory?.id) return;
    this.editSaving.set(true); this.editFormError.set(null);
    this.categoryService.updateCategory(this.editCategory.id, this.editName.trim()).subscribe({
      next: (updated) => {
        this.categories.update(cats => cats.map((c) => (c.id === updated.id ? updated : c)));
        this.editSaving.set(false); this.showEditModal.set(false); this.editCategory = null;
      },
      error: (err) => {
        this.editFormError.set(err.status === 409 ? 'Ya existe una categoría con ese nombre.' : 'No se pudo actualizar la categoría.');
        this.editSaving.set(false); this.cdr.detectChanges();
      },
    });
  }

  openDeactivateModal(cat: Category): void {
    if (!cat.id) return;
    const count = this.getProductCount(cat.id);
    if (count > 0) {
      this.warningMessage.set(`Esta categoría tiene ${count} ${count === 1 ? 'producto' : 'productos'} asociados. Reasigná esos productos a otra categoría antes de eliminarla.`);
      this.categoryWithWarning = cat;
      this.showWarningModal.set(true);
    } else {
      this.categoryToDeactivate = cat;
      this.showDeactivateModal.set(true);
    }
  }
  
  closeDeactivateModal(): void { if (this.deactivating()) return; this.showDeactivateModal.set(false); this.categoryToDeactivate = null; }
  closeWarningModal(): void { this.showWarningModal.set(false); this.categoryWithWarning = null; }

  confirmDeactivate(): void {
    if (!this.categoryToDeactivate?.id) return;
    this.deactivating.set(true);
    this.categoryService.deleteCategory(this.categoryToDeactivate.id).subscribe({
      next: () => {
        this.categories.update(cats => cats.map((c) =>
          c.id === this.categoryToDeactivate!.id ? { ...c, active: false } : c
        ));
        this.deactivating.set(false); this.showDeactivateModal.set(false); this.categoryToDeactivate = null;
      },
      error: (err) => {
        this.deactivating.set(false); this.showDeactivateModal.set(false); this.categoryToDeactivate = null;
        this.error = err.status === 409
          ? 'No se puede desactivar: la categoría tiene productos activos.'
          : 'No se pudo desactivar la categoría.';
        this.cdr.detectChanges();
      },
    });
  }

  // Activate modal
  openActivateModal(cat: Category): void { this.categoryToActivate = cat; this.showActivateModal.set(true); }
  closeActivateModal(): void { if (this.activating()) return; this.showActivateModal.set(false); this.categoryToActivate = null; }

  confirmActivate(): void {
    if (!this.categoryToActivate?.id) return;
    this.activating.set(true);
    this.categoryService.activateCategory(this.categoryToActivate.id).subscribe({
      next: (updated) => {
        this.categories.update(cats => cats.map((c) => (c.id === updated.id ? updated : c)));
        this.activating.set(false); this.showActivateModal.set(false); this.categoryToActivate = null;
      },
      error: () => {
        this.error = 'No se pudo activar la categoría.';
        this.activating.set(false); this.showActivateModal.set(false); this.categoryToActivate = null; this.cdr.detectChanges();
      },
    });
  }
}
