/**
 * Gera os dados dos circuitos usados no Hero a partir dos traçados reais (GeoJSON):
 * linha central em unidades da cena, altimetria, setores, curvas e uma simulação
 * simples de volta (velocidade e tempo por ponto).
 *
 *   npm run track:build
 *
 * Traçados: bacinger/f1-circuits (MIT), ver scripts/data/LICENSE-f1-circuits.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Vector3 } from 'three';
import { CIRCUITS, type CircuitConfig } from './circuits.config';
import { applyOffsets, racingLineOffsets, segmentLengths } from './racing-line';
import { curvatureProfile, loadCenterline } from './track-geometry';

const DATA_DIR = fileURLToPath(new URL('./data/', import.meta.url));
const OUTPUT_DIR = fileURLToPath(new URL('../src/features/hero/track/circuits/', import.meta.url));

/* ---------- Cena ---------- */

/** Maior dimensão do traçado, em unidades da cena (todos os circuitos no mesmo enquadramento). */
const SCENE_SPAN = 9;
/** Exagero vertical: 100 m de desnível somem num mapa de vários km sem isso. */
const ELEVATION_EXAGGERATION = 3;
/** Teto de altura na cena: circuitos curtos (Monaco) ficariam com relevo desproporcional. */
const MAX_SCENE_HEIGHT = 1.4;
/** Uma amostra a cada ~15 m no arquivo final; a cena suaviza com Catmull-Rom. */
const OUTPUT_STRIDE = 3;

/* ---------- Modelo de desempenho (F1 moderno, simplificado) ---------- */

const G = 9.81;
const TOP_SPEED = 97; // m/s (~350 km/h): teto de segurança; na prática o arrasto limita antes
/**
 * Aceleração lateral = aderência mecânica + downforce (∝ v²): ~1,7 g parado, ~4,8 g a
 * 300 km/h. Calibrado com a trajetória de corrida para as voltas ficarem perto de poles reais.
 */
const LATERAL_BASE = 1.7 * G;
const LATERAL_DOWNFORCE = 0.0044;
/** Frenagem também cresce com a downforce: ~1,8 g lento, ~5 g a 300 km/h. */
const BRAKE_BASE = 1.8 * G;
const BRAKE_DOWNFORCE = 0.0045;
/**
 * Aceleração = potência / (massa · v) − arrasto, limitada pela tração em baixa:
 * ~750 kW para ~800 kg e CdA ~1,7 m² dão ~0,35 g a 300 km/h e velocidade final ~327 km/h.
 */
const POWER_PER_MASS = 937; // W/kg
const DRAG_PER_MASS = 0.00125; // ½·ρ·CdA / m
const TRACTION_LIMIT = 12; // m/s²
const accelerationAt = (v: number) =>
  Math.max(0, Math.min(TRACTION_LIMIT, POWER_PER_MASS / Math.max(v, 1) - DRAG_PER_MASS * v * v));
const brakingAt = (v: number) => BRAKE_BASE + BRAKE_DOWNFORCE * v * v;

function cornerSpeedLimit(curvature: number) {
  const k = Math.abs(curvature);
  // v²·k = base + df·v²  →  v = √(base / (k − df)); abaixo de df, a curva é de pé embaixo
  if (k <= LATERAL_DOWNFORCE) return TOP_SPEED;
  return Math.min(TOP_SPEED, Math.sqrt(LATERAL_BASE / (k - LATERAL_DOWNFORCE)));
}

/**
 * Passadas de aceleração (para frente) e frenagem (para trás) num circuito fechado.
 * `segments[i]` é o comprimento do trecho i → i+1 (variável na trajetória de corrida).
 */
function simulateLap(curvature: number[], segments: readonly number[]) {
  const n = curvature.length;
  const speed = curvature.map(cornerSpeedLimit);
  const segment = (i: number) => segments[((i % n) + n) % n] as number;

  for (let lap = 0; lap < 3; lap++) {
    for (let i = 0; i < n; i++) {
      const prev = speed[(i - 1 + n) % n] as number;
      const reachable = Math.sqrt(prev * prev + 2 * accelerationAt(prev) * segment(i - 1));
      speed[i] = Math.min(speed[i] as number, reachable);
    }
    for (let i = n - 1; i >= 0; i--) {
      const next = speed[(i + 1) % n] as number;
      const reachable = Math.sqrt(next * next + 2 * brakingAt(next) * segment(i));
      speed[i] = Math.min(speed[i] as number, reachable);
    }
  }

  const time = [0];
  for (let i = 1; i <= n; i++) {
    const v = ((speed[i - 1] as number) + (speed[i % n] as number)) / 2;
    time.push((time[i - 1] as number) + segment(i - 1) / v);
  }
  return { speed, time };
}

