import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../../services/report.service';
import { VolumeAndTicket, TopProduct, TopCustomer } from '../../../../models/report.model';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-distribuidor-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, EmptyStateComponent],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class DueñoReportesComponent implements OnInit {
  private reportService = inject(ReportService);

  from = signal<string>(this.firstOfMonth());
  to = signal<string>(this.today());

  volume = signal<VolumeAndTicket | null>(null);
  topProducts = signal<TopProduct[]>([]);
  topCustomers = signal<TopCustomer[]>([]);

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.refreshVolume();
    this.refreshTopProducts();
    this.refreshTopCustomers();
  }

  refreshVolume(): void {
    this.reportService.volume(this.filters()).subscribe({
      next: (v) => this.volume.set(v),
      error: () => { /* silencioso */ },
    });
  }

  refreshTopProducts(): void {
    this.reportService.topProducts({ ...this.filters(), limit: 10 }).subscribe({
      next: (rows) => this.topProducts.set(rows),
      error: () => { /* silencioso */ },
    });
  }

  refreshTopCustomers(): void {
    this.reportService.topCustomers({ ...this.filters(), limit: 10 }).subscribe({
      next: (rows) => this.topCustomers.set(rows),
      error: () => { /* silencioso */ },
    });
  }

  exportTopProductsCsv(): void {
    this.download(this.reportService.exportUrl('top-products', this.filters()));
  }

  exportTopCustomersCsv(): void {
    this.download(this.reportService.exportUrl('top-customers', this.filters()));
  }

  customerName(c: TopCustomer): string {
    return ((c.firstName ?? '') + ' ' + (c.lastName ?? '')).trim() || c.email;
  }

  formatPrice(v: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);
  }

  private download(url: string): void {
    window.open(url, '_blank');
  }

  private filters(): { from?: string; to?: string } {
    return { from: this.from() || undefined, to: this.to() || undefined };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private firstOfMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
