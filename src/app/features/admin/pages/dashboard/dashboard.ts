import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { UserSession } from '../../../../models/auth.model';
import { TopbarSearchComponent } from '../../../../shared/components/topbar-search/topbar-search';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TopbarSearchComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboard implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  sidebarOpen = signal(false);
  currentUser: UserSession | null = null;
  menuOpen = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  toggleUserMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 768) {
      this.closeSidebar();
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.menuOpen = false;
    if (this.sidebarOpen()) {
      this.closeSidebar();
    }
  }

  initials(user: UserSession | null): string {
    if (!user) return 'U';
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || 'U';
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN': return 'Administrador IT';
      case 'ROLE_DISTRIBUTOR': return 'Distribuidor';
      case 'ROLE_CUSTOMER': return 'Cliente';
      default: return role;
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
