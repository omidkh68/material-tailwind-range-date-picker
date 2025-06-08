import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {MatBottomSheet, MatBottomSheetRef} from '@angular/material/bottom-sheet';

@Injectable({providedIn: 'root'})
export class SmartDialogService {
  readonly #dialog = inject(MatDialog);
  readonly #bottomSheet = inject(MatBottomSheet);
  readonly #breakpoints = inject(BreakpointObserver);

  private ref: MatDialogRef<any> | MatBottomSheetRef<any> | null = null;
  private data: any = null;

  open<T, R = any>(
    component: any,
    config: {
      data?: R;
      panelClass?: string | string[];
      disableClose?: boolean;
      width?: string;
      maxWidth?: string;
      height?: string;
    } = {}
  ): SmartDialogRef<R> {
    const isMobile = this.#breakpoints.isMatched([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ]);
    const smartRef = new SmartDialogRef<R>({} as any);

    this.data = config.data;

    if (isMobile) {
      this.ref = this.#bottomSheet.open(component, {
        ariaLabel: 'Dialog',
        ariaModal: true,
        data: config.data,
        panelClass: config.panelClass,
        disableClose: config.disableClose
      });

      Promise.resolve().then(() => {
        const hostElement = (this.ref as any)?.containerInstance?._elementRef?.nativeElement as HTMLElement;
        const container = hostElement?.closest('.mat-bottom-sheet-container') as HTMLElement;

        if (container) {
          if (config.width) container.style.width = config.width;
          if (config.height) container.style.height = config.height;
          if (config.maxWidth) container.style.maxWidth = config.maxWidth;
          container.style.minWidth = 'unset';
          container.style.maxHeight = 'unset';

          container.style.borderTopLeftRadius = '1rem';
          container.style.borderTopRightRadius = '1rem';
        }

        if (hostElement) {
          if (config.width) hostElement.style.width = config.width;
          if (config.maxWidth) hostElement.style.maxWidth = config.maxWidth;
          if (config.height) hostElement.style.height = config.height;
        }
      });

      (smartRef as any).ref = this.ref;
    } else {
      this.ref = this.#dialog.open(component, {
        data: config.data,
        ariaLabel: 'Bottomsheet',
        ariaModal: true,
        panelClass: config.panelClass,
        disableClose: config.disableClose,
        width: config.width,
        height: config.height,
        maxWidth: config.maxWidth,
      });

      const hostElement = (this.ref as any)._containerInstance?._elementRef?.nativeElement;

      const container = hostElement?.closest('.mat-mdc-dialog-panel') as HTMLElement;

      if (container) {
        if (config.width) container.style.width = config.width;
        if (config.height) container.style.height = config.height;
        if (config.maxWidth) {
          container.style.maxWidth = config.maxWidth;
        } else {
          container.style.maxWidth = 'unset';
        }
        container.style.minWidth = 'unset';
        container.style.maxHeight = 'unset';
      }

      (smartRef as any).ref = this.ref;
    }

    return smartRef;
  }

  getData<T = any>(): T {
    return this.data;
  }

  close(result?: any): void {
    if (!this.ref) return;

    if ('close' in this.ref) {
      this.ref.close(result);
    } else {
      this.ref.dismiss(result);
    }

    this.clear();
  }

  clear(): void {
    this.ref = null;
    this.data = null;
  }
}

type DialogRef<T> = {
  close: (value?: T) => void;
  afterClosed: () => Observable<T>;
  afterOpened: () => Observable<T>;
};

type BottomSheetRef<T> = {
  dismiss: (value?: T) => void;
  afterDismissed: () => Observable<T>;
  afterOpened: () => Observable<T>;
  bef: () => Observable<T | undefined>;
};

export class SmartDialogRef<T = unknown> {
  constructor(
    private readonly ref: DialogRef<T> | BottomSheetRef<T>
  ) {
  }

  close(result?: T): void {
    if ('close' in this.ref) {
      this.ref.close(result);
    } else {
      this.ref.dismiss(result);
    }
  }

  afterOpened(): Observable<T> {
    return this.ref.afterOpened();
  }

  afterClosed(): Observable<T> {
    if ('afterClosed' in this.ref) {
      return this.ref.afterClosed();
    } else {
      return this.ref.afterDismissed();
    }
  }
}
