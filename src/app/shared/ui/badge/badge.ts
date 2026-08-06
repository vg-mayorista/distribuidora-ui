import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'active' | 'inactive' | 'warning' | 'info' | 'neutral' | 'success' | 'danger' | 'accent';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [class]="'badge--' + variant()"><ng-content></ng-content></span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      line-height: 1.2;
      white-space: nowrap;
    }
    .badge--active, .badge--success {
      background: var(--green-50);
      color: var(--green-900);
    }
    .badge--inactive, .badge--danger {
      background: var(--red-50);
      color: var(--red-500);
    }
    .badge--warning {
      background: var(--orange-50);
      color: var(--orange-900);
    }
    .badge--info {
      background: var(--neutral-50);
      color: var(--neutral-800);
    }
    .badge--neutral {
      background: var(--neutral-50);
      color: var(--neutral-400);
    }
    .badge--accent {
      background: #F2EEF8;
      color: #5B2A86;
    }
    /*
     * Colors registered in DESIGN.md (palette.accent / palette.accent-soft).
     * Used for the "stock" order-flow badge so it stays categorically distinct
     * from wholesale (info/gray) without implying success (green) or warning (orange).
     */
  `],
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
}
