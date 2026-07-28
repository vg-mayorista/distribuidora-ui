import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../../services/report.service';
import { SystemMetrics } from '../../../../models/report.model';
import { ButtonComponent } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class AdminReportesComponent implements OnInit {
  private reportService = inject(ReportService);

  metrics = signal<SystemMetrics | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.refreshMetrics();
  }

  refreshMetrics(): void {
    this.loading.set(true);
    this.reportService.systemMetrics().subscribe({
      next: (m) => { this.metrics.set(m); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
