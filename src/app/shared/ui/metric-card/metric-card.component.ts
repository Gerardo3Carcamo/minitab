import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="metric-card">
      <p class="label">{{ label() }}</p>
      <strong class="value">{{ value() }}</strong>
      <small *ngIf="hint()">{{ hint() }}</small>
    </article>
  `,
  styles: [`
    .metric-card {
      border: 1px solid #d8e6ea;
      background: #fff;
      border-radius: 12px;
      padding: 12px;
      min-height: 94px;
      display: grid;
      gap: 4px;
      align-content: start;
    }
    .label {
      margin: 0;
      color: #577684;
      font-size: 0.85rem;
    }
    .value {
      font-size: 1.25rem;
      color: #11313e;
      line-height: 1.1;
    }
    small {
      color: #6d8793;
    }
  `]
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
}
