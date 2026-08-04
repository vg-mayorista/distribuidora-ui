import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-live]="ariaLive()"
      [class]="'btn btn--' + variant() + ' btn--' + size() + (block() ? ' btn--block' : '') + (loading() ? ' btn--loading' : '')"
      (click)="onClick.emit()">
      <span *ngIf="loading()" class="btn-spinner" aria-hidden="true"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      padding: 0.625rem 1.25rem;
      min-height: 2.5rem;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      line-height: 1;
      border: 1px solid transparent;
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
      white-space: nowrap;
      user-select: none;
      touch-action: manipulation;
    }

    @media (max-width: 768px), (pointer: coarse) {
      .btn {
        min-height: 44px;
      }
    }

    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn:focus { outline: none; }
    .btn:focus-visible {
      outline: 2px solid var(--color-text-strong);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(242, 121, 14, 0.2);
    }
    .btn--sm { padding: 0.4375rem 0.875rem; font-size: var(--font-size-xs); }
    @media (max-width: 768px), (pointer: coarse) {
      .btn--sm {
        min-height: 44px;
        padding-top: 0.625rem;
        padding-bottom: 0.625rem;
      }
    }
    .btn--block { width: 100%; }
    .btn--loading { opacity: 0.7; }
    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: var(--radius-full);
      animation: btn-spin 0.6s linear infinite;
    }
    @keyframes btn-spin { to { transform: rotate(360deg); } }

    .btn--primary { background: var(--orange-base); color: var(--color-text-inverse); border-color: var(--orange-base); }
    .btn--primary:hover:not(:disabled) { background: var(--orange-600); border-color: var(--orange-600); }
    .btn--primary:active:not(:disabled) { background: var(--orange-700); border-color: var(--orange-700); }

    .btn--secondary { background: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
    .btn--secondary:hover:not(:disabled) { background: var(--color-surface-alt); border-color: var(--color-border-strong); }

    .btn--ghost { background: transparent; color: var(--color-text); border-color: transparent; }
    .btn--ghost:hover:not(:disabled) { background: var(--color-surface-alt); }

    .btn--danger { background: var(--color-danger); color: var(--color-text-inverse); border-color: var(--color-danger); }
    .btn--danger:hover:not(:disabled) { background: var(--color-danger-hover); border-color: var(--color-danger-hover); }

    .btn--danger-outline { background: transparent; color: var(--color-danger); border-color: var(--color-danger); }
    .btn--danger-outline:hover:not(:disabled) { background: var(--color-danger-soft); }

    .btn--success { background: var(--green-base); color: var(--color-text-inverse); border-color: var(--green-base); }
    .btn--success:hover:not(:disabled) { background: var(--green-600); border-color: var(--green-600); }
  `],
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  block = input<boolean>(false);
  ariaLabel = input<string | undefined>(undefined);
  ariaLive = input<'polite' | 'assertive' | 'off' | undefined>(undefined);

  onClick = output<void>();
}
