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
import { provideNativeDateAdapter } from '@angular/material/core';

import { ApplicationService } from '../../../applications/services/application.service';
import {
  CALENDAR_EVENT_TYPE_OPTIONS,
  CalendarEvent,
  CalendarEventPayload,
} from '../../models/calendar.models';
import { localDateTimeInputToIso, toLocalDateTimeInput } from '../../utils/calendar.utils';

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

  protected readonly form = this.fb.nonNullable.group({
    title: [this.data.event?.title ?? '', [Validators.required, Validators.maxLength(200)]],
    eventType: [this.data.event?.eventType ?? 'INTERVIEW', Validators.required],
    allDay: [this.data.event?.allDay ?? false],
    startsAt: [this.initialStartsAt(), Validators.required],
    endsAt: [this.initialEndsAt()],
    notes: [this.data.event?.notes ?? '', Validators.maxLength(2000)],
    applicationId: [this.data.event?.applicationId ?? ''],
  });

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
      title: value.title.trim(),
      notes: value.notes.trim() || null,
      startsAt: localDateTimeInputToIso(value.startsAt),
      endsAt: value.endsAt ? localDateTimeInputToIso(value.endsAt) : null,
      allDay: value.allDay,
      eventType: value.eventType,
      applicationId: value.applicationId || null,
    };

    this.dialogRef.close(payload);
  }

  private initialStartsAt(): string {
    if (this.data.event) {
      return toLocalDateTimeInput(this.data.event.startsAt);
    }

    if (this.data.prefillDate) {
      return `${this.data.prefillDate}T09:00`;
    }

    return toLocalDateTimeInput(new Date());
  }

  private initialEndsAt(): string {
    if (this.data.event?.endsAt) {
      return toLocalDateTimeInput(this.data.event.endsAt);
    }

    return '';
  }
}
