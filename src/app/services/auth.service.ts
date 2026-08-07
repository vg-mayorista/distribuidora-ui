import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, UserSession } from '../models/auth.model';
import { API_BASE } from '../core/tokens/api-base.token';

const TOKEN_KEY = 'distribuidora.auth.token';
const USER_KEY = 'distribuidora.auth.user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = inject(API_BASE) + '/api/auth';

  /**
   * Rehidrata la sesión desde localStorage al iniciar la app, de modo que
   * getCurrentUser() y isLoggedIn() devuelven el valor correcto inmediatamente
   * después de un F5 o al reabrir el browser (localStorage persiste entre
   * sesiones del browser, a diferencia de sessionStorage).
   */
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private http = inject(HttpClient);

  constructor() {
    // Rehidratar usuario desde localStorage al recargar la página
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        this.currentUserSubject.next(JSON.parse(raw));
      } catch {
        // JSON corrupto: limpiar
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.saveSession(response))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.saveSession(response))
    );
  }

  logout(): Observable<void> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return of(void 0);
    }
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => { this.clearSession(); return of(void 0); })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): UserSession | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveSession(response: AuthResponse): void {
    const user: UserSession = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      address: response.address,
      phone: response.phone,
      zone: response.zone,
      latitude: response.latitude,
      longitude: response.longitude,
    };
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Limpieza defensiva: eliminar posibles keys legacy de sessionStorage
    try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
    try { sessionStorage.removeItem(USER_KEY); } catch {}
    try { localStorage.removeItem('auth_token'); } catch {}
    try { localStorage.removeItem('auth_user'); } catch {}
    this.currentUserSubject.next(null);
  }
}
