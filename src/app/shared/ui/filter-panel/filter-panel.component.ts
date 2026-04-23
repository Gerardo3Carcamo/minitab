import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface FilterPanelValue {
  query: string;
  showNullsOnly: boolean;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="panel" (ngSubmit)="submit()">
      <label>
        <span>{{ placeholder() }}</span>
        <input formControlName="query" />
      </label>
      <label class="inline">
        <input type="checkbox" formControlName="showNullsOnly" />
        <span>Solo valores nulos</span>
      </label>
      <button type="submit">Aplicar</button>
    </form>
  `,
  styles: [`
    .panel {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid #d8e6ea;
      border-radius: 12px;
      background: #fff;
    }
    label {
      display: grid;
      gap: 6px;
      font-size: 0.9rem;
      color: #1a4f63;
    }
    .inline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    input[type="text"],
    input:not([type]) {
      border: 1px solid #c5dbe2;
      border-radius: 8px;
      padding: 8px 10px;
    }
    button {
      width: fit-content;
      border: 0;
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      background: linear-gradient(120deg, #0f6f89, #2b8f71);
    }
  `]
})
export class FilterPanelComponent {
  readonly placeholder = input('Buscar en dataset');
  readonly changed = output<FilterPanelValue>();

  readonly form = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
    showNullsOnly: new FormControl(false, { nonNullable: true })
  });

  submit(): void {
    this.changed.emit({
      query: this.form.controls.query.value.trim(),
      showNullsOnly: this.form.controls.showNullsOnly.value
    });
  }
}
