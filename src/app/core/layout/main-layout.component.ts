import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  readonly navLinks: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/data-import', label: 'Carga de Datos' },
    { path: '/workspace', label: 'Workspace' },
    { path: '/cleaning', label: 'Limpieza' },
    { path: '/descriptive', label: 'Descriptiva' },
    { path: '/visualization', label: 'Visualización' },
    { path: '/inference', label: 'Inferencia' },
    { path: '/regression', label: 'Regresión' },
    { path: '/doe', label: 'DOE' },
    { path: '/spc', label: 'SPC' },
    { path: '/quality', label: 'Calidad' },
    { path: '/time-series', label: 'Series de Tiempo' },
    { path: '/multivariate', label: 'Multivariada' },
    { path: '/automation', label: 'Automatización' },
    { path: '/reports', label: 'Reportes' }
  ];
}
