import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  type EventMode,
  evaluateNormalEvent,
  normalPdf,
  quantileFromTail,
  solveMuFromTail,
  solveMuSigmaFromTwoTails,
  standardError,
  type TailSide
} from './normal-assignment.math';
import { startGuidedTour, type TourStep } from '../../shared/driver-tour';

type SolverType = 'normal' | 'sampling' | 'inverse' | 'solve-mu' | 'solve-mu-sigma';

interface GraphSpec {
  mean: number;
  stdDev: number;
  event: {
    mode: EventMode;
    x: number;
    lower: number;
    upper: number;
  };
  title: string;
}

@Component({
  selector: 'app-normal-assignment-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './normal-assignment.page.html',
  styleUrl: './normal-assignment.page.scss'
})
export class NormalAssignmentPageComponent implements AfterViewInit {
  @ViewChild('normalCanvas') private readonly normalCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartWrap') private readonly chartWrap?: ElementRef<HTMLDivElement>;

  solverType: SolverType = 'normal';

  mu = 0;
  sigma = 1;
  eventMode: EventMode = 'interval';
  x = 0.35;
  lower = -0.5;
  upper = 1.5;

  sampleMu = 50;
  sampleSigma = 10;
  sampleN = 36;
  sampleEventMode: EventMode = 'interval';
  sampleX = 48;
  sampleLower = 45;
  sampleUpper = 55;

  inverseMu = 50;
  inverseSigma = 7.3;
  inverseArea = 0.04;
  inverseSide: TailSide = 'right';

  solveMuX = 40;
  solveMuSigma = 4;
  solveMuProb = 0.8944;
  solveMuSide: TailSide = 'right';

  x1 = 15;
  p1 = 0.1587;
  side1: TailSide = 'right';
  x2 = 9;
  p2 = 0.8413;
  side2: TailSide = 'right';

  resultTitle = 'Resultado';
  resultLines: string[] = [];
  errorMessage: string | null = null;

  private graphSpec: GraphSpec | null = null;

  ngAfterViewInit(): void {
    this.solve();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.queueDraw();
  }

  async startTutorial(): Promise<void> {
    const steps: TourStep[] = [
      {
        element: '[data-tour="na-hero"]',
        popover: {
          title: 'Módulo de distribución normal',
          description: 'Este módulo resuelve normal, media muestral, percentiles y casos inversos con gráfica.'
        }
      },
      {
        element: '[data-tour="na-solver-type"]',
        popover: {
          title: 'Tipo de resolución',
          description: 'Selecciona el enfoque del problema: normal directa, X̄, cuantil o despeje de parámetros.'
        }
      },
      {
        element: '[data-tour="na-controls"]',
        popover: {
          title: 'Entrada de datos',
          description: 'Captura aquí todos los valores del enunciado según el tipo de resolución seleccionado.'
        }
      },
      {
        element: '[data-tour="na-solve-action"]',
        popover: {
          title: 'Resolver y graficar',
          description: 'Ejecuta el cálculo y actualiza tanto el resultado numérico como la región sombreada.'
        }
      },
      {
        element: '[data-tour="na-results"]',
        popover: {
          title: 'Interpretación',
          description: 'Muestra probabilidad, valores z, fórmula aplicada y datos intermedios de verificación.'
        }
      },
      {
        element: '[data-tour="na-chart"]',
        popover: {
          title: 'Gráfica normal',
          description: 'Visualiza la curva y el área del evento para explicar el resultado en clase.'
        }
      }
    ];

    await startGuidedTour(steps);
  }

