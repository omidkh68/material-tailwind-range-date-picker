import {Component, model, OnDestroy, OnInit, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {DatePicker, DateTimePicker} from './date-picker';

@Component({
  selector: 'app-root',
  imports: [DatePicker, NgClass],
  templateUrl: './app.html'
})
export class App implements OnInit, OnDestroy {
  mediaQueryList!: MediaQueryList;
  dateTimePicker = model<DateTimePicker | undefined>();
  themes = signal<('light' | 'dark')[]>(['light', 'dark']);
  selectedTheme = signal<'light' | 'dark'>('light');

  ngOnInit(): void {
    const storedMode = localStorage.getItem('theme') as 'light' | 'dark';
    if (storedMode) {
      this.selectedTheme.set(storedMode);
    }

    this.changeTheme(storedMode);
  }

  selectDates(dateTimePicker: DateTimePicker | undefined): void {
    console.log(dateTimePicker);
  }

  changeTheme(theme: 'light' | 'dark'): void {
    this.selectedTheme.set(theme);

    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleSystemChange);
    }

    if (this.selectedTheme() === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (this.selectedTheme() === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      if (this.mediaQueryList.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      this.mediaQueryList.addEventListener('change', this.handleSystemChange);
    }
    localStorage.setItem('theme', this.selectedTheme());
  }

  handleSystemChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  ngOnDestroy() {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleSystemChange);
    }
  }
}
