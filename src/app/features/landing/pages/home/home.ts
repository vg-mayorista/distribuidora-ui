import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ProductService } from '../../../../services/product.service';
import { AuthService } from '../../../../services/auth.service';
import { UserSession } from '../../../../models/auth.model';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  currentUser$: Observable<UserSession | null> = this.authService.currentUser$;
  featured = signal<Product[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadFeatured();
  }

  loadFeatured(): void {
    this.loading.set(true);
    this.productService.getProducts().subscribe({
      next: (data) => {
        const active = data.content.filter(p => p.active).slice(0, 4);
        this.featured.set(active);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
  }
}
