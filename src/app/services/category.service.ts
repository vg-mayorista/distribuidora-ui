import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/tokens/api-base.token';
import { Category, CategoryPage } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = inject(API_BASE) + '/api/categories';
  }

  getCategories(active = true): Observable<CategoryPage> {
    const params = new HttpParams().set('active', String(active));
    return this.http.get<CategoryPage>(this.apiUrl, { params });
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, { name });
  }

  updateCategory(id: string, name: string): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, { name });
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activateCategory(id: string): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${id}/activate`, {});
  }
}
