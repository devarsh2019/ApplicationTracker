import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';

import {
  ApplicationPayload,
  DailyCount,
  JobApplication,
  applicationStatusLabel,
} from '../applications/models/application.models';
import { ApplicationService } from '../applications/services/application.service';
import { formatIsoDate, shiftIsoDate } from '../applications/utils/analytics.utils';
import { AppNav } from '../shared/components/app-nav/app-nav';
import {
  ApplicationFormDialog,
  ApplicationFormDialogData,
} from './components/application-form-dialog/application-form-dialog';

@Component({
  selector: 'app-dashboard',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    AppNav,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly applicationService = inject(ApplicationService);
  private readonly dialog = inject(MatDialog);

  protected readonly applications = signal<JobApplication[]>([]);
  protected readonly dailyCounts = signal<DailyCount[]>([]);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly totalElements = signal(0);
  protected readonly totalApplications = signal(0);
  protected readonly isLoading = signal(true);
  protected readonly actionError = signal<string | null>(null);
  protected readonly dateControl = new FormControl<Date | null>(null);
  protected readonly displayedColumns = [
    'companyName',
    'appliedDate',
    'status',
    'dateCount',
    'companyLink',
    'contactFollowUp',
    'notes',
    'actions',
  ];

  protected readonly visibleColumns = computed(() => {
    if (this.isDateFilterActive()) {
      return ['companyName', 'status', 'companyLink', 'contactFollowUp', 'notes', 'actions'];
    }
    return this.displayedColumns;
  });

  protected readonly countByDate = computed(() => {
    const map = new Map<string, number>();
    for (const row of this.dailyCounts()) {
      map.set(row.appliedDate, row.count);
    }
    return map;
  });

  protected readonly filteredCount = computed(() =>
    this.isDateFilterActive() ? this.totalElements() : this.totalApplications(),
  );

  protected readonly isTodaySelected = computed(() => this.selectedDate() === formatIsoDate(new Date()));

  ngOnInit(): void {
    this.goToToday();
    this.loadData();
  }

  protected isDateFilterActive(): boolean {
    return this.selectedDate() !== null;
  }

  protected countForDate(appliedDate: string | null): number {
    if (!appliedDate) {
      return 0;
    }
    return this.countByDate().get(appliedDate) ?? 0;
  }

  protected statusLabel = applicationStatusLabel;

  protected goToPreviousDate(): void {
    const current = this.selectedDate() ?? formatIsoDate(new Date());
    this.setSelectedDate(shiftIsoDate(current, -1));
  }

  protected goToNextDate(): void {
    const current = this.selectedDate() ?? formatIsoDate(new Date());
    this.setSelectedDate(shiftIsoDate(current, 1));
  }

  protected goToToday(): void {
    this.setSelectedDate(formatIsoDate(new Date()));
  }

  protected showAllDates(): void {
    this.setSelectedDate(null);
  }

  protected selectDate(appliedDate: string): void {
    this.setSelectedDate(appliedDate);
  }

  protected onDatePicked(event: MatDatepickerInputEvent<Date>): void {
    if (!event.value) {
      return;
    }
    this.setSelectedDate(formatIsoDate(event.value));
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadApplications();
  }

  protected openCreateDialog(): void {
    const prefillDate = this.selectedDate() ?? formatIsoDate(new Date());
    this.openDialog({
      mode: 'create',
      prefillAppliedDate: prefillDate,
    });
  }

  protected openEditDialog(application: JobApplication): void {
    this.openDialog({ mode: 'edit', application });
  }

  protected deleteApplication(application: JobApplication): void {
    const confirmed = confirm(`Delete application for ${application.companyName}?`);
    if (!confirmed) {
      return;
    }

    this.actionError.set(null);
    this.applicationService.delete(application.id).subscribe({
      next: () => this.loadData(),
      error: (error: Error) => this.actionError.set(error.message),
    });
  }

  protected openCompanyLink(link: string): void {
    const url = link.startsWith('http') ? link : `https://${link}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected loadData(): void {
    this.isLoading.set(true);
    this.actionError.set(null);

    this.applicationService.getStats().subscribe({
      next: (stats) => this.totalApplications.set(stats.totalApplications),
      error: (error: Error) => this.actionError.set(error.message),
    });

    this.applicationService.getDailyCounts().subscribe({
      next: (counts) => this.dailyCounts.set(counts),
      error: (error: Error) => this.actionError.set(error.message),
    });

    this.loadApplications();
  }

  private loadApplications(): void {
    this.isLoading.set(true);

    this.applicationService
      .list({
        page: this.pageIndex(),
        size: this.pageSize(),
        appliedDate: this.selectedDate(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.applications.set(page.content);
          this.totalElements.set(page.totalElements);
        },
        error: (error: Error) => this.actionError.set(error.message),
      });
  }

  private setSelectedDate(value: string | null): void {
    this.selectedDate.set(value);
    this.pageIndex.set(0);
    this.dateControl.setValue(value ? new Date(`${value}T00:00:00`) : null, { emitEvent: false });
    this.loadApplications();
  }

  private openDialog(data: ApplicationFormDialogData): void {
    const dialogRef = this.dialog.open(ApplicationFormDialog, {
      data,
      width: '32rem',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((payload: ApplicationPayload | undefined) => {
      if (!payload) {
        return;
      }

      this.actionError.set(null);
      const request$ =
        data.mode === 'create'
          ? this.applicationService.create(payload)
          : this.applicationService.update(data.application!.id, payload);

      request$.subscribe({
        next: () => this.loadData(),
        error: (error: Error) => this.actionError.set(error.message),
      });
    });
  }
}
