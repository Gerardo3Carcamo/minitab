import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-outlier-detection-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h3>OutlierDetectionPanelComponent</h3>
      <form class="form-grid" [formGroup]="form" (ngSubmit)="apply()">
        <label>
          <span>Columna numérica</span>
          <select formControlName="column">
            <option *ngFor="let option of numericColumns()" [value]="option.key">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>Umbral Z-score</span>
          <input type="number" formControlName="threshold" />
        </label>
        <label>
          <span>Acción</span>
          <select formControlName="mode">
            <option value="mark">Marcar outliers</option>
            <option value="remove">Eliminar outliers</option>
          </select>
        </label>
        <button class="secondary" type="submit">Detectar</button>
      </form>
    </section>
  `
})
export class OutlierDetectionPanelComponent {
  readonly numericColumns = input<Array<{ key: string; label: string }>>([]);
  readonly action = output<{ action: string; payload: Record<string, unknown> }>();

  readonly form = new FormGroup({
    column: new FormControl('', { nonNullable: true }),
    threshold: new FormControl(3, { nonNullable: true }),
    mode: new FormControl<'mark' | 'remove'>('mark', { nonNullable: true })
  });

  apply(): void {
    this.action.emit({
      action: 'mark-outliers',
      payload: this.form.getRawValue()
    });
  }
}
