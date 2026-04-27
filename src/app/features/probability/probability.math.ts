export type DistributionKey =
  | 'normal'
  | 'binomial'
  | 'poisson'
  | 'exponential'
  | 'uniform'
  | 'student-t'
  | 'chi-square'
  | 'f';

export type EventMode = 'left' | 'right' | 'interval' | 'point';

export interface DistributionDefinition {
  key: DistributionKey;
  label: string;
  kind: 'continuous' | 'discrete';
  description: string;
}

export interface ProbabilityInput {
  distribution: DistributionKey;
  mode: EventMode;
  x: number;
  lower: number;
  upper: number;
  includeBoundary: boolean;
  includeLower: boolean;
  includeUpper: boolean;
  mean: number;
  stdDev: number;
  trials: number;
  successProb: number;
  lambda: number;
  rate: number;
  min: number;
  max: number;
  degreesFreedom: number;
  df1: number;
  df2: number;
}

export interface DistributionStats {
  mean: number;
  variance: number;
  stdDev: number;
  median: number | string;
  mode: number | string;
  support: string;
  family: 'continuous' | 'discrete';
}

export interface ProbabilityResult {
  eventLabel: string;
  probability: number;
  complement: number;
  cdfAtX: number;
  leftTail: number;
  rightTail: number;
  pointValueLabel: string;
  pointValue: number;
  pointAt: number;
  stats: DistributionStats;
  notes: string[];
}

export const DISTRIBUTIONS: DistributionDefinition[] = [
  {
    key: 'normal',
    label: 'Normal',
    kind: 'continuous',
    description: 'Distribucion continua definida por media y desviacion estandar.'
  },
  {
    key: 'binomial',
    label: 'Binomial',
    kind: 'discrete',
    description: 'Numero de exitos en n ensayos independientes con probabilidad p.'
  },
  {
    key: 'poisson',
    label: 'Poisson',
    kind: 'discrete',
    description: 'Conteo de eventos en un intervalo con promedio lambda.'
  },
  {
    key: 'exponential',
    label: 'Exponencial',
    kind: 'continuous',
    description: 'Tiempo entre eventos con tasa constante.'
  },
  {
    key: 'uniform',
    label: 'Uniforme',
    kind: 'continuous',
    description: 'Todos los valores entre a y b tienen igual densidad.'
  },
  {
    key: 'student-t',
    label: 't de Student',
    kind: 'continuous',
    description: 'Distribucion simetrica con grados de libertad nu.'
  },
  {
    key: 'chi-square',
    label: 'Chi-cuadrada',
    kind: 'continuous',
    description: 'Distribucion de suma de cuadrados con grados de libertad k.'
  },
  {
    key: 'f',
    label: 'F de Fisher',
    kind: 'continuous',
    description: 'Distribucion de razon de varianzas con df1 y df2.'
  }
];

