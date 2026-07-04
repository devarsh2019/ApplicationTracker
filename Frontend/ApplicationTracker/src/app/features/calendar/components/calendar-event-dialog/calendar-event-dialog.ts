import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatTimepicker,
  MatTimepickerInput,
  MatTimepickerToggle,
} from '@angular/material/timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

import { ApplicationService } from '../../../applications/services/application.service';
import {
  CALENDAR_EVENT_TYPE_OPTIONS,
  CalendarEvent,
  CalendarEventPayload,
} from '../../models/calendar.models';
import {
  buildEventEndsAt,
  buildEventStartsAt,
  parseIsoDateTime,
  startOfDayDate,
} from '../../utils/calendar.utils';

export interface CalendarEventDialogData {
  mode: 'create' | 'edit';
  event?: CalendarEvent;
  prefillDate?: string;
}

@Component({
  selector: 'app-calendar-event-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatTimepicker,
    MatTimepickerInput,
    MatTimepickerToggle,
  ],
  templateUrl: './calendar-event-dialog.html',
  styleUrl: './calendar-event-dialog.scss',
})
export class CalendarEventDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CalendarEventDialog>);
  private readonly applicationService = inject(ApplicationService);
  protected readonly data = inject<CalendarEventDialogData>(MAT_DIALOG_DATA);
  protected readonly eventTypeOptions = CALENDAR_EVENT_TYPE_OPTIONS;
  protected readonly applicationOptions = toSignal(
    this.applicationService.list({ page: 0, size: 100 }),
    { initialValue: null },
  );

  protected readonly form = this.fb.group({
    title: [this.data.event?.title ?? '', [Validators.required, Validators.maxLength(200)]],
    eventType: [this.data.event?.eventType ?? 'INTERVIEW', Validators.required],
    allDay: [this.data.event?.allDay ?? false],
    startDate: [this.initialStartDate(), Validators.required],
    startTime: [this.initialStartTime(), Validators.required],
    endDate: [this.initialEndDate()],
    endTime: [this.initialEndTime()],
    notes: [this.data.event?.notes ?? '', Validators.maxLength(2000)],
    applicationId: [this.data.event?.applicationId ?? ''],
  });

  constructor() {
    this.syncTimeFields(this.form.controls.allDay.value ?? false);
    this.form.controls.allDay.valueChanges.subscribe((allDay) => this.syncTimeFields(allDay ?? false));
  }

  protected get title(): string {
    return this.data.mode === 'create' ? 'Add event' : 'Edit event';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CalendarEventPayload = {
      title: (value.title ?? '').trim(),
      notes: (value.notes ?? '').trim() || null,
      startsAt: buildEventStartsAt({
        allDay: value.allDay ?? false,
        startDate: value.startDate,
        startTime: value.startTime,
      }),
      endsAt: buildEventEndsAt({
        allDay: value.allDay ?? false,
        endDate: value.endDate,
        endTime: value.endTime,
      }),
      allDay: value.allDay ?? false,
      eventType: value.eventType ?? 'OTHER',
      applicationId: value.applicationId || null,
    };

    this.dialogRef.close(payload);
  }

  private syncTimeFields(allDay: boolean): void {
    const startTime = this.form.controls.startTime;
    const endTime = this.form.controls.endTime;

    if (allDay) {
      startTime.clearValidators();
      endTime.clearValidators();
      startTime.disable({ emitEvent: false });
      endTime.disable({ emitEvent: false });
    } else {
      startTime.setValidators([Validators.required]);
      endTime.clearValidators();
      startTime.enable({ emitEvent: false });
      endTime.enable({ emitEvent: false });
    }

    startTime.updateValueAndValidity({ emitEvent: false });
    endTime.updateValueAndValidity({ emitEvent: false });
  }

  private initialStartDate(): Date {
    if (this.data.event) {
      return parseIsoDateTime(this.data.event.startsAt).date;
    }

    if (this.data.prefillDate) {
      return startOfDayDate(this.data.prefillDate);
    }

    return startOfDayDate(new Date());
  }

  private initialStartTime(): Date {
    if (this.data.event && !this.data.event.allDay) {
      return parseIsoDateTime(this.data.event.startsAt).time;
    }

    const time = new Date();
    time.setHours(9, 0, 0, 0);
    return time;
  }

  private initialEndDate(): Date | null {
    if (this.data.event?.endsAt) {
      return parseIsoDateTime(this.data.event.endsAt).date;
    }

    return null;
  }

  private initialEndTime(): Date | null {
    if (this.data.event?.endsAt && !this.data.event.allDay) {
      return parseIsoDateTime(this.data.event.endsAt).time;
    }

    return null;
  }
}
