import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  output,
  signal
} from '@angular/core';
import {take, tap} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {DateSelector} from './date-selector/date-selector';
import {WindowService} from '../helper/window.service';
import {DatePipe, NgClass} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {DateRange, MatDatepickerModule} from '@angular/material/datepicker';
import {DatePickerModel, DateTimePicker} from './model/datepicker';
import {featherCheck, featherCalendar, featherX} from '@ng-icons/feather-icons';

@Component({
  selector: 'date-picker',
  templateUrl: './date-picker.html',
  styles: `:host {
    display: block;
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, NgClass, MatDatepickerModule, DatePipe],
  providers: [
    provideIcons({featherCheck, featherCalendar, featherX})
  ]
})
export class DatePicker {
  readonly #dialog = inject(MatDialog);
  readonly #windowService = inject(WindowService);

  protected destroyRef = inject(DestroyRef);

  required = input<boolean>(false);
  disabled = input<boolean>(false);
  optionalFeatures = input<boolean>(true);
  future = input<boolean>(false);

  dateTimePicker = model<DateTimePicker | undefined>();
  selectedDateRange = model<DateRange<Date> | undefined>();

  toggle = signal<boolean>(false);

  selectedDates = output<DateTimePicker | undefined>();

  ref = effect((): void => {
    const dateTimePicker = this.dateTimePicker();

    if (dateTimePicker && dateTimePicker?.start_datetime && dateTimePicker.end_datetime) {
      this.selectedDateRange.set({
        start: new Date(dateTimePicker.start_datetime),
        end: new Date(dateTimePicker.end_datetime)
      } as DateRange<Date>);
    }
  });

  openDateDialogSelector(): void {
    const data: DatePickerModel = {
      optionalFeatures: this.optionalFeatures(),
      dateTimePicker: this.dateTimePicker(),
      future: this.future()
    };
    const dialogWidth: boolean = this.#windowService.nativeWindow.innerWidth <= 1024;
    const dialogRef = this.#dialog.open(DateSelector, {
      autoFocus: true,
      width: dialogWidth ? '98%' : '850px',
      height: dialogWidth ? '80%' : '470px',
      data,
      position: dialogWidth ? {bottom: '1rem'} : undefined,
    });

    dialogRef.afterOpened().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
      tap(() => this.toggle.update((status: boolean) => !status))
    ).subscribe();

    dialogRef.afterClosed().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
      tap((result: DatePickerModel | undefined): void => {
        this.toggle.update((status: boolean) => !status);

        if (result && result.dateTimePicker) {

          this.dateTimePicker.set(result.dateTimePicker);

          this.selectedDates.emit(this.dateTimePicker());
        }
      })
    ).subscribe();
  }
}
