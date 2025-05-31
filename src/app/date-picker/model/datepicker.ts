export interface DateTimePicker {
  start_datetime: string;
  end_datetime: string;
  start_hour?: number;
  start_minute?: number;
  end_hour?: number;
  end_minute?: number;
  week_days?: string[];
}

export interface DatePickerModel {
  optionalFeatures: boolean;
  dateTimePicker?: DateTimePicker;
  future: boolean;
}

export interface TimeRange {
  label: string;
  start: string;
  end: string;
}

export interface WeekType {
  label: string;
  value: number;
}

export interface Weekday {
  label: string;
  data: string;
  value: number;
  selected: boolean;
}

export interface HourType {
  label: string;
  value: number;
  selected: boolean;
}