/* ---------- Curvatura ---------- */

/** Janela larga: os traçados vêm de GPS (~30-45 m entre pontos) e o ruído inventaria curvas lentas. */
const SMOOTHING_WINDOW = 10;
/** Grampos são curtos: a média larga os "abriria", então ficam com a estimativa fina. */
const HAIRPIN_RADIUS_M = 35;

function racingCurvature(samples: Vector3[], spacing: number | readonly number[]) {
  const smooth = curvatureProfile(samples, spacing, SMOOTHING_WINDOW);
  const sharp = curvatureProfile(samples, spacing, 3);
  return smooth.map((k, i) => {
    const fine = sharp[i] as number;
    return Math.abs(fine) > 1 / HAIRPIN_RADIUS_M ? fine : k;
  });
}

/**
 * Curvatura da trajetória de corrida: ela já foi suavizada pela energia de flexão,
 * então basta uma média curta; a estimativa fina de grampo só amplificaria ruído residual.
 */
const RACING_LINE_WINDOW = 4;

/* ---------- Utilitários ---------- */

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const round = (value: number, digits: number) => Number(value.toFixed(digits));

function elevationAt(profile: CircuitConfig['elevation'], progress: number) {
  for (let i = 1; i < profile.length; i++) {
    const [p1, m1] = profile[i] as [number, number];
    const [p0, m0] = profile[i - 1] as [number, number];
    if (progress <= p1) return m0 + (m1 - m0) * smoothstep((progress - p0) / (p1 - p0));
  }
  return profile.at(-1)?.[1] ?? 0;
}

function formatLapTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(3).padStart(6, '0')}`;
}

/** Gira as amostras para a linha de chegada ficar no índice 0. */
function startAtFinishLine(samples: Vector3[], offset: number) {
  const k = Math.round(offset * samples.length) % samples.length;
  return [...samples.slice(k), ...samples.slice(0, k)];
}

/**
 * Orienta o traçado pelo eixo principal (PCA) para ele ficar "deitado" na horizontal,
 * com a linha de chegada do lado direito. Só rotação: nunca espelha o circuito.
 */
function orient(samples: Vector3[]) {
  const cx = samples.reduce((s, p) => s + p.x, 0) / samples.length;
  const cz = samples.reduce((s, p) => s + p.z, 0) / samples.length;
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  for (const p of samples) {
    sxx += (p.x - cx) ** 2;
    szz += (p.z - cz) ** 2;
    sxz += (p.x - cx) * (p.z - cz);
  }
  const angle = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];

  let rotated = samples.map((p) => ({
    x: (p.x - cx) * cos + (p.z - cz) * sin,
    z: -(p.x - cx) * sin + (p.z - cz) * cos,
  }));
  if ((rotated[0]?.x ?? 0) < 0) rotated = rotated.map(({ x, z }) => ({ x: -x, z: -z }));
  return rotated;
}

/* ---------- Geração ---------- */

const HEADER = `// Arquivo gerado por scripts/build-track-data.ts. Não edite à mão.\n// Traçados: bacinger/f1-circuits (MIT).\n\n`;

