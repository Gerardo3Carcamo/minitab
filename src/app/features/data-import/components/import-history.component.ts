import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { ImportJob } from '../../../shared/models/dataset.model';

@Component({
  selector: 'app-import-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h3>Historial de Importaciones</h3>
      <ul *ngIf="jobs().length > 0; else empty">
        <li *ngFor="let job of jobs()">
          <strong>{{ job.fileName }}</strong>
          <span>{{ job.status }} - {{ job.progress }}%</span>
        </li>
      </ul>
      <ng-template #empty>
        <p class="empty-state">Sin importaciones recientes.</p>
      </ng-template>
    </section>
  `,
  styles: [`
    h3 {
      margin: 0 0 8px;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 8px;
    }
    li {
      border: 1px solid #d8e6ea;
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 0.9rem;
    }
    span {
      color: #5e7783;
    }
  `]
})
export class ImportHistoryComponent {
  readonly jobs = input<ImportJob[]>([]);
}
