export type EventMode = 'left' | 'right' | 'interval' | 'point';
export type TailSide = 'left' | 'right';

export interface NormalEventInput {
  mode: EventMode;
  x: number;
  lower: number;
  upper: number;
}

export interface NormalEventResult {
  probability: number;
  leftTailAtX: number;
  rightTailAtX: number;
  zAtX: number;
  zLower?: number;
  zUpper?: number;
  explanation: string;
}

export interface QuantileResult {
  x: number;
  z: number;
  side: TailSide;
  area: number;
  explanation: string;
}

export interface SolveMuResult {
  mu: number;
  z: number;
  side: TailSide;
  explanation: string;
}

export interface SolveMuSigmaResult {
  mu: number;
  sigma: number;
  z1: number;
  z2: number;
  explanation: string;
}

export function normalPdf(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev;
  return Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI));
}

export function normalCdf(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev;
  return standardNormalCdf(z);
}

export function standardNormalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

export function standardNormalInvCdf(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('La probabilidad acumulada debe estar entre 0 y 1 (exclusivo).');
  }

  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.38357751867269e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];

  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];

  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];

  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const low = 0.02425;
  const high = 1 - low;

  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (p > high) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
    / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function evaluateNormalEvent(
  mean: number,
  stdDev: number,
  event: NormalEventInput
): NormalEventResult {
  ensureStdDev(stdDev);

  const leftTail = normalCdf(event.x, mean, stdDev);
  const rightTail = 1 - leftTail;
  const zAtX = (event.x - mean) / stdDev;

  if (event.mode === 'left') {
    return {
      probability: clampProbability(leftTail),
      leftTailAtX: clampProbability(leftTail),
      rightTailAtX: clampProbability(rightTail),
      zAtX,
      explanation: `P(X ≤ ${fmt(event.x)}) = Φ(${fmt(zAtX)})`
    };
  }

  if (event.mode === 'right') {
    return {
      probability: clampProbability(rightTail),
      leftTailAtX: clampProbability(leftTail),
      rightTailAtX: clampProbability(rightTail),
      zAtX,
      explanation: `P(X ≥ ${fmt(event.x)}) = 1 - Φ(${fmt(zAtX)})`
    };
  }

  if (event.mode === 'point') {
    return {
      probability: 0,
      leftTailAtX: clampProbability(leftTail),
      rightTailAtX: clampProbability(rightTail),
      zAtX,
      explanation: 'Para variables continuas normales, P(X = x) = 0.'
    };
  }

  if (event.upper <= event.lower) {
    throw new Error('Para intervalo se requiere upper > lower.');
  }

  const left = normalCdf(event.lower, mean, stdDev);
  const right = normalCdf(event.upper, mean, stdDev);
  const zLower = (event.lower - mean) / stdDev;
  const zUpper = (event.upper - mean) / stdDev;
  return {
    probability: clampProbability(right - left),
    leftTailAtX: clampProbability(leftTail),
    rightTailAtX: clampProbability(rightTail),
    zAtX,
    zLower,
    zUpper,
    explanation: `P(${fmt(event.lower)} ≤ X ≤ ${fmt(event.upper)}) = Φ(${fmt(zUpper)}) - Φ(${fmt(zLower)})`
  };
}

export function quantileFromTail(
  mean: number,
  stdDev: number,
  area: number,
  side: TailSide
): QuantileResult {
  ensureStdDev(stdDev);
  if (!(area > 0 && area < 1)) {
    throw new Error('El area debe estar entre 0 y 1.');
  }

  const cumulative = side === 'left' ? area : 1 - area;
  const z = standardNormalInvCdf(cumulative);
  const x = mean + z * stdDev;
  return {
    x,
    z,
    area,
    side,
    explanation: side === 'left'
      ? `x = μ + zσ con z = Φ⁻¹(${fmt(area)})`
      : `x = μ + zσ con z = Φ⁻¹(1 - ${fmt(area)})`
  };
}

export function solveMuFromTail(
  x: number,
  stdDev: number,
  probability: number,
  side: TailSide
): SolveMuResult {
  ensureStdDev(stdDev);
  if (!(probability > 0 && probability < 1)) {
    throw new Error('La probabilidad debe estar entre 0 y 1.');
  }

  const cumulative = side === 'left' ? probability : 1 - probability;
  const z = standardNormalInvCdf(cumulative);
  const mu = x - z * stdDev;
  return {
    mu,
    z,
    side,
    explanation: side === 'left'
      ? `Si P(X ≤ x)=p entonces z=Φ⁻¹(p) y μ=x-zσ`
      : `Si P(X ≥ x)=p entonces z=Φ⁻¹(1-p) y μ=x-zσ`
  };
}

export function solveMuSigmaFromTwoTails(
  x1: number,
  p1: number,
  side1: TailSide,
  x2: number,
  p2: number,
  side2: TailSide
): SolveMuSigmaResult {
  if (!(p1 > 0 && p1 < 1 && p2 > 0 && p2 < 1)) {
    throw new Error('Las probabilidades deben estar entre 0 y 1.');
  }

  const z1 = standardNormalInvCdf(side1 === 'left' ? p1 : 1 - p1);
  const z2 = standardNormalInvCdf(side2 === 'left' ? p2 : 1 - p2);
  const denominator = z1 - z2;
  if (Math.abs(denominator) < 1e-12) {
    throw new Error('Los dos enunciados son degenerados; no se puede resolver σ.');
  }

  const sigmaRaw = (x1 - x2) / denominator;
  const sigma = Math.abs(sigmaRaw);
  const mu = x1 - z1 * sigma;
  if (!(sigma > 0 && Number.isFinite(sigma))) {
    throw new Error('No se pudo obtener una desviación estándar válida.');
  }

  return {
    mu,
    sigma,
    z1,
    z2,
    explanation: 'Resolver sistema: z1=(x1-μ)/σ y z2=(x2-μ)/σ.'
  };
}

export function standardError(stdDev: number, sampleSize: number): number {
  ensureStdDev(stdDev);
  if (!(sampleSize > 0)) {
    throw new Error('n debe ser mayor que 0.');
  }
  return stdDev / Math.sqrt(sampleSize);
}

function ensureStdDev(stdDev: number): void {
  if (!(stdDev > 0) || !Number.isFinite(stdDev)) {
    throw new Error('La desviación estándar debe ser mayor que 0.');
  }
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function fmt(value: number): string {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  return Number(value.toFixed(6)).toString();
}
