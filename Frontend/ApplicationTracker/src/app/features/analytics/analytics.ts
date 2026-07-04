import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, finalize } from 'rxjs';

import { DailyCount, StatusCount } from '../applications/models/application.models';
import { ApplicationService } from '../applications/services/application.service';
import { buildAnalytics } from '../applications/utils/analytics.utils';
import { AppNav } from '../shared/components/app-nav/app-nav';

@Component({
  selector: 'app-analytics',
  imports: [DatePipe, DecimalPipe, MatIconModule, AppNav, MatProgressSpinnerModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics implements OnInit {
  private readonly applicationService = inject(ApplicationService);

  protected readonly dailyCounts = signal<DailyCount[]>([]);
  protected readonly statusCounts = signal<StatusCount[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly analytics = computed(() =>
    buildAnalytics(this.dailyCounts(), this.statusCounts()),
  );

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      dailyCounts: this.applicationService.getDailyCounts(),
      statusCounts: this.applicationService.getStatusCounts(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ dailyCounts, statusCounts }) => {
          this.dailyCounts.set(dailyCounts);
          this.statusCounts.set(statusCounts);
        },
        error: (error: Error) => this.loadError.set(error.message),
      });
  }
}
