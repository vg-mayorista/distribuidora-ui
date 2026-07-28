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
  
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
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
  
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.sidebarOpen()) {
      this.closeSidebar();
    }
  }
  
  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