export function calculateProbability(input: ProbabilityInput): ProbabilityResult {
  switch (input.distribution) {
    case 'normal':
      return solveNormal(input);
    case 'binomial':
      return solveBinomial(input);
    case 'poisson':
      return solvePoisson(input);
    case 'exponential':
      return solveExponential(input);
    case 'uniform':
      return solveUniform(input);
    case 'student-t':
      return solveStudentT(input);
    case 'chi-square':
      return solveChiSquare(input);
    case 'f':
      return solveF(input);
  }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  if (Math.abs(value) >= 1_000_000) {
    return value.toExponential(4);
  }
  const rounded = Number(value.toFixed(8));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatPercent(probability: number): string {
  return `${formatNumber(probability * 100)}%`;
}

export function distributionKind(key: DistributionKey): 'continuous' | 'discrete' {
  return DISTRIBUTIONS.find((item) => item.key === key)?.kind ?? 'continuous';
}

function solveNormal(input: ProbabilityInput): ProbabilityResult {
  const mean = input.mean;
  const stdDev = input.stdDev;
  const cdf = (value: number): number => normalCdf(value, mean, stdDev);
  const pdf = (value: number): number => normalPdf(value, mean, stdDev);

  return solveContinuousEvent(
    input,
    cdf,
    pdf,
    {
      mean,
      variance: stdDev ** 2,
      stdDev,
      median: mean,
      mode: mean,
      support: '(-inf, +inf)',
      family: 'continuous'
    }
  );
}

function solveExponential(input: ProbabilityInput): ProbabilityResult {
  const rate = input.rate;
  const cdf = (value: number): number => exponentialCdf(value, rate);
  const pdf = (value: number): number => exponentialPdf(value, rate);

  return solveContinuousEvent(
    input,
    cdf,
    pdf,
    {
      mean: 1 / rate,
      variance: 1 / (rate ** 2),
      stdDev: 1 / rate,
      median: Math.log(2) / rate,
      mode: 0,
      support: '[0, +inf)',
      family: 'continuous'
    }
  );
}

function solveUniform(input: ProbabilityInput): ProbabilityResult {
  const min = input.min;
  const max = input.max;
  const cdf = (value: number): number => uniformCdf(value, min, max);
  const pdf = (value: number): number => uniformPdf(value, min, max);

  return solveContinuousEvent(
    input,
    cdf,
    pdf,
    {
      mean: (min + max) / 2,
      variance: ((max - min) ** 2) / 12,
      stdDev: Math.sqrt(((max - min) ** 2) / 12),
      median: (min + max) / 2,
      mode: 'No unica',
      support: `[${formatNumber(min)}, ${formatNumber(max)}]`,
      family: 'continuous'
    }
  );
}

function solveStudentT(input: ProbabilityInput): ProbabilityResult {
  const nu = input.degreesFreedom;
  const cdf = (value: number): number => studentTCdf(value, nu);
  const pdf = (value: number): number => studentTPdf(value, nu);
  const variance = nu > 2 ? nu / (nu - 2) : Number.NaN;
  const stdDev = Number.isFinite(variance) ? Math.sqrt(variance) : Number.NaN;
  const mean = nu > 1 ? 0 : Number.NaN;

  const notes: string[] = [];
  if (nu <= 1) {
    notes.push('La media de t no esta definida para nu <= 1.');
  }
  if (nu <= 2) {
    notes.push('La varianza de t no esta definida para nu <= 2.');
  }

  const result = solveContinuousEvent(
    input,
    cdf,
    pdf,
    {
      mean,
      variance,
      stdDev,
      median: 0,
      mode: 0,
      support: '(-inf, +inf)',
      family: 'continuous'
    }
  );
  result.notes.push(...notes);
  return result;
}

function solveChiSquare(input: ProbabilityInput): ProbabilityResult {
  const k = input.degreesFreedom;
  const cdf = (value: number): number => chiSquareCdf(value, k);
  const pdf = (value: number): number => chiSquarePdf(value, k);

  return solveContinuousEvent(
    input,
    cdf,
    pdf,
    {
      mean: k,
      variance: 2 * k,
      stdDev: Math.sqrt(2 * k),
      median: k * (1 - (2 / (9 * k))) ** 3,
      mode: Math.max(k - 2, 0),
      support: '[0, +inf)',
      family: 'continuous'
    }
  );
}

function solveF(input: ProbabilityInput): ProbabilityResult {
  const d1 = input.df1;
  const d2 = input.df2;
  const cdf = (value: number): number => fCdf(value, d1, d2);
  const pdf = (value: number): number => fPdf(value, d1, d2);

  const mean = d2 > 2 ? d2 / (d2 - 2) : Number.NaN;
  const variance = d2 > 4 ? (2 * d2 ** 2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) ** 2 * (d2 - 4)) : Number.NaN;
  const stdDev = Number.isFinite(variance) ? Math.sqrt(variance) : Number.NaN;
  const mode = d1 > 2 ? ((d1 - 2) / d1) * (d2 / (d2 + 2)) : 'No definida';

  const notes: string[] = [];
  if (d2 <= 2) {
    notes.push('La media de F no esta definida para df2 <= 2.');
  }
  if (d2 <= 4) {
    notes.push('La varianza de F no esta definida para df2 <= 4.');
  }

  const result = solveContinuousEvent(
    input,
    cdf,
    pdf,
    {
      mean,
      variance,
      stdDev,
      median: 'No cerrada (aprox.)',
      mode,
      support: '(0, +inf)',
      family: 'continuous'
    }
  );
  result.notes.push(...notes);
  return result;
}

