import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading" *ngIf="show()">
      <span class="dot"></span>
      <span>{{ label() }}</span>
    </div>
  `,
  styles: [`
    .loading {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #1a657f;
      font-weight: 600;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #1484a5;
      animation: pulse 1.1s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.7; }
      50% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.7; }
    }
  `]
})
export class LoadingIndicatorComponent {
  readonly show = input(false);
  readonly label = input('Cargando...');
}
