import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';

import { AppNav } from '../shared/components/app-nav/app-nav';
import {
  CalendarEventDialog,
  CalendarEventDialogData,
} from './components/calendar-event-dialog/calendar-event-dialog';
import { CALENDAR_EVENT_COLORS, CalendarEvent, CalendarEventPayload } from './models/calendar.models';
import { CalendarService } from './services/calendar.service';
import {
  buildMonthGrid,
  formatEventTime,
  formatIsoDate,
  getMonthRange,
  groupEventsByDate,
} from './utils/calendar.utils';

@Component({
  selector: 'app-calendar',
  imports: [
    DatePipe,
    LowerCasePipe,
    AppNav,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class CalendarPage {
  private readonly calendarService = inject(CalendarService);
  private readonly dialog = inject(MatDialog);

  protected readonly eventColors = CALENDAR_EVENT_COLORS;
  protected readonly formatEventTime = formatEventTime;
  protected readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());
  protected readonly selectedDate = signal(formatIsoDate(new Date()));
  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly eventsByDate = computed(() => groupEventsByDate(this.events()));

  protected readonly monthGrid = computed(() =>
    buildMonthGrid(
      this.viewYear(),
      this.viewMonth(),
      this.selectedDate(),
      this.eventsByDate(),
    ),
  );

  protected readonly monthLabel = computed(() => {
    const date = new Date(this.viewYear(), this.viewMonth(), 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  });

  protected readonly selectedDayEvents = computed(() => {
    return this.eventsByDate().get(this.selectedDate()) ?? [];
  });

  constructor() {
    this.loadEvents();
  }

  protected selectDay(isoDate: string): void {
    this.selectedDate.set(isoDate);
  }

  protected goToPreviousMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((year) => year - 1);
    } else {
      this.viewMonth.update((month) => month - 1);
    }
    this.loadEvents();
  }

  protected goToNextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((year) => year + 1);
    } else {
      this.viewMonth.update((month) => month + 1);
    }
    this.loadEvents();
  }

  protected goToToday(): void {
    const today = new Date();
    this.viewYear.set(today.getFullYear());
    this.viewMonth.set(today.getMonth());
    this.selectedDate.set(formatIsoDate(today));
    this.loadEvents();
  }

  protected openCreateDialog(): void {
    this.openEventDialog({
      mode: 'create',
      prefillDate: this.selectedDate(),
    });
  }

  protected openEditDialog(event: CalendarEvent): void {
    this.openEventDialog({
      mode: 'edit',
      event,
    });
  }

  protected deleteEvent(event: CalendarEvent): void {
    if (!confirm(`Delete "${event.title}"?`)) {
      return;
    }

    this.actionError.set(null);
    this.calendarService.delete(event.id).subscribe({
      next: () => this.loadEvents(),
      error: (error: Error) => this.actionError.set(error.message),
    });
  }

  private openEventDialog(data: CalendarEventDialogData): void {
    const ref = this.dialog.open(CalendarEventDialog, {
      data,
      autoFocus: 'first-titled-element',
    });

    ref.afterClosed().subscribe((payload: CalendarEventPayload | undefined) => {
      if (!payload) {
        return;
      }

      this.actionError.set(null);
      const request$ =
        data.mode === 'create'
          ? this.calendarService.create(payload)
          : this.calendarService.update(data.event!.id, payload);

      request$.subscribe({
        next: () => this.loadEvents(),
        error: (error: Error) => this.actionError.set(error.message),
      });
    });
  }

  private loadEvents(): void {
    const range = getMonthRange(this.viewYear(), this.viewMonth());
    this.isLoading.set(true);

    this.calendarService
      .list(range)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (events) => this.events.set(events),
        error: (error: Error) => this.actionError.set(error.message),
      });
  }
}
