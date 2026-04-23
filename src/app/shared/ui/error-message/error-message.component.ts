import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="error" *ngIf="message()">{{ message() }}</p>
  `,
  styles: [`
    .error {
      margin: 0;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #f1c2c2;
      color: #a42929;
      background: #fff3f3;
    }
  `]
})
export class ErrorMessageComponent {
  readonly message = input<string | null>(null);
}
