import { Component, input, output, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterGroup {
  label: string;
  options: FilterOption[];
  selected: string[];
}

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-dropdown.html',
  styleUrl: './filter-dropdown.css',
})
export class FilterDropdownComponent {
  groups = input<FilterGroup[]>([]);
  filterChange = output<string[]>();
  activeLabel = input<string>('Filtrar');

  isOpen = signal(false);
  
  get selectedCount(): number {
    return this.groups().reduce((acc, g) => acc + g.selected.length, 0);
  }

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  isSelected(groupIndex: number, value: string | number): boolean {
    return this.groups()[groupIndex]?.selected.includes(String(value)) ?? false;
  }

  toggleOption(groupIndex: number, value: string | number): void {
    const groups = [...this.groups()];
    const group = { ...groups[groupIndex] };
    const selected = [...group.selected];
    const valueStr = String(value);
    const idx = selected.indexOf(valueStr);
    
    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      selected.push(valueStr);
    }
    
    group.selected = selected;
    groups[groupIndex] = group;
    
    // Notify parent
    const allSelected = groups.flatMap(g => g.selected);
    this.filterChange.emit(allSelected);
  }

  clearAll(): void {
    const groups = this.groups().map(g => ({ ...g, selected: [] }));
    this.filterChange.emit([]);
  }
}
