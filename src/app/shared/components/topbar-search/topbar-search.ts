import { Component, inject, signal, OnInit, AfterViewInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';

interface SearchResult {
  type: 'product' | 'command';
  label: string;
  sublabel?: string;
  action: () => void;
  icon: string;
}

interface Command {
  trigger: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-topbar-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar-search.html',
  styleUrl: './topbar-search.css',
})
export class TopbarSearchComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private productService = inject(ProductService);
  private elementRef = inject(ElementRef);

  searchTerm = signal('');
  results = signal<SearchResult[]>([]);
  isOpen = signal(false);
  loading = signal(false);
  selectedIndex = signal(-1);
  private searchInput!: HTMLInputElement;
  private boundHandleKeydown!: (event: KeyboardEvent) => void;

  ngOnInit(): void {
    this.boundHandleKeydown = this.handleGlobalKeydown.bind(this);
    document.addEventListener('keydown', this.boundHandleKeydown);
  }

  ngAfterViewInit(): void {
    this.searchInput = this.elementRef.nativeElement.querySelector('.topbar-search-input');
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.boundHandleKeydown);
  }

  private handleGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      if (this.searchInput) {
        this.searchInput.focus();
        this.isOpen.set(true);
      }
    }
  }

  private commands: Command[] = [
    { trigger: '@stock', label: 'Ir a Stock', route: '/admin/stock' },
    { trigger: '@categorias', label: 'Ir a Categorías', route: '/admin/categorias' },
    { trigger: '@pedidos', label: 'Ir a Pedidos', route: '/admin/ordenes' },
    { trigger: '@usuarios', label: 'Ir a Usuarios', route: '/admin/usuarios' },
  ];

  get hasResults(): boolean {
    return this.results().length > 0;
  }

  get showNoResults(): boolean {
    return this.searchTerm().trim().length > 0 && !this.loading() && this.results().length === 0;
  }

  onSearch(): void {
    const term = this.searchTerm().trim();

    if (!term) {
      this.results.set([]);
      this.isOpen.set(false);
      return;
    }

    this.isOpen.set(true);
    this.selectedIndex.set(-1);

    if (term.startsWith('@')) {
      const commandResults = this.commands
        .filter(cmd => cmd.trigger.toLowerCase().includes(term.toLowerCase()))
        .map(cmd => ({
          type: 'command' as const,
          label: cmd.label,
          sublabel: cmd.trigger,
          action: () => this.navigateTo(cmd.route),
          icon: 'nav',
        }));
      this.results.set(commandResults);
      return;
    }

    this.loading.set(true);
    this.results.set([]);
    this.productService.searchProducts(term).subscribe({
      next: (data) => {
        const products: Product[] = data.content || [];
        const results: SearchResult[] = products.slice(0, 8).map(p => ({
          type: 'product',
          label: p.name,
          sublabel: `Stock: ${p.stock ?? 0}`,
          action: () => this.navigateTo('/admin/stock'),
          icon: 'product',
        }));
        this.results.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.results();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => Math.max(i - 1, -1));
    } else if (event.key === 'Enter' && this.selectedIndex() >= 0) {
      event.preventDefault();
      const selected = items[this.selectedIndex()];
      if (selected) {
        selected.action();
        this.clear();
      }
    } else if (event.key === 'Escape') {
      this.clear();
    }
  }

  selectResult(result: SearchResult): void {
    result.action();
    this.clear();
  }

  clear(): void {
    this.searchTerm.set('');
    this.results.set([]);
    this.isOpen.set(false);
    this.selectedIndex.set(-1);
  }

  private navigateTo(route: string): void {
    this.router.navigate([route]);
    this.clear();
  }

  trackByIndex(index: number): number {
    return index;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
