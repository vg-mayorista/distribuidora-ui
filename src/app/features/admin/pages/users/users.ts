import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../../../services/customer.service';
import { CustomerSummary, CreateUserRequest } from '../../../../models/customer.model';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { FilterDropdownComponent, FilterGroup } from '../../../../shared/components/filter-dropdown/filter-dropdown';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ModalComponent, FilterDropdownComponent, PaginationComponent,
    BadgeComponent, ButtonComponent, EmptyStateComponent,
  ],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class AdminUsersComponent implements OnInit {
  customers = signal<CustomerSummary[]>([]);
  loading = false;
  error: string | null = null;
  searchTerm = signal('');

  currentPage = signal(1);
  pageSize = signal(6);
  totalElements = computed(() => this.filteredCustomers().length);
  totalPages = computed(() => Math.ceil(this.filteredCustomers().length / this.pageSize()));

  showCreateModal = signal(false);
  createSaving = signal(false);
  createError = signal<string | null>(null);
  newUser = this.emptyCreateRequest();

  showConfirmModal = signal(false);
  toggling = signal(false);
  customerToToggle: CustomerSummary | null = null;

  activeFilters = signal<string[]>([]);

  filterGroups = computed<FilterGroup[]>(() => [
    {
      label: 'Estado',
      options: [
        { label: 'Activos', value: 'status:ACTIVE' },
        { label: 'Inactivos', value: 'status:INACTIVE' },
      ],
      selected: this.activeFilters().filter(f => f.startsWith('status:')),
    },
    {
      label: 'Rol',
      options: [
        { label: 'Distribuidor', value: 'role:ROLE_DISTRIBUTOR' },
        { label: 'Cliente', value: 'role:ROLE_CUSTOMER' },
      ],
      selected: this.activeFilters().filter(f => f.startsWith('role:')),
    },
  ]);

  filteredCustomers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filters = this.activeFilters();

    return this.customers().filter(c => {
      if (term) {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const matchesSearch =
          fullName.includes(term) ||
          c.email.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      const statusFilters = filters.filter(f => f.startsWith('status:'));
      if (statusFilters.length > 0) {
        const hasActiveFilter = statusFilters.includes('status:ACTIVE');
        const hasInactiveFilter = statusFilters.includes('status:INACTIVE');
        if ((hasActiveFilter && !c.active) || (hasInactiveFilter && c.active)) {
          return false;
        }
      }

      const roleFilters = filters.filter(f => f.startsWith('role:'));
      if (roleFilters.length > 0) {
        const selectedRoles = roleFilters.map(f => f.replace('role:', ''));
        if (!selectedRoles.includes(c.role)) {
          return false;
        }
      }

      return true;
    });
  });

  paginatedCustomers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCustomers().slice(start, start + this.pageSize());
  });

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage.set(parseInt(params['page']) || 1);
      this.pageSize.set(parseInt(params['size']) || 6);
    });
    this.loadCustomers();
  }

  private emptyCreateRequest(): CreateUserRequest {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'ROLE_DISTRIBUTOR',
    };
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

  loadCustomers(): void {
    this.loading = true;
    this.error = null;

    this.customerService.getCustomers('', 0, 1000).subscribe({
      next: (data) => {
        this.customers.set(data.content);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.error = 'No se pudieron cargar los clientes.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onFilterChange(selected: string[]): void {
    this.activeFilters.set(selected);
    this.currentPage.set(1);
    this.updateUrl();
  }

  onSearch(): void {
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

  openConfirmModal(customer: CustomerSummary): void {
    this.customerToToggle = customer;
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    if (this.toggling()) return;
    this.showConfirmModal.set(false);
    this.customerToToggle = null;
  }

  confirmToggle(): void {
    if (!this.customerToToggle?.id) return;

    this.toggling.set(true);
    this.customerService.toggleActive(this.customerToToggle.id).subscribe({
      next: (updated) => {
        this.customers.update(customers => customers.map((c) =>
          c.id === updated.id ? updated : c,
        ));
        this.toggling.set(false);
        this.showConfirmModal.set(false);
        this.customerToToggle = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo cambiar el estado del cliente.';
        this.toggling.set(false);
        this.showConfirmModal.set(false);
        this.customerToToggle = null;
        this.cdr.detectChanges();
      },
    });
  }

  openCreateModal(): void {
    this.createError.set(null);
    this.newUser = this.emptyCreateRequest();
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    if (this.createSaving()) return;
    this.showCreateModal.set(false);
  }

  submitCreate(): void {
    if (!this.newUser.firstName.trim()) {
      this.createError.set('El nombre es obligatorio.');
      return;
    }
    if (!this.newUser.lastName.trim()) {
      this.createError.set('El apellido es obligatorio.');
      return;
    }
    if (!this.newUser.email.trim()) {
      this.createError.set('El email es obligatorio.');
      return;
    }
    if (!this.newUser.password || this.newUser.password.length < 6) {
      this.createError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.createSaving.set(true);
    this.createError.set(null);

    this.customerService.createUser(this.newUser).subscribe({
      next: () => {
        this.createSaving.set(false);
        this.showCreateModal.set(false);
        this.loadCustomers();
      },
      error: (err) => {
        this.createError.set(
          err.status === 409
            ? 'Ya existe un usuario con ese email.'
            : 'No se pudo crear el usuario.'
        );
        this.createSaving.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  generateTempPassword(): string {
    return Math.random().toString(36).slice(-10);
  }

  useGeneratedPassword(): void {
    this.newUser.password = this.generateTempPassword();
  }

  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'ROLE_DISTRIBUTOR': return 'Distribuidor';
      case 'ROLE_ADMIN':  return 'Admin';
      case 'ROLE_CUSTOMER': return 'Cliente';
      default: return role;
    }
  }

  roleVariant(role: string): 'info' | 'warning' | 'neutral' {
    switch (role) {
      case 'ROLE_DISTRIBUTOR': return 'info';
      case 'ROLE_ADMIN': return 'warning';
      default: return 'neutral';
    }
  }
}
