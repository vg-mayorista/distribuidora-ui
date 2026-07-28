import { Component, input, output, ElementRef, viewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class ModalComponent {
  
  // Inputs
  open = input.required<boolean>();
  title = input<string>('');
  size = input<'sm' | 'md' | 'lg'>('md');
  closeOnBackdrop = input<boolean>(true);
  
  // Output
  close = output<void>();
  
  // Internal state
  private previouslyFocused: HTMLElement | null = null;
  modalContent = viewChild<ElementRef>('modalContent');
  

  
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open()) {
      this.close.emit();
    }
  }
  
  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.close.emit();
    }
  }
  
  onCloseClick(): void {
    this.close.emit();
  }
  
  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
