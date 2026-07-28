import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../../services/report.service';
import { VolumeAndTicket, TopProduct, TopCustomer, LowStock } from '../../../../models/report.model';
import { ButtonComponent } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class AdminReportesComponent implements OnInit {
  private reportService = inject(ReportService);

  from = signal<string>(this.firstOfMonth());
  to = signal<string>(this.today());

  volume = signal<VolumeAndTicket | null>(null);
  topProducts = signal<TopProduct[]>([]);
  topCustomers = signal<TopCustomer[]>([]);
  lowStock = signal<LowStock[]>([]);

  loadingVolume = signal(false);
  loadingTopProducts = signal(false);
  loadingTopCustomers = signal(false);
  loadingLowStock = signal(false);

  lowStockThreshold = signal<number>(10);

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.refreshVolume();
    this.refreshTopProducts();
    this.refreshTopCustomers();
    this.refreshLowStock();
  }

  refreshVolume(): void {
    this.loadingVolume.set(true);
    this.reportService.volume(this.filters()).subscribe({
      next: (v) => { this.volume.set(v); this.loadingVolume.set(false); },
      error: () => this.loadingVolume.set(false),
    });
  }

  refreshTopProducts(): void {
    this.loadingTopProducts.set(true);
    this.reportService.topProducts({ ...this.filters(), limit: 10 }).subscribe({
      next: (rows) => { this.topProducts.set(rows); this.loadingTopProducts.set(false); },
      error: () => this.loadingTopProducts.set(false),
    });
  }

  refreshTopCustomers(): void {
    this.loadingTopCustomers.set(true);
    this.reportService.topCustomers({ ...this.filters(), limit: 10 }).subscribe({
      next: (rows) => { this.topCustomers.set(rows); this.loadingTopCustomers.set(false); },
      error: () => this.loadingTopCustomers.set(false),
    });
  }

  refreshLowStock(): void {
    this.loadingLowStock.set(true);
    this.reportService.lowStock(this.lowStockThreshold()).subscribe({
      next: (rows) => { this.lowStock.set(rows); this.loadingLowStock.set(false); },
      error: () => this.loadingLowStock.set(false),
    });
  }

  exportVolumeCsv(): void {
    this.download(this.reportService.exportUrl('volume', this.filters()));
  }

  exportTopProductsCsv(): void {
    this.download(this.reportService.exportUrl('top-products', this.filters()));
  }

  exportTopCustomersCsv(): void {
    this.download(this.reportService.exportUrl('top-customers', this.filters()));
  }

  exportLowStockCsv(): void {
    this.download(this.reportService.exportUrl('low-stock', { threshold: this.lowStockThreshold() }));
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
