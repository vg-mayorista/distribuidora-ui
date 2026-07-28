import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div *ngIf="icon()" class="empty-state-icon">{{ icon() }}</div>
      <p class="empty-state-title">{{ title() }}</p>
      <p *ngIf="message()" class="empty-state-text">{{ message() }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl) var(--space-md);
      text-align: center;
    }
    .empty-state-icon {
      font-size: 2.5rem;
      margin-bottom: var(--space-md);
      opacity: 0.6;
      color: var(--color-text-muted);
    }
    .empty-state-title {
      font-family: var(--font-display);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-strong);
      margin: 0 0 var(--space-xs);
    }
    .empty-state-text {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin: 0 0 var(--space-md);
      max-width: 400px;
    }
  `],
})
export class EmptyStateComponent {
  icon = input<string>('');
  title = input.required<string>();
  message = input<string>('');
}
