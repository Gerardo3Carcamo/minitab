import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-transformation-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h3>TransformationBuilderComponent</h3>
      <form class="form-grid" [formGroup]="form" (ngSubmit)="apply()">
        <label>
          <span>Transformación</span>
          <select formControlName="kind">
            <option value="log">Log</option>
            <option value="sqrt">Raíz cuadrada</option>
            <option value="box-cox">Box-Cox (lambda 0.5)</option>
            <option value="normalize-columns">Normalizar nombres de columnas</option>
          </select>
        </label>

        <label *ngIf="form.controls.kind.value !== 'normalize-columns'">
          <span>Columna objetivo</span>
          <select formControlName="column">
            <option *ngFor="let option of columns()" [value]="option.key">{{ option.label }}</option>
          </select>
        </label>

        <button class="primary" type="submit">Aplicar transformación</button>
      </form>
    </section>
  `
})
export class TransformationBuilderComponent {
  readonly columns = input<Array<{ key: string; label: string }>>([]);
  readonly action = output<{ action: string; payload: Record<string, unknown> }>();

  readonly form = new FormGroup({
    kind: new FormControl<'log' | 'sqrt' | 'box-cox' | 'normalize-columns'>('log', { nonNullable: true }),
    column: new FormControl('', { nonNullable: true })
  });

  apply(): void {
    const kind = this.form.controls.kind.value;
    if (kind === 'normalize-columns') {
      this.action.emit({
        action: 'normalize-column-names',
        payload: {}
      });
      return;
    }
    this.action.emit({
      action: 'transform',
      payload: {
        kind,
        column: this.form.controls.column.value
      }
    });
  }
}
