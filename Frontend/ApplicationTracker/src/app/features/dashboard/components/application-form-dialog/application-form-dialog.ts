import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { provideNativeDateAdapter } from '@angular/material/core';

import {
  APPLICATION_STATUS_OPTIONS,
  JobApplication,
} from '../../../applications/models/application.models';

export interface ApplicationFormDialogData {
  mode: 'create' | 'edit';
  application?: JobApplication;
  prefillAppliedDate?: string;
}

@Component({
  selector: 'app-application-form-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  templateUrl: './application-form-dialog.html',
  styleUrl: './application-form-dialog.scss',
})
export class ApplicationFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ApplicationFormDialog>);
  protected readonly data = inject<ApplicationFormDialogData>(MAT_DIALOG_DATA);
  protected readonly statusOptions = APPLICATION_STATUS_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    companyName: [this.data.application?.companyName ?? '', [Validators.required, Validators.maxLength(200)]],
    appliedDate: [
      this.data.application
        ? new Date(`${this.data.application.appliedDate}T00:00:00`)
        : this.data.prefillAppliedDate
          ? new Date(`${this.data.prefillAppliedDate}T00:00:00`)
          : new Date(),
      Validators.required,
    ],
    companyLink: [this.data.application?.companyLink ?? '', Validators.maxLength(2048)],
    contactFollowUp: [this.data.application?.contactFollowUp ?? '', Validators.maxLength(1000)],
    status: [this.data.application?.status ?? 'UNDER_CONSIDERATION', Validators.required],
    notes: [this.data.application?.notes ?? '', Validators.maxLength(2000)],
  });

  protected get title(): string {
    return this.data.mode === 'create' ? 'Add application' : 'Edit application';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const appliedDate = this.formatDate(value.appliedDate);

    this.dialogRef.close({
      companyName: value.companyName.trim(),
      appliedDate,
      companyLink: value.companyLink.trim() || null,
      contactFollowUp: value.contactFollowUp.trim() || null,
      status: value.status,
      notes: value.notes.trim() || null,
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