function solveBinomial(input: ProbabilityInput): ProbabilityResult {
  const n = Math.floor(input.trials);
  const p = input.successProb;

  const stats: DistributionStats = {
    mean: n * p,
    variance: n * p * (1 - p),
    stdDev: Math.sqrt(n * p * (1 - p)),
    median: Math.floor(n * p),
    mode: Number.isInteger((n + 1) * p) ? `${(n + 1) * p - 1} y ${(n + 1) * p}` : Math.floor((n + 1) * p),
    support: `{0, 1, ..., ${n}}`,
    family: 'discrete'
  };

  return solveDiscreteEvent(
    input,
    stats,
    (k: number) => binomialPmf(k, n, p),
    (k: number) => binomialCdf(k, n, p)
  );
}

function solvePoisson(input: ProbabilityInput): ProbabilityResult {
  const lambda = input.lambda;
  const mode = Number.isInteger(lambda) ? `${Math.max(0, lambda - 1)} y ${lambda}` : Math.floor(lambda);

  const stats: DistributionStats = {
    mean: lambda,
    variance: lambda,
    stdDev: Math.sqrt(lambda),
    median: Math.floor(lambda + (1 / 3) - (0.02 / lambda)),
    mode,
    support: '{0, 1, 2, ...}',
    family: 'discrete'
  };

  return solveDiscreteEvent(
    input,
    stats,
    (k: number) => poissonPmf(k, lambda),
    (k: number) => poissonCdf(k, lambda)
  );
}

function solveContinuousEvent(
  input: ProbabilityInput,
  cdf: (value: number) => number,
  pdf: (value: number) => number,
  stats: DistributionStats
): ProbabilityResult {
  const notes: string[] = [];
  let eventLabel = '';
  let probability = 0;
  const refPoint = input.mode === 'interval' ? (input.lower + input.upper) / 2 : input.x;
  const cdfAtX = clampProbability(cdf(input.x));
  const leftTail = cdfAtX;
  const rightTail = clampProbability(1 - cdfAtX);

  switch (input.mode) {
    case 'left':
      probability = leftTail;
      eventLabel = input.includeBoundary
        ? `P(X <= ${formatNumber(input.x)})`
        : `P(X < ${formatNumber(input.x)})`;
      notes.push('Para variables continuas, abierto o cerrado en un punto no cambia la probabilidad.');
      break;
    case 'right':
      probability = rightTail;
      eventLabel = input.includeBoundary
        ? `P(X >= ${formatNumber(input.x)})`
        : `P(X > ${formatNumber(input.x)})`;
      notes.push('Para variables continuas, abierto o cerrado en un punto no cambia la probabilidad.');
      break;
    case 'interval':
      probability = cdf(input.upper) - cdf(input.lower);
      eventLabel = `P(${input.includeLower ? '[' : '('}${formatNumber(input.lower)}, ${formatNumber(input.upper)}${input.includeUpper ? ']' : ')' })`;
      notes.push('En distribuciones continuas, incluir extremos no altera el valor del intervalo.');
      break;
    case 'point':
      probability = 0;
      eventLabel = `P(X = ${formatNumber(input.x)})`;
      notes.push('La probabilidad puntual en distribuciones continuas es 0.');
      break;
  }

  probability = clampProbability(probability);
  return {
    eventLabel,
    probability,
    complement: clampProbability(1 - probability),
    cdfAtX,
    leftTail,
    rightTail,
    pointValueLabel: input.mode === 'point' ? 'Densidad f(x)' : 'Densidad en punto de referencia',
    pointValue: Math.max(0, pdf(refPoint)),
    pointAt: refPoint,
    stats,
    notes
  };
}