  solve(): void {
    this.errorMessage = null;

    try {
      if (this.solverType === 'normal') {
        const result = evaluateNormalEvent(this.mu, this.sigma, {
          mode: this.eventMode,
          x: this.x,
          lower: this.lower,
          upper: this.upper
        });
        this.resultTitle = 'Distribución normal';
        this.resultLines = [
          `μ = ${this.f(this.mu)}, σ = ${this.f(this.sigma)}`,
          `Probabilidad = ${this.p(result.probability)}`,
          `z(x) = ${this.f(result.zAtX)}`,
          `Cola izquierda en x = ${this.p(result.leftTailAtX)}`,
          `Cola derecha en x = ${this.p(result.rightTailAtX)}`,
          result.zLower == null ? '' : `z(lower) = ${this.f(result.zLower)}`,
          result.zUpper == null ? '' : `z(upper) = ${this.f(result.zUpper)}`,
          `Fórmula: ${result.explanation}`
        ].filter(Boolean);
        this.graphSpec = {
          mean: this.mu,
          stdDev: this.sigma,
          event: { mode: this.eventMode, x: this.x, lower: this.lower, upper: this.upper },
          title: `N(${this.f(this.mu)}, ${this.f(this.sigma)}²)`
        };
      } else if (this.solverType === 'sampling') {
        const se = standardError(this.sampleSigma, this.sampleN);
        const result = evaluateNormalEvent(this.sampleMu, se, {
          mode: this.sampleEventMode,
          x: this.sampleX,
          lower: this.sampleLower,
          upper: this.sampleUpper
        });
        this.resultTitle = 'Distribución de la media muestral';
        this.resultLines = [
          `Población: μ = ${this.f(this.sampleMu)}, σ = ${this.f(this.sampleSigma)}`,
          `Muestra: n = ${this.f(this.sampleN)}`,
          `Error estándar: σx̄ = σ/√n = ${this.f(se)}`,
          `Probabilidad = ${this.p(result.probability)}`,
          `z(x̄) = ${this.f(result.zAtX)}`,
          `Fórmula: ${result.explanation}`
        ];
        this.graphSpec = {
          mean: this.sampleMu,
          stdDev: se,
          event: { mode: this.sampleEventMode, x: this.sampleX, lower: this.sampleLower, upper: this.sampleUpper },
          title: `X̄ ~ N(${this.f(this.sampleMu)}, ${this.f(se)}²)`
        };
      } else if (this.solverType === 'inverse') {
        const result = quantileFromTail(this.inverseMu, this.inverseSigma, this.inverseArea, this.inverseSide);
        this.resultTitle = 'Cuantil / Percentil normal';
        this.resultLines = [
          `μ = ${this.f(this.inverseMu)}, σ = ${this.f(this.inverseSigma)}`,
          `Área ${this.inverseSide === 'left' ? 'izquierda' : 'derecha'} = ${this.p(this.inverseArea)}`,
          `z = ${this.f(result.z)}`,
          `x = ${this.f(result.x)}`,
          `Fórmula: ${result.explanation}`
        ];
        this.graphSpec = {
          mean: this.inverseMu,
          stdDev: this.inverseSigma,
          event: {
            mode: this.inverseSide === 'left' ? 'left' : 'right',
            x: result.x,
            lower: result.x,
            upper: result.x
          },
          title: `Cuantil en N(${this.f(this.inverseMu)}, ${this.f(this.inverseSigma)}²)`
        };
      } else if (this.solverType === 'solve-mu') {
        const result = solveMuFromTail(this.solveMuX, this.solveMuSigma, this.solveMuProb, this.solveMuSide);
        const check = evaluateNormalEvent(result.mu, this.solveMuSigma, {
          mode: this.solveMuSide === 'left' ? 'left' : 'right',
          x: this.solveMuX,
          lower: this.solveMuX,
          upper: this.solveMuX
        });
        this.resultTitle = 'Resolver media μ';
        this.resultLines = [
          `Dato: x = ${this.f(this.solveMuX)}, σ = ${this.f(this.solveMuSigma)}`,
          `Probabilidad ${this.solveMuSide === 'left' ? 'P(X≤x)' : 'P(X≥x)'} = ${this.p(this.solveMuProb)}`,
          `z = ${this.f(result.z)}`,
          `μ = ${this.f(result.mu)}`,
          `Verificación numérica = ${this.p(check.probability)}`,
          `Fórmula: ${result.explanation}`
        ];
        this.graphSpec = {
          mean: result.mu,
          stdDev: this.solveMuSigma,
          event: {
            mode: this.solveMuSide === 'left' ? 'left' : 'right',
            x: this.solveMuX,
            lower: this.solveMuX,
            upper: this.solveMuX
          },
          title: `N(${this.f(result.mu)}, ${this.f(this.solveMuSigma)}²)`
        };
      } else {
        const result = solveMuSigmaFromTwoTails(
          this.x1,
          this.p1,
          this.side1,
          this.x2,
          this.p2,
          this.side2
        );
        this.resultTitle = 'Resolver μ y σ';
        this.resultLines = [
          `Ecuación 1: x1=${this.f(this.x1)}, p1=${this.p(this.p1)} (${this.side1 === 'left' ? 'left' : 'right'})`,
          `Ecuación 2: x2=${this.f(this.x2)}, p2=${this.p(this.p2)} (${this.side2 === 'left' ? 'left' : 'right'})`,
          `z1 = ${this.f(result.z1)}, z2 = ${this.f(result.z2)}`,
          `μ = ${this.f(result.mu)}`,
          `σ = ${this.f(result.sigma)}`,
          `Fórmula: ${result.explanation}`
        ];
        this.graphSpec = {
          mean: result.mu,
          stdDev: result.sigma,
          event: {
            mode: this.side1 === 'left' ? 'left' : 'right',
            x: this.x1,
            lower: this.x1,
            upper: this.x1
          },
          title: `N(${this.f(result.mu)}, ${this.f(result.sigma)}²)`
        };
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : String(error);
      this.resultLines = [];
      this.graphSpec = null;
    }

    this.queueDraw();
  }

  exportGraph(): void {
    const canvas = this.normalCanvas?.nativeElement;
    if (!canvas) {
      return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `grafica-normal-${new Date().getTime()}.png`;
    link.click();
  }

  private queueDraw(): void {
    requestAnimationFrame(() => this.drawGraph());
  }

  private drawGraph(): void {
    const canvas = this.normalCanvas?.nativeElement;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const containerRect = this.chartWrap?.nativeElement.getBoundingClientRect();
    const width = Math.max(320, Math.floor(containerRect?.width || canvas.getBoundingClientRect().width || 960));
    const autoHeight = Math.floor(width * 0.56);
    const height = Math.max(260, Math.min(560, autoHeight));
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!this.graphSpec) {
      this.drawPlaceholder(ctx, width, height);
      return;
    }

    const { mean, stdDev, event } = this.graphSpec;
    const markers = [event.x, event.lower, event.upper].filter((value) => Number.isFinite(value));
    let minX = mean - 4 * stdDev;
    let maxX = mean + 4 * stdDev;
    if (markers.length > 0) {
      minX = Math.min(minX, Math.min(...markers) - 1.5 * stdDev);
      maxX = Math.max(maxX, Math.max(...markers) + 1.5 * stdDev);
    }

    const compact = width < 560;
    const left = compact ? 46 : 62;
    const top = compact ? 30 : 34;
    const right = compact ? 12 : 20;
    const bottom = compact ? 52 : 62;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const xToPx = (x: number): number => left + ((x - minX) / (maxX - minX)) * plotWidth;
    const yMax = normalPdf(mean, mean, stdDev);
    const yToPx = (y: number): number => top + plotHeight - (y / yMax) * (plotHeight * 0.85);
    const baseY = top + plotHeight;

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#f8fbff');
    bg.addColorStop(1, '#ecf4ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(left, top, plotWidth, plotHeight);
    ctx.strokeStyle = '#d7e4f6';
    ctx.strokeRect(left, top, plotWidth, plotHeight);

    ctx.strokeStyle = '#d3e1f3';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) {
      const y = top + (plotHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + plotWidth, y);
      ctx.stroke();
    }

    const points = 460;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < points; i += 1) {
      const x = minX + ((maxX - minX) * i) / (points - 1);
      xs.push(x);
      ys.push(normalPdf(x, mean, stdDev));
    }

    ctx.fillStyle = 'rgba(37, 99, 235, 0.22)';
    for (let i = 0; i < points - 1; i += 1) {
      const x1 = xs[i];
      const x2 = xs[i + 1];
      const mid = (x1 + x2) / 2;
      if (!this.xBelongs(mid, event)) {
        continue;
      }
      const y1 = yToPx(ys[i]);
      const y2 = yToPx(ys[i + 1]);
      ctx.beginPath();
      ctx.moveTo(xToPx(x1), baseY);
      ctx.lineTo(xToPx(x1), y1);
      ctx.lineTo(xToPx(x2), y2);
      ctx.lineTo(xToPx(x2), baseY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(xToPx(xs[0]), yToPx(ys[0]));
    for (let i = 1; i < points; i += 1) {
      ctx.lineTo(xToPx(xs[i]), yToPx(ys[i]));
    }
    ctx.stroke();

    this.drawMarkerLine(ctx, xToPx, event.mode === 'interval' ? event.lower : event.x, top, plotHeight, '#0f766e');
    if (event.mode === 'interval') {
      this.drawMarkerLine(ctx, xToPx, event.upper, top, plotHeight, '#0f766e');
    }

    ctx.strokeStyle = '#9db4d3';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(left, baseY);
    ctx.lineTo(left + plotWidth, baseY);
    ctx.stroke();

    ctx.fillStyle = '#17385f';
    ctx.font = compact ? '700 14px Sora, sans-serif' : '700 17px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.graphSpec.title, width / 2, 22);

    ctx.font = compact ? '500 10px Sora, sans-serif' : '500 11px Sora, sans-serif';
    ctx.fillStyle = '#355b84';
    const ticks = [minX, mean, maxX];
    ticks.forEach((tick) => {
      ctx.textAlign = 'center';
      ctx.fillText(this.f(tick), xToPx(tick), baseY + 18);
    });
  }

  private drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#f8fbff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#d7e4f6';
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    ctx.fillStyle = '#4c678b';
    ctx.textAlign = 'center';
    ctx.font = '600 16px Sora, sans-serif';
    ctx.fillText('Configura los valores y presiona Resolver para generar la gráfica.', width / 2, height / 2);
  }

  private drawMarkerLine(
    ctx: CanvasRenderingContext2D,
    xToPx: (value: number) => number,
    value: number,
    top: number,
    plotHeight: number,
    color: string
  ): void {
    if (!Number.isFinite(value)) {
      return;
    }
    const x = xToPx(value);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + plotHeight);
    ctx.stroke();
    ctx.restore();
  }

  private xBelongs(x: number, event: GraphSpec['event']): boolean {
    switch (event.mode) {
      case 'left':
        return x <= event.x;
      case 'right':
        return x >= event.x;
      case 'interval':
        return x >= event.lower && x <= event.upper;
      case 'point':
        return false;
    }
  }

  f(value: number): string {
    if (!Number.isFinite(value)) {
      return 'N/A';
    }
    return Number(value.toFixed(6)).toString();
  }

  p(value: number): string {
    return `${this.f(value * 100)}%`;
  }
}
