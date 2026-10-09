import { Vector3 } from 'three';

/** Folga entre a borda da pista e o centro do carro (meia largura de um F1 + margem). */
const CAR_MARGIN_M = 1.2;
/** Grades da mais grossa para a mais fina (uma amostra a cada k): forma global → ajuste fino. */
const GRID_STRIDES = [32, 16, 8, 4, 2, 1];
const ITERATIONS_PER_GRID = 3000;
/**
 * Passo do gradiente. O operador da energia (4ª diferença) tem norma ≤ 16, então o
 * gradiente (2× isso) é estável para passo < 1/16.
 */
const STEP = 0.05;

/**
 * Suavização leve da linha central (média móvel ±3 amostras ≈ ±15 m, duas passadas) antes
 * de calcular normais: tira o ruído do GPS sem deformar as curvas. Normais tiradas de
 * vizinhos distantes, em vez disso, "enxergam" o grampo seguinte, giram, e o deslocamento
 * lateral passa a empurrar os pontos ao longo da pista (eles se amontoam).
 */
const SMOOTHING_RADIUS = 3;
const SMOOTHING_PASSES = 2;

export function smoothCenterline(center: Vector3[]): Vector3[] {
  const n = center.length;
  let current = center;
  for (let pass = 0; pass < SMOOTHING_PASSES; pass++) {
    current = current.map((_, i) => {
      const sum = new Vector3();
      for (let j = -SMOOTHING_RADIUS; j <= SMOOTHING_RADIUS; j++) {
        sum.add(current[(i + j + n) % n] as Vector3);
      }
      return sum.multiplyScalar(1 / (2 * SMOOTHING_RADIUS + 1));
    });
  }
  return current;
}

/** Vetor lateral horizontal de cada amostra: cross(tangente, cima), mesma convenção da cena. */
export function lateralNormals(center: Vector3[]): Vector3[] {
  const n = center.length;
  return center.map((_, i) => {
    const prev = center[(i - 1 + n) % n] as Vector3;
    const next = center[(i + 1) % n] as Vector3;
    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const length = Math.hypot(tx, tz) || 1;
    // (tx, 0, tz) × (0, 1, 0) = (−tz, 0, tx)
    return new Vector3(-tz / length, 0, tx / length);
  });
}

/**
 * Gradiente projetado da "energia de flexão" E = Σ |r[i−1] − 2·r[i] + r[i+1]|² numa grade
 * de pontos r[i] = centro[i] + normal[i]·d[i], com d preso a ±limit.
 * ∂E/∂d[j] = 2·normal[j] · (s[j−1] − 2·s[j] + s[j+1]), onde s é a 2ª diferença.
 */
function minimizeBending(
  center: Vector3[],
  normals: Vector3[],
  initial: number[],
  lower: number[],
  upper: number[],
  iterations: number,
) {
  const m = center.length;
  const d = [...initial];
  const sx = new Float64Array(m);
  const sz = new Float64Array(m);
  const at = (i: number) => ((i % m) + m) % m;

  for (let iteration = 0; iteration < iterations; iteration++) {
    for (let i = 0; i < m; i++) {
      const a = at(i - 1);
      const b = at(i + 1);
      const ra = center[a] as Vector3;
      const r = center[i] as Vector3;
      const rb = center[b] as Vector3;
      const na = normals[a] as Vector3;
      const ni = normals[i] as Vector3;
      const nb = normals[b] as Vector3;
      const da = d[a] as number;
      const di = d[i] as number;
      const db = d[b] as number;
      sx[i] = ra.x + na.x * da - 2 * (r.x + ni.x * di) + rb.x + nb.x * db;
      sz[i] = ra.z + na.z * da - 2 * (r.z + ni.z * di) + rb.z + nb.z * db;
    }
    for (let j = 0; j < m; j++) {
      const a = at(j - 1);
      const b = at(j + 1);
      const gx = (sx[a] as number) - 2 * (sx[j] as number) + (sx[b] as number);
      const gz = (sz[a] as number) - 2 * (sz[j] as number) + (sz[b] as number);
      const normal = normals[j] as Vector3;
      const gradient = 2 * (normal.x * gx + normal.z * gz);
      d[j] = Math.max(
        lower[j] as number,
        Math.min(upper[j] as number, (d[j] as number) - STEP * gradient),
      );
    }
  }
  return d;
}

