import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .app-content {
      flex: 1 0 auto;
    }
  `],
  template: `
    <app-navbar></app-navbar>
    <main class="app-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `
})
export class MainLayoutComponent {}