function solveDiscreteEvent(
  input: ProbabilityInput,
  stats: DistributionStats,
  pmf: (k: number) => number,
  cdf: (k: number) => number
): ProbabilityResult {
  const notes: string[] = [];
  let eventLabel = '';
  let probability = 0;

  const leftTail = clampProbability(cdf(Math.floor(input.x)));
  const rightTail = clampProbability(1 - cdf(Math.ceil(input.x) - 1));
  const cdfAtX = leftTail;

  switch (input.mode) {
    case 'left': {
      const upper = input.includeBoundary ? Math.floor(input.x) : Math.ceil(input.x) - 1;
      probability = upper < 0 ? 0 : cdf(upper);
      eventLabel = input.includeBoundary
        ? `P(X <= ${formatNumber(input.x)})`
        : `P(X < ${formatNumber(input.x)})`;
      break;
    }
    case 'right': {
      const lower = input.includeBoundary ? Math.ceil(input.x) : Math.floor(input.x) + 1;
      probability = lower <= 0 ? 1 : 1 - cdf(lower - 1);
      eventLabel = input.includeBoundary
        ? `P(X >= ${formatNumber(input.x)})`
        : `P(X > ${formatNumber(input.x)})`;
      break;
    }
    case 'interval': {
      const start = input.includeLower ? Math.ceil(input.lower) : Math.floor(input.lower) + 1;
      const end = input.includeUpper ? Math.floor(input.upper) : Math.ceil(input.upper) - 1;
      probability = start > end ? 0 : cdf(end) - cdf(start - 1);
      eventLabel = `P(${input.includeLower ? '[' : '('}${formatNumber(input.lower)}, ${formatNumber(input.upper)}${input.includeUpper ? ']' : ')' })`;
      notes.push(`Se sumaron valores enteros entre ${start} y ${end}.`);
      break;
    }
    case 'point':
      probability = Number.isInteger(input.x) ? pmf(Math.trunc(input.x)) : 0;
      eventLabel = `P(X = ${formatNumber(input.x)})`;
      if (!Number.isInteger(input.x)) {
        notes.push('En distribuciones discretas, valores no enteros tienen probabilidad puntual 0.');
      }
      break;
  }

  probability = clampProbability(probability);
  return {
    eventLabel,
    probability,
    complement: clampProbability(1 - probability),
    cdfAtX,
    leftTail,
    rightTail,
    pointValueLabel: 'Probabilidad puntual PMF',
    pointValue: Number.isInteger(input.x) ? pmf(Math.trunc(input.x)) : 0,
    pointAt: input.x,
    stats,
    notes
  };
}

function normalPdf(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev;
  return Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI));
}

function normalCdf(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / (stdDev * Math.sqrt(2));
  return 0.5 * (1 + erf(z));
}

function exponentialPdf(x: number, rate: number): number {
  if (x < 0) {
    return 0;
  }
  return rate * Math.exp(-rate * x);
}

function exponentialCdf(x: number, rate: number): number {
  if (x <= 0) {
    return 0;
  }
  return 1 - Math.exp(-rate * x);
}

function uniformPdf(x: number, min: number, max: number): number {
  if (x < min || x > max || max <= min) {
    return 0;
  }
  return 1 / (max - min);
}

function uniformCdf(x: number, min: number, max: number): number {
  if (x <= min) {
    return 0;
  }
  if (x >= max) {
    return 1;
  }
  return (x - min) / (max - min);
}

function studentTPdf(x: number, df: number): number {
  const half = (df + 1) / 2;
  const logNumerator = logGamma(half);
  const logDenominator = logGamma(df / 2) + 0.5 * Math.log(df * Math.PI);
  const logKernel = -half * Math.log(1 + (x * x) / df);
  return Math.exp(logNumerator - logDenominator + logKernel);
}

function studentTCdf(x: number, df: number): number {
  if (x === 0) {
    return 0.5;
  }
  const z = df / (df + x * x);
  const ib = regularizedIncompleteBeta(df / 2, 0.5, z);
  if (x > 0) {
    return clampProbability(1 - 0.5 * ib);
  }
  return clampProbability(0.5 * ib);
}

function chiSquarePdf(x: number, df: number): number {
  if (x <= 0) {
    return 0;
  }
  const halfDf = df / 2;
  const logValue = (halfDf - 1) * Math.log(x) - (x / 2) - (halfDf * Math.log(2)) - logGamma(halfDf);
  return Math.exp(logValue);
}

function chiSquareCdf(x: number, df: number): number {
  if (x <= 0) {
    return 0;
  }
  return clampProbability(regularizedGammaP(df / 2, x / 2));
}