/**
 * Trajetória de corrida aproximada, minimizando a energia de flexão dentro da pista.
 * Abre na entrada, toca o ápice por dentro e volta para fora na saída, e atravessa
 * chicanes em linha mais reta.
 *
 * A penalidade de segunda diferença distribui a mudança de direção pela entrada e saída.
 * É uma aproximação geométrica; não reproduz telemetria de uma volta real.
 *
 * Resolvido em grades sucessivas (multigrid), porque numa grade fina o gradiente leva
 * milhares de passos para "enxergar" a forma de uma curva longa.
 *
 * Devolve o deslocamento lateral de cada amostra em metros (positivo = lado da normal) e o
 * limite usado (meia largura útil), para normalizar a saída em −1…1.
 */
export function racingLineOffsets(rawCenter: Vector3[], trackWidthM: number) {
  const center = smoothCenterline(rawCenter);
  const n = center.length;
  const normals = lateralNormals(center);
  const limit = trackWidthM / 2 - CAR_MARGIN_M;

  // Limites medidos a partir da linha central ORIGINAL: em curvas fechadas a suavização
  // puxa a referência para dentro, e sem essa correção a trajetória sairia da pista.
  const shift = rawCenter.map((raw, i) => {
    const c = center[i] as Vector3;
    const normal = normals[i] as Vector3;
    return (raw.x - c.x) * normal.x + (raw.z - c.z) * normal.z;
  });
  const lower = shift.map((s) => s - limit);
  const upper = shift.map((s) => s + limit);
  let offsets = shift.slice();

  for (const stride of GRID_STRIDES) {
    const count = Math.ceil(n / stride);
    const indices = Array.from({ length: count }, (_, i) => Math.round((i * n) / count));
    const solved = minimizeBending(
      indices.map((i) => center[i] as Vector3),
      indices.map((i) => normals[i] as Vector3),
      indices.map((i) => offsets[i] as number),
      indices.map((i) => lower[i] as number),
      indices.map((i) => upper[i] as number),
      ITERATIONS_PER_GRID,
    );

    // Interpola linearmente para a resolução completa (ponto de partida da próxima grade)
    let k = 0;
    offsets = offsets.map((_, i) => {
      while (k + 1 < count && i >= indices[k + 1]!) k++;
      const start = indices[k]!;
      const end = indices[k + 1] ?? n;
      const t = (i - start) / (end - start);
      const a = solved[k] as number;
      const b = solved[(k + 1) % solved.length] as number;
      return a + (b - a) * t;
    });
  }

  // Saída relativa à linha central original (é ela que a cena desenha). O clamp final só
  // absorve o erro de ponto flutuante de (d − shift), que poderia passar do limite em 1e-15.
  return {
    offsets: offsets.map((d, i) => Math.max(-limit, Math.min(limit, d - (shift[i] as number)))),
    limit,
  };
}

/**
 * Pontos da trajetória (y = 0; a altimetria é aplicada depois, por amostra). Os
 * deslocamentos são relativos à linha central original, ao longo das normais suavizadas.
 */
export function applyOffsets(rawCenter: Vector3[], offsets: number[]): Vector3[] {
  const normals = lateralNormals(smoothCenterline(rawCenter));
  return rawCenter.map((c, i) =>
    c.clone().addScaledVector(normals[i] as Vector3, offsets[i] as number),
  );
}

/** Comprimento de cada segmento i → i+1 (circuito fechado). */
export function segmentLengths(points: Vector3[]): number[] {
  const n = points.length;
  return points.map((p, i) => p.distanceTo(points[(i + 1) % n] as Vector3));
}
