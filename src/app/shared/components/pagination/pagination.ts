import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class PaginationComponent {
  
  // Inputs
  total = input.required<number>();
  pageSize = input<number>(10);
  currentPage = input<number>(1);
  
  // Output
  pageChange = output<number>();
  
  // Computed values
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | '...')[] = [];
    
    if (total <= 7) {
      // Show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }
      
      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < total - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(total);
    }
    
    return pages;
  });
  
  startItem = computed(() => {
    return Math.min((this.currentPage() - 1) * this.pageSize() + 1, this.total());
  });
  
  endItem = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.total());
  });
  
  showPrev = computed(() => this.currentPage() > 1);
  showNext = computed(() => this.currentPage() < this.totalPages());
  
  goToPage(page: number | '...'): void {
    if (typeof page === 'number' && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
  
  prevPage(): void {
    if (this.showPrev()) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }
  
  nextPage(): void {
    if (this.showNext()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