function fPdf(x: number, df1: number, df2: number): number {
  if (x <= 0) {
    return 0;
  }
  const a = df1 / 2;
  const b = df2 / 2;
  const logValue =
    (a * Math.log(df1 / df2))
    + ((a - 1) * Math.log(x))
    - ((a + b) * Math.log(1 + (df1 / df2) * x))
    - logBeta(a, b);
  return Math.exp(logValue);
}

function fCdf(x: number, df1: number, df2: number): number {
  if (x <= 0) {
    return 0;
  }
  const z = (df1 * x) / (df1 * x + df2);
  return clampProbability(regularizedIncompleteBeta(df1 / 2, df2 / 2, z));
}

function binomialPmf(k: number, n: number, p: number): number {
  if (!Number.isInteger(k) || k < 0 || k > n) {
    return 0;
  }
  if (p === 0) {
    return k === 0 ? 1 : 0;
  }
  if (p === 1) {
    return k === n ? 1 : 0;
  }
  const logValue =
    logGamma(n + 1)
    - logGamma(k + 1)
    - logGamma(n - k + 1)
    + (k * Math.log(p))
    + ((n - k) * Math.log(1 - p));
  return Math.exp(logValue);
}

function binomialCdf(k: number, n: number, p: number): number {
  if (k < 0) {
    return 0;
  }
  if (k >= n) {
    return 1;
  }
  let sum = 0;
  for (let index = 0; index <= Math.floor(k); index += 1) {
    sum += binomialPmf(index, n, p);
  }
  return clampProbability(sum);
}

function poissonPmf(k: number, lambda: number): number {
  if (!Number.isInteger(k) || k < 0) {
    return 0;
  }
  if (lambda === 0) {
    return k === 0 ? 1 : 0;
  }
  return Math.exp(-lambda + (k * Math.log(lambda)) - logGamma(k + 1));
}

function poissonCdf(k: number, lambda: number): number {
  if (k < 0) {
    return 0;
  }
  let sum = 0;
  for (let index = 0; index <= Math.floor(k); index += 1) {
    sum += poissonPmf(index, lambda);
  }
  return clampProbability(sum);
}

function regularizedGammaP(a: number, x: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x < a + 1) {
    let sum = 1 / a;
    let del = sum;
    let ap = a;
    for (let n = 1; n <= 500; n += 1) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) {
        break;
      }
    }
    return clampProbability(sum * Math.exp(-x + (a * Math.log(x)) - logGamma(a)));
  }
  return clampProbability(1 - regularizedGammaQ(a, x));
}

function regularizedGammaQ(a: number, x: number): number {
  const fpMin = 1e-300;
  let b = x + 1 - a;
  let c = 1 / fpMin;
  let d = 1 / Math.max(b, fpMin);
  let h = d;
  for (let i = 1; i <= 500; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < fpMin) {
      d = fpMin;
    }
    c = b + an / c;
    if (Math.abs(c) < fpMin) {
      c = fpMin;
    }
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) {
      break;
    }
  }
  return clampProbability(Math.exp(-x + (a * Math.log(x)) - logGamma(a)) * h);
}

function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x >= 1) {
    return 1;
  }
  const logBt = logGamma(a + b) - logGamma(a) - logGamma(b) + (a * Math.log(x)) + (b * Math.log(1 - x));
  const bt = Math.exp(logBt);
  const threshold = (a + 1) / (a + b + 2);
  if (x < threshold) {
    return clampProbability((bt * betaContinuedFraction(a, b, x)) / a);
  }
  return clampProbability(1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b);
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const maxIterations = 500;
  const eps = 3e-14;
  const fpMin = 1e-300;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpMin) {
    d = fpMin;
  }
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) {
      d = fpMin;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) {
      c = fpMin;
    }
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) {
      d = fpMin;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) {
      c = fpMin;
    }
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < eps) {
      break;
    }
  }
  return h;
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

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

function logGamma(value: number): number {
  const coeff = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7
  ];

  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }

  let sum = 0.9999999999998099;
  const shifted = value - 1;
  for (let index = 0; index < coeff.length; index += 1) {
    sum += coeff[index] / (shifted + index + 1);
  }
  const t = shifted + coeff.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + ((shifted + 0.5) * Math.log(t)) - t + Math.log(sum);
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
