import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  calculateProbability,
  type DistributionKey,
  distributionKind,
  DISTRIBUTIONS,
  type EventMode,
  formatNumber,
  formatPercent,
  type ProbabilityInput,
  type ProbabilityResult
} from '../probability/probability.math';
import { startGuidedTour, type TourStep } from '../../shared/driver-tour';

@Component({
  selector: 'app-probability-functions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './probability-functions.page.html',
  styleUrl: './probability-functions.page.scss'
})
export class ProbabilityFunctionsPageComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly distributions = DISTRIBUTIONS;
  errorMessage: string | null = null;
  result: ProbabilityResult | null = null;

  zMean = 0;
  zStd = 1;
  xInput = 1.96;
  zInput = 1.96;
  zResult = 1.96;
  xResult = 1.96;
  standardizationError: string | null = null;

  readonly form = new FormGroup({
    distribution: new FormControl<DistributionKey>('normal', { nonNullable: true }),
    mode: new FormControl<EventMode>('left', { nonNullable: true }),
    x: new FormControl(1.96, { nonNullable: true }),
    lower: new FormControl(-1, { nonNullable: true }),
    upper: new FormControl(1, { nonNullable: true }),
    includeBoundary: new FormControl(true, { nonNullable: true }),
    includeLower: new FormControl(true, { nonNullable: true }),
    includeUpper: new FormControl(true, { nonNullable: true }),
    mean: new FormControl(0, { nonNullable: true }),
    stdDev: new FormControl(1, { nonNullable: true }),
    trials: new FormControl(10, { nonNullable: true }),
    successProb: new FormControl(0.5, { nonNullable: true }),
    lambda: new FormControl(4, { nonNullable: true }),
    rate: new FormControl(1.2, { nonNullable: true }),
    min: new FormControl(0, { nonNullable: true }),
    max: new FormControl(10, { nonNullable: true }),
    degreesFreedom: new FormControl(10, { nonNullable: true }),
    df1: new FormControl(5, { nonNullable: true }),
    df2: new FormControl(10, { nonNullable: true })
  });

  constructor() {
    this.form.controls.distribution.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((distribution) => {
        this.applyDistributionDefaults(distribution);
        this.errorMessage = null;
      });

    this.runCalculation();
    this.calculateStandardization();
  }

  distributionDescription(): string {
    return this.distributions.find((item) => item.key === this.form.controls.distribution.value)?.description ?? '';
  }

  isTailMode(): boolean {
    return this.form.controls.mode.value === 'left' || this.form.controls.mode.value === 'right';
  }

  resetDefaults(): void {
    this.form.controls.mode.setValue('left');
    this.form.controls.includeBoundary.setValue(true);
    this.form.controls.includeLower.setValue(true);
    this.form.controls.includeUpper.setValue(true);
    this.applyDistributionDefaults(this.form.controls.distribution.value);
    this.errorMessage = null;
    this.runCalculation();
  }

  async startTutorial(): Promise<void> {
    const steps: TourStep[] = [
      {
        element: '[data-tour="pf-hero"]',
        popover: {
          title: 'Módulo de funciones de probabilidad',
          description: 'Aquí puedes resolver probabilidades para distintas distribuciones y modos de evento.'
        }
      },
      {
        element: '[data-tour="pf-distribution"]',
        popover: {
          title: 'Selecciona la distribución',
          description: 'Elige la distribución y la forma ajustará automáticamente los parámetros requeridos.'
        }
      },
      {
        element: '[data-tour="pf-event-mode"]',
        popover: {
          title: 'Define el tipo de evento',
          description: 'Puedes calcular cola izquierda, cola derecha, intervalo o probabilidad puntual.'
        }
      },
      {
        element: '[data-tour="pf-calculate-actions"]',
        popover: {
          title: 'Calcular y resetear',
          description: 'Usa Calcular para ejecutar la operación y Reset para volver a valores base.'
        }
      },
      {
        element: '[data-tour="pf-results"]',
        popover: {
          title: 'Interpretación de resultados',
          description: 'Incluye probabilidad, complemento, CDF, colas y estadísticas de la distribución.'
        }
      },
      {
        element: '[data-tour="pf-standardization"]',
        popover: {
          title: 'Estandarización X ↔ Z',
          description: 'Convierte valores entre escala original y puntaje z usando media y desviación estándar.'
        }
      }
    ];

    await startGuidedTour(steps);
  }

  runCalculation(): void {
    const input: ProbabilityInput = this.form.getRawValue();
    const validation = this.validateInput(input);
    if (validation) {
      this.errorMessage = validation;
      this.result = null;
      return;
    }
    this.errorMessage = null;
    this.result = calculateProbability(input);
  }

  calculateStandardization(): void {
    if (!Number.isFinite(this.zMean) || !Number.isFinite(this.zStd) || !Number.isFinite(this.xInput) || !Number.isFinite(this.zInput)) {
      this.standardizationError = 'Todos los valores de estandarizacion deben ser numericos.';
      return;
    }
    if (this.zStd <= 0) {
      this.standardizationError = 'La desviacion estandar debe ser mayor que 0.';
      return;
    }
    this.standardizationError = null;
    this.zResult = (this.xInput - this.zMean) / this.zStd;
    this.xResult = this.zMean + (this.zInput * this.zStd);
  }

  formatNumberValue(value: number): string {
    return formatNumber(value);
  }

  formatPercentValue(value: number): string {
    return formatPercent(value);
  }

  formatAny(value: number | string): string {
    return typeof value === 'number' ? formatNumber(value) : value;
  }

  private applyDistributionDefaults(distribution: DistributionKey): void {
    switch (distribution) {
      case 'normal':
        this.form.patchValue({ mean: 0, stdDev: 1, x: 1.96, lower: -1, upper: 1 });
        break;
      case 'binomial':
        this.form.patchValue({ trials: 10, successProb: 0.5, x: 3, lower: 2, upper: 6 });
        break;
      case 'poisson':
        this.form.patchValue({ lambda: 4, x: 3, lower: 2, upper: 7 });
        break;
      case 'exponential':
        this.form.patchValue({ rate: 1.2, x: 1, lower: 0.5, upper: 2 });
        break;
      case 'uniform':
        this.form.patchValue({ min: 0, max: 10, x: 6, lower: 2, upper: 8 });
        break;
      case 'student-t':
        this.form.patchValue({ degreesFreedom: 10, x: 1.5, lower: -1, upper: 1 });
        break;
      case 'chi-square':
        this.form.patchValue({ degreesFreedom: 8, x: 6, lower: 3, upper: 10 });
        break;
      case 'f':
        this.form.patchValue({ df1: 5, df2: 12, x: 1.3, lower: 0.8, upper: 2.5 });
        break;
    }
  }

  private validateInput(input: ProbabilityInput): string | null {
    if (!Number.isFinite(input.x) || !Number.isFinite(input.lower) || !Number.isFinite(input.upper)) {
      return 'x, lower y upper deben ser numericos.';
    }

    if (input.mode === 'interval' && input.upper <= input.lower) {
      return 'Upper debe ser mayor que lower para un intervalo valido.';
    }

    switch (input.distribution) {
      case 'normal':
        if (!Number.isFinite(input.mean) || !Number.isFinite(input.stdDev) || input.stdDev <= 0) {
          return 'En Normal, sigma debe ser mayor que 0.';
        }
        break;
      case 'binomial':
        if (!Number.isFinite(input.trials) || input.trials < 1 || !Number.isInteger(input.trials)) {
          return 'En Binomial, n debe ser entero mayor o igual a 1.';
        }
        if (!Number.isFinite(input.successProb) || input.successProb < 0 || input.successProb > 1) {
          return 'En Binomial, p debe estar entre 0 y 1.';
        }
        break;
      case 'poisson':
        if (!Number.isFinite(input.lambda) || input.lambda <= 0) {
          return 'En Poisson, lambda debe ser mayor que 0.';
        }
        break;
      case 'exponential':
        if (!Number.isFinite(input.rate) || input.rate <= 0) {
          return 'En Exponential, rate debe ser mayor que 0.';
        }
        break;
      case 'uniform':
        if (!Number.isFinite(input.min) || !Number.isFinite(input.max) || input.max <= input.min) {
          return 'En Uniform, max debe ser mayor que min.';
        }
        break;
      case 'student-t':
        if (!Number.isFinite(input.degreesFreedom) || input.degreesFreedom <= 0) {
          return 'En t de Student, los grados de libertad deben ser mayores que 0.';
        }
        break;
      case 'chi-square':
        if (!Number.isFinite(input.degreesFreedom) || input.degreesFreedom <= 0) {
          return 'En Chi-cuadrada, los grados de libertad deben ser mayores que 0.';
        }
        break;
      case 'f':
        if (!Number.isFinite(input.df1) || input.df1 <= 0 || !Number.isFinite(input.df2) || input.df2 <= 0) {
          return 'En F, df1 y df2 deben ser mayores que 0.';
        }
        break;
    }

    const isDiscrete = distributionKind(input.distribution) === 'discrete';
    if (isDiscrete && input.mode === 'point' && !Number.isInteger(input.x)) {
      return 'Para point en distribucion discreta, x debe ser entero.';
    }

    return null;
  }
}
