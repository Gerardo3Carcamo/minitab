import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="open()" class="backdrop" (click)="closed.emit()">
      <article class="modal" (click)="$event.stopPropagation()">
        <header>
          <h3>{{ title() }}</h3>
          <button type="button" (click)="closed.emit()">Cerrar</button>
        </header>
        <ng-content />
      </article>
    </section>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(17, 41, 51, 0.45);
      z-index: 1000;
    }
    .modal {
      width: min(580px, calc(100vw - 24px));
      border-radius: 14px;
      background: #fff;
      border: 1px solid #d8e6ea;
      padding: 14px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    h3 {
      margin: 0;
    }
    button {
      border: 1px solid #c6dbe2;
      border-radius: 8px;
      background: #fff;
      padding: 6px 10px;
    }
  `]
})
export class AppModalComponent {
  readonly open = input(false);
  readonly title = input('Detalle');
  readonly closed = output<void>();
}