function buildCircuit(config: CircuitConfig) {
  const { samples: raw, length } = loadCenterline(`${DATA_DIR}${config.source}`, OUTPUT_STRIDE);
  const samples = startAtFinishLine(raw, config.startOffset);
  const n = samples.length;

  // Referência: a mesma simulação seguindo a linha central
  const centerSegments = new Array<number>(n).fill(length / n);
  const centerLap = simulateLap(racingCurvature(samples, length / n), centerSegments).time[
    n
  ] as number;

  // Trajetória de corrida: a velocidade e o tempo vêm dela, não do centro da pista
  const { offsets, limit } = racingLineOffsets(samples, config.trackWidthM);
  const racing = applyOffsets(samples, offsets);
  const segments = segmentLengths(racing);
  const racingCurvatureProfile = curvatureProfile(racing, segments, RACING_LINE_WINDOW);
  const { speed, time } = simulateLap(racingCurvatureProfile, segments);
  const lapTime = time[n] as number;
  const racingLength = segments.reduce((sum, s) => sum + s, 0);

  const flat = orient(samples);
  const xs = flat.map((p) => p.x);
  const zs = flat.map((p) => p.z);
  const [minX, maxX, minZ, maxZ] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...zs),
    Math.max(...zs),
  ];
  const scale = SCENE_SPAN / Math.max(maxX - minX, maxZ - minZ);

  const elevations = config.elevation.map(([, m]) => m);
  const minElevation = Math.min(...elevations);
  const range = Math.max(...elevations) - minElevation;
  const verticalScale = Math.min(
    scale * ELEVATION_EXAGGERATION,
    range > 0 ? MAX_SCENE_HEIGHT / range : 0,
  );

  const points: number[] = [];
  const speedsKmh: number[] = [];
  const times: number[] = [];
  const racingOffsets: number[] = [];
  for (let i = 0; i < n; i += OUTPUT_STRIDE) {
    racingOffsets.push(round((offsets[i] as number) / limit, 3));
    const p = flat[i]!;
    points.push(
      round((p.x - (minX + maxX) / 2) * scale, 5),
      round((elevationAt(config.elevation, i / n) - minElevation) * verticalScale, 5),
      round((p.z - (minZ + maxZ) / 2) * scale, 5),
    );
    speedsKmh.push(Math.round((speed[i] as number) * 3.6));
    times.push(round(time[i] as number, 3));
  }

  const timeAt = (progress: number) => time[Math.round(progress * n)] as number;
  const [end1, end2] = config.sectorEnds;
  const sectorTimes = [timeAt(end1), timeAt(end2) - timeAt(end1), lapTime - timeAt(end2)].map((t) =>
    round(t, 3),
  );

  writeFileSync(
    `${OUTPUT_DIR}${config.id}.ts`,
    `${HEADER}import type { CircuitPath } from '../types';\n\nexport const PATH: CircuitPath = {\n  points: ${JSON.stringify(points)},\n  speedsKmh: ${JSON.stringify(speedsKmh)},\n  times: ${JSON.stringify(times)},\n  racingOffsets: ${JSON.stringify(racingOffsets)},\n};\n`,
  );

  const meta = {
    id: config.id,
    name: config.name,
    code: config.code,
    country: config.country,
    lengthKm: config.lengthKm,
    lapTimeSeconds: round(lapTime, 3),
    sectorEnds: config.sectorEnds,
    sectorTimes,
    topSpeedKmh: Math.max(...speedsKmh),
    corners: config.corners,
  };

  console.log(
    `    trajetória: ${(racingLength / 1000).toFixed(3)} km (centro ${(length / 1000).toFixed(3)} km) · ganho ${(centerLap - lapTime).toFixed(2)} s sobre a linha central`,
  );
  console.log(
    `${config.code} ${config.name.padEnd(18)} ${String(points.length / 3).padStart(3)} pontos · volta ${formatLapTime(lapTime)} · setores ${sectorTimes.join(' / ')} s · ${Math.min(...speedsKmh)}–${meta.topSpeedKmh} km/h`,
  );
  return meta;
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const metas = CIRCUITS.map(buildCircuit);
  const ids = CIRCUITS.map((c) => c.id);

  writeFileSync(
    `${OUTPUT_DIR}meta.ts`,
    `${HEADER}import type { CircuitMeta } from '../types';\n\nexport const CIRCUIT_IDS = ${JSON.stringify(ids)} as const;\nexport type CircuitId = (typeof CIRCUIT_IDS)[number];\n\nexport const CIRCUIT_META: Record<CircuitId, CircuitMeta> = ${JSON.stringify(
      Object.fromEntries(metas.map((m) => [m.id, m])),
      null,
      2,
    )};\n`,
  );

  // Índice das geometrias: importado só pelo chunk do 3D
  const imports = ids.map((id, i) => `import { PATH as path${i} } from './${id}';`).join('\n');
  const entries = ids.map((id, i) => `  '${id}': path${i},`).join('\n');
  writeFileSync(
    `${OUTPUT_DIR}paths.ts`,
    `${HEADER}import type { CircuitPath } from '../types';\nimport type { CircuitId } from './meta';\n${imports}\n\nexport const CIRCUIT_PATHS: Record<CircuitId, CircuitPath> = {\n${entries}\n};\n`,
  );
}

main();
