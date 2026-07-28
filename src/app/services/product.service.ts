import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { Product } from '../models/product.model';
import { ProductPage } from '../models/product-page.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/products';
  }

  getProducts(page = 0, size = 1000): Observable<ProductPage> {
    return this.http.get<ProductPage>(this.apiUrl, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, {
      categoryId: product.categoryId ?? null,
      imageUrl: product.imageUrl ?? null,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock ?? 0,
      unitsPerPack: product.unitsPerPack ?? 1,
    });
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, {
      categoryId: product.categoryId ?? null,
      imageUrl: product.imageUrl ?? null,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      unitsPerPack: product.unitsPerPack ?? 1,
    });
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activateProduct(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Busca productos por nombre.
   */
  searchProducts(query: string): Observable<ProductPage> {
    return this.http.get<ProductPage>(`${this.apiUrl}/search`, {
      params: { name: query, page: '0', size: '5' }
    });
  }
}

