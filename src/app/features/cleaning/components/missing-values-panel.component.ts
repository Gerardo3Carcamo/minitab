import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-missing-values-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h3>MissingValuesPanelComponent</h3>
      <form class="form-grid" [formGroup]="form" (ngSubmit)="apply()">
        <label>
          <span>Columna</span>
          <select formControlName="column">
            <option *ngFor="let option of columns()" [value]="option.key">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>Estrategia</span>
          <select formControlName="strategy">
            <option value="drop-rows">Eliminar filas con nulos</option>
            <option value="fill-value">Reemplazar por valor</option>
          </select>
        </label>
        <label *ngIf="form.controls.strategy.value === 'fill-value'">
          <span>Valor de reemplazo</span>
          <input formControlName="value" />
        </label>
        <button class="primary" type="submit">Aplicar</button>
      </form>
    </section>
  `
})
export class MissingValuesPanelComponent {
  readonly columns = input<Array<{ key: string; label: string }>>([]);
  readonly action = output<{ action: string; payload: Record<string, unknown> }>();

  readonly form = new FormGroup({
    column: new FormControl('', { nonNullable: true }),
    strategy: new FormControl<'drop-rows' | 'fill-value'>('drop-rows', { nonNullable: true }),
    value: new FormControl('')
  });

  apply(): void {
    this.action.emit({
      action: 'handle-missing',
      payload: {
        column: this.form.controls.column.value,
        strategy: this.form.controls.strategy.value,
        value: this.form.controls.value.value
      }
    });
  }
}
