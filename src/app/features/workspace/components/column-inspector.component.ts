import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { DatasetColumn } from '../../../shared/models/dataset.model';

@Component({
  selector: 'app-column-inspector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h3>ColumnInspectorComponent</h3>
      <ul *ngIf="columns().length > 0; else empty">
        <li *ngFor="let column of columns()">
          <input
            [value]="column.label"
            (change)="rename.emit({ key: column.key, label: value($event) })"
          />
          <span>{{ column.type }}</span>
          <button class="secondary" type="button" (click)="toggleVisible.emit(column.key)">
            {{ column.hidden ? 'Mostrar' : 'Ocultar' }}
          </button>
        </li>
      </ul>
      <ng-template #empty>
        <div class="empty-state">Sin columnas disponibles.</div>
      </ng-template>
    </section>
  `,
  styles: [`
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 8px;
    }
    li {
      display: grid;
      grid-template-columns: 1fr 90px auto;
      gap: 8px;
      align-items: center;
    }
    span {
      color: #557283;
      text-transform: capitalize;
      font-size: 0.9rem;
    }
  `]
})
export class ColumnInspectorComponent {
  readonly columns = input<DatasetColumn[]>([]);
  readonly rename = output<{ key: string; label: string }>();
  readonly toggleVisible = output<string>();

  value(event: Event): string {
    return (event.target as HTMLInputElement).value.trim();
  }
}
