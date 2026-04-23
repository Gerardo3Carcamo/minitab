import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-excel-sheet-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label>
      <span>Hoja de Excel</span>
      <select [value]="selected()" (change)="onChange($event)">
        <option *ngFor="let sheet of sheets()" [value]="sheet">{{ sheet }}</option>
      </select>
    </label>
  `
})
export class ExcelSheetSelectorComponent {
  readonly sheets = input<string[]>([]);
  readonly selected = input<string>('');
  readonly selectedChange = output<string>();

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedChange.emit(target.value);
  }
}
