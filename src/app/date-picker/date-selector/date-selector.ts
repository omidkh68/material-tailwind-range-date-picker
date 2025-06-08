import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  model,
  OnInit,
  output,
  signal
} from '@angular/core';
import {MatInput} from '@angular/material/input';
import {Container} from '../../container';
import {MatCheckbox} from '@angular/material/checkbox';
import {DatePipe, NgClass} from '@angular/common';
import {SmartDialogService} from '../../smart-dialog';
import {MatTimepickerModule} from '@angular/material/timepicker';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {DatePickerModel, DateTimePicker, HourType, TimeRange, Weekday, WeekType} from '../model/datepicker';
import {
  featherArrowRight,
  featherCalendar,
  featherCheck,
  featherClock,
  featherInfo,
  featherX
} from '@ng-icons/feather-icons';
import {
  DateRange,
  DefaultMatCalendarRangeStrategy,
  MatCalendar,
  MatDatepickerModule,
  MatRangeDateSelectionModel
} from '@angular/material/datepicker';

@Component({
  selector: 'date-selector',
  templateUrl: './date-selector.html',
  styles: `:host {
    display: block;
    height: 100%;
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNativeDateAdapter(),
    provideIcons({featherCheck, featherArrowRight, featherX, featherClock, featherInfo, featherCalendar}),
    DefaultMatCalendarRangeStrategy, MatRangeDateSelectionModel
  ],
  imports: [
    MatCalendar, NgIcon, MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule, FormsModule, NgClass,
    MatCheckbox, DatePipe, MatInput, MatTimepickerModule, Container
  ],
})
export class DateSelector implements OnInit {
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #smartDialog = inject(SmartDialogService);
  readonly #selectionModel = inject(MatRangeDateSelectionModel<Date>);
  public data = this.#smartDialog.getData() as DatePickerModel;

  startDate = model<string>('');
  endDate = model<string>('');

  future = model<boolean>(false);
  optionalFeatures = model<boolean>(true);

  relativeDurations = [
    ['Last 5 minutes', '-5minutes'],
    ['Last 15 minutes', '-15minutes'],
    ['Last 30 minutes', '-30minutes'],
    ['Last 1 hour', '-1hours'],
    ['Last 3 hours', '-3hours'],
    ['Last 6 hours', '-6hours'],
    ['Last 12 hours', '-12hours'],
    ['Last 24 hours', '-24hours'],
    ['Last 2 days', '-2days'],
    ['Last 7 days', '-7days'],
    ['Last 30 days', '-30days'],
    ['Last 90 days', '-90days'],
    ['Last 6 months', '-6months'],
    ['Last 1 year', '-1years'],
    ['Last 2 years', '-2years'],
    ['Last 5 years', '-5years'],
    ['Last week', '-1weeks'],
    ['Last month', '-1months'],
    ['Last year', '-1years']
  ];

  fixedDays = [
    ['Yesterday', '-1days/day'],
    ['Day before yesterday', '-2days/day'],
    ['This day last week', '-7days/day'],
    ['Previous week', '-1weeks/week'],
    ['Previous month', '-1months/month'],
    ['Previous year', '-1years/year'],
  ];

  currentPeriods = [
    ['Today', 'today', 'today'],
    ['Today so far', 'today', 'now'],
    ['This week so far', 'thisweek', 'now'],
    ['This month so far', 'thismonth', 'now'],
    ['This year so far', 'thisyear', 'now']
  ];

  timeRanges = signal<TimeRange[]>([
    ...this.relativeDurations.map(([label, offset]) => ({
      label,
      start: `offset:${offset}`,
      end: 'offset:now'
    })),
    ...this.fixedDays.map(([label, point]) => ({
      label,
      start: `offset:${point}`,
      end: `offset:${point}`
    })),
    ...this.currentPeriods.map(([label, start, end]) => ({
      label,
      start: `offset:${start}`,
      end: `offset:${end}`
    }))
  ]);
  selectedTimeRange = model<TimeRange | undefined>(undefined);

  allDays = model<boolean>(true);
  weekTypes = signal<WeekType[]>([
    {label: 'ALL', value: 0},
    {label: 'WORKING DAYS', value: 1},
    {label: 'CUSTOM', value: 2},
  ]);
  selectedWeekType = model<WeekType | undefined>(this.weekTypes()[0]);
  weekdays = model<Weekday[]>([
    {label: 'Sat', data: 'Saturday', value: 0, selected: false},
    {label: 'Sun', data: 'Sunday', value: 1, selected: false},
    {label: 'Mon', data: 'Monday', value: 2, selected: false},
    {label: 'Tue', data: 'Tuesday', value: 3, selected: false},
    {label: 'Wed', data: 'Wednesday', value: 4, selected: false},
    {label: 'Thu', data: 'Thursday', value: 5, selected: false},
    {label: 'Fri', data: 'Friday', value: 6, selected: false},
  ]);

  selectedWeekday = model<Weekday | undefined>();

  allHours = model<boolean>(true);
  hourTypes = signal<HourType[]>([
    {label: 'ALL', value: 0, selected: false},
    {label: 'BUSY HOURS', value: 1, selected: false},
    {label: 'CUSTOM', value: 2, selected: true}
  ]);
  selectedHour = model<HourType | undefined>(this.hourTypes()[2]);

  selectedDates = output<string[]>();
  selectedDateRange!: DateRange<Date> | null;
  now = new Date();
  selectingStart = true;

  ngOnInit(): void {
    if (this.data) {
      const picker = this.data.dateTimePicker;

      if (picker) {
        // Initialize the date range
        if (picker.start_datetime && picker.end_datetime) {
          this.selectedDateRange = {
            start: new Date(picker.start_datetime),
            end: new Date(picker.end_datetime)
          } as DateRange<Date>;
          this.initializeRange();
        }

        // Initialize the days of the week
        if (Array.isArray(picker.week_days) && picker.week_days.length) {
          this.initializeWeekdays(picker.week_days);
        }

        // If start/end were specified, set the interval to the calendar as well
        if (this.selectedDateRange?.start && this.selectedDateRange?.end) {
          this.updateSelection(this.selectedDateRange.start, this.selectedDateRange.end);
        } else if (this.selectedDateRange?.start) {
          this.rangeChanged(this.selectedDateRange.start);
        }

        // Initialize the hourly interval
        if (picker.start_hour != null && picker.end_hour != null) {
          this.allHours.set(false);

          const start = this.selectedDateRange?.start;
          const end = this.selectedDateRange?.end;

          const startMinute = picker.start_minute ?? 0;
          const endMinute = picker.end_minute ?? 59;

          if (start && end) {
            start.setHours(picker.start_hour, startMinute, 0, 0);
            end.setHours(picker.end_hour, endMinute, 0, 0);
            this.selectedDateRange = new DateRange(start, end);
          }

          let active = 2;
          if (picker.start_hour === 0 && startMinute === 0 && picker.end_hour === 23 && endMinute === 59) {
            active = 0;
          } else if (picker.start_hour === 20 && startMinute === 0 && picker.end_hour === 23 && endMinute === 59) {
            active = 1;
          }

          this.selectedHour.set(this.hourTypes()[active]);
          this.hourTypes.update(types => types.map(type => ({
            ...type,
            selected: type.value === active
          })));
        }
      }

      this.optionalFeatures.set(this.data.optionalFeatures);
      this.future.set(this.data.future);

      // If future is enabled, add future ranges
      if (this.future()) {
        const futureOffsets: TimeRange[] = [
          {label: 'Next 1 day', start: 'offset:now', end: 'offset:+1days'},
          {label: 'Next 1 week', start: 'offset:now', end: 'offset:+1weeks'},
          {label: 'Next 1 month', start: 'offset:now', end: 'offset:+1months'},
          {label: 'Next 3 months', start: 'offset:now', end: 'offset:+3months'}
        ];
        this.timeRanges.update(ranges => [...ranges, ...futureOffsets]);
      }
    } else {
      // Default mode: choose one of the predefined ranges
      this.selectTimeRange(this.timeRanges()[5]);
    }

    this.#cdr.detectChanges();
  }

  initializeRange(): void {
    const start = this.selectedDateRange?.start;
    const end = this.selectedDateRange?.end;

    if (!start || !end) return;

    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - start.getTime()) / 60000);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffMinutes / 1440);
    const diffMonths = Math.round(diffDays / 30);
    const diffYears = Math.round(diffDays / 365);

    const possibleOffsets = [
      `offset:-${diffMinutes}minutes`,
      `offset:-${diffHours}hours`,
      `offset:-${diffDays}days`,
      `offset:-${diffMonths}months`,
      `offset:-${diffYears}years`
    ];

    for (const offset of possibleOffsets) {
      const matched = this.timeRanges().find(r => r.start === offset && r.end === 'offset:now');
      if (matched) {
        this.selectedTimeRange.set(matched);
        break;
      }
    }

    this.startDate.set(start.toISOString());
    this.endDate.set(end.toISOString());
  }

  initializeWeekdays(weekdays: string[]): void {
    this.allDays.set(false);

    const selectedDays = new Set(weekdays.map(d => d.toLowerCase()));
    this.weekdays.update(days => days.map(day => ({...day, selected: selectedDays.has(day.data.toLowerCase())})));

    const all = new Set(this.weekdays().map(d => d.data.toLowerCase()));
    const working = new Set(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday']);

    const isAll = selectedDays.size === all.size;
    const isWorking = selectedDays.size === working.size && [...working].every(day => selectedDays.has(day));

    const label = isAll ? 'ALL' : isWorking ? 'WORKING DAYS' : 'CUSTOM';
    this.selectedWeekType.set(this.weekTypes().find(w => w.label === label));
  }

  rangeChanged(selectedDate: Date | null): void {
    if (!selectedDate) return;

    if (this.selectingStart) {
      this.startDate.set(selectedDate.toISOString());
      this.endDate.set('');
      this.selectedTimeRange.set(undefined);

      this.selectedDateRange = null;
      this.#selectionModel.updateSelection(new DateRange(selectedDate, null), this);
      this.selectingStart = false;
    } else {
      const start = this.#selectionModel.selection.start;
      if (!start) return;

      const range = start.toDateString() === selectedDate.toDateString()
        ? new DateRange(start, start)
        : new DateRange(start < selectedDate ? start : selectedDate, start < selectedDate ? selectedDate : start);

      this.updateSelection(range.start, range.end);
      this.selectingStart = true;
    }
  }

  updateSelection(start: Date, end: Date): void {
    const range = new DateRange(start, end);
    this.selectedDateRange = range;
    this.#selectionModel.updateSelection(range, this);
    this.startDate.set(start.toISOString());
    this.endDate.set(end.toISOString());

    this.selectedHour.set(this.hourTypes()[2]);
  }

  selectTimeRange(timeRange: TimeRange): void {
    const currentTimeRange = this.selectedTimeRange();

    if (currentTimeRange?.start === timeRange.start && currentTimeRange?.end === timeRange.end) {
      this.selectedTimeRange.set(undefined);

      this.startDate.set('');
      this.endDate.set('');
      this.selectedDateRange = null; // Reset the selected range
    } else {
      this.selectedTimeRange.set(timeRange);

      const {startDate, endDate} = this.processTimeRange(timeRange);
      const start = new Date(startDate);
      const end = new Date(endDate);

      // ISO format with time and timezone for both date times
      this.startDate.set(start.toISOString());
      this.endDate.set(end.toISOString());
      this.selectedDateRange = new DateRange<Date>(start, end); // Update calendar range
    }

    this.allHours.set(true);
    this.selectedHour.set(this.hourTypes()[2]);
  }

  processTimeRange(timeRange: TimeRange): { startDate: string, endDate: string } {
    const now = new Date();
    const parseTime = (time: string): Date => {
      if (!time) return new Date(now);

      if (time.startsWith('offset:')) {
        const offset = time.replace('offset:', '').trim();

        if (offset === 'now') return new Date(now);
        if (offset === 'today') {
          return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        if (offset === 'thisweek') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return startOfWeek;
        }
        if (offset === 'thismonth') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          return startOfMonth;
        }
        if (offset === 'thisyear') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          startOfYear.setHours(0, 0, 0, 0);
          return startOfYear;
        }

        // Handle relative offsets like +1days or -6months
        const regex = /([+-]?)(\d+)(months?|days?|years?|weeks?|hours?|minutes?)/i;
        const match = regex.exec(offset);

        if (!match) return new Date(now);

        const sign = match[1] === '-' ? -1 : 1;
        const value = parseInt(match[2], 10) * sign;
        const unit = match[3].toLowerCase();

        const result = new Date(now);

        switch (unit) {
          case 'minutes':
          case 'minute':
            result.setMinutes(result.getMinutes() + value);
            break;
          case 'hours':
          case 'hour':
            result.setHours(result.getHours() + value);
            break;
          case 'days':
          case 'day':
            result.setDate(result.getDate() + value);
            break;
          case 'weeks':
          case 'week':
            result.setDate(result.getDate() + value * 7);
            break;
          case 'months':
          case 'month':
            result.setMonth(result.getMonth() + value);
            break;
          case 'years':
          case 'year':
            result.setFullYear(result.getFullYear() + value);
            break;
        }

        return result;
      }

      return new Date(time);
    };

    const startDate = timeRange.start ? parseTime(timeRange.start) : null;
    const endDate = timeRange.end ? parseTime(timeRange.end) : now;

    return {
      startDate: (startDate ?? endDate).toISOString(),
      endDate: endDate.toISOString()
    };
  }

  changeWeekType(type: WeekType): void {
    this.selectedWeekType.set(type);

    this.weekdays.update(items =>
      items.map(item => {
        // If custom selected, deselect all days
        // If Working days selected, select all except Thu and Fri
        // If All selected, select all days
        const shouldSelect = type.value === 0 ? true : type.value === 1 ? ![5, 6].includes(item.value) : false;

        return {...item, selected: shouldSelect};
      })
    );
  }

  changeWeekdays(type: Weekday): void {
    this.weekdays.update(items => {
      // Toggle the selected state of the clicked weekday
      const updatedItems = items.map(item =>
        item.value === type.value ? {...item, selected: !type.selected} : item
      );

      // Check if all weekdays are selected
      const areAllSelected = updatedItems.every(item => item.selected);

      if (areAllSelected) {
        // If all selected, set the first week type and unselect all
        this.selectedWeekType.set(this.weekTypes()[0]);
        // return updatedItems.map(item => ({...item, selected: false}));
      } else {
        // Otherwise, set the last week type
        this.selectedWeekType.set(this.weekTypes()[this.weekTypes().length - 1]);
      }

      return updatedItems;
    });
  }

  applyHourPreset(hourType: HourType): void {
    if (hourType.value === 2) return;

    this.selectedTimeRange.set(undefined);
    this.selectedHour.set(hourType);

    const getTime = (value: number) => {
      switch (value) {
        case 0:
          return {start: [0, 0], end: [23, 59]}; // ALL
        case 1:
          return {start: [20, 0], end: [23, 59]}; // BUSY
        default:
          return null; // CUSTOM
      }
    };

    const times = getTime(hourType.value);
    if (!times || !this.selectedDateRange?.start || !this.selectedDateRange?.end) return;

    const [startHour, startMin] = times.start;
    const [endHour, endMin] = times.end;

    const start = new Date(this.selectedDateRange.start);
    const end = new Date(this.selectedDateRange.end);

    start.setHours(startHour, startMin, 0, 0);
    end.setHours(endHour, endMin, 0, 0);

    this.selectedDateRange = new DateRange<Date>(start, end);
    this.#selectionModel.updateSelection(this.selectedDateRange, this);
    this.startDate.set(start.toISOString());
    this.endDate.set(end.toISOString());
  }

  changeDatePart(part: 'start' | 'end', date: Date, isTime = false): void {
    if (!date || isNaN(date.getTime())) return;

    if (!isTime) {
      date.setHours(0, 0, 0, 0);
    } else {
      this.selectedHour.set(this.hourTypes()[2]);
    }

    this.selectedTimeRange.set(undefined);

    let start = this.selectedDateRange?.start ?? null;
    let end = this.selectedDateRange?.end ?? null;

    if (part === 'start') {
      start = date;
    } else {
      end = date;
    }

    if (start && end && start.getTime() > end.getTime()) {
      [start, end] = [end, start];
    }

    const range = new DateRange<Date>(start, end);
    this.selectedDateRange = range;
    this.#selectionModel.updateSelection(range, this);

    this.startDate.set(start?.toISOString() ?? '');
    this.endDate.set(end?.toISOString() ?? '');
  }

  getSelectedWeekDays(): string[] {
    return this.weekdays().filter(day => day.selected).map(day => day.data);
  }

  getHourRange(): { startHour: number; startMinute: number; endHour: number; endMinute: number } {
    const start = this.selectedDateRange?.start;
    const end = this.selectedDateRange?.end;

    return {
      startHour: start?.getHours() ?? 0,
      startMinute: start?.getMinutes() ?? 0,
      endHour: end?.getHours() ?? 0,
      endMinute: end?.getMinutes() ?? 0
    };
  }

  submit(): void {
    const start = new Date(this.selectedDateRange?.start ?? '');
    const end = new Date(this.selectedDateRange?.end ?? '');

    const result: DateTimePicker = {
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString()
    };

    if (this.data.optionalFeatures) {
      if (!this.allDays()) {
        result.week_days = this.getSelectedWeekDays();
      }

      if (!this.allHours()) {
        const {startHour, startMinute, endHour, endMinute} = this.getHourRange();

        start.setHours(startHour, startMinute, 0, 0);
        end.setHours(endHour, endMinute, 0, 0);

        result.start_hour = startHour;
        result.start_minute = startMinute;
        result.end_hour = endHour;
        result.end_minute = endMinute;
        result.start_datetime = start.toISOString();
        result.end_datetime = end.toISOString();
      }
    }

    this.data = {...this.data, dateTimePicker: result};

    this.dismiss();
  }

  dismiss(): void {
    this.#smartDialog.close(this.data);
  }
}
