import type { CircuitMeta } from './types';

export type SectorIndex = 0 | 1 | 2;

/** Relações de marcha aproximadas (8 marchas, ~330 km/h no limite da 8ª). */
const GEAR_TOP_SPEEDS_KMH = [95, 130, 165, 200, 235, 270, 305];

export const sectorAt = (meta: CircuitMeta, progress: number): SectorIndex => {
  const [end1, end2] = meta.sectorEnds;
  if (progress < end1) return 0;
  if (progress < end2) return 1;
  return 2;
};

export const cornerAt = (meta: CircuitMeta, progress: number): string | null =>
  meta.corners.find((corner) => progress >= corner.from && progress < corner.to)?.name ?? null;

export const gearFor = (speedKmh: number) =>
  1 + GEAR_TOP_SPEEDS_KMH.filter((limit) => speedKmh >= limit).length;

/** 104.821 → "1:44.821" */
export function formatLapTime(seconds: number, decimals = 3): string {
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds - minutes * 60).toFixed(decimals).padStart(decimals + 3, '0');
  return `${minutes}:${rest}`;
}

export interface LapPosition {
  /** Fração da volta percorrida, 0–1. */
  progress: number;
  speedKmh: number;
}

/**
 * Posição do carro num instante da volta, interpolando entre os pontos simulados.
 * `times[i]` é o tempo acumulado até o ponto i (espaçamento uniforme em distância);
 * o trecho entre o último ponto e a linha de chegada fecha o circuito em `lapTime`.
 */
export function positionAtTime(
  times: readonly number[],
  speeds: readonly number[],
  lapTime: number,
  elapsed: number,
): LapPosition {
  const n = times.length;
  const t = ((elapsed % lapTime) + lapTime) % lapTime;

  // Busca binária pelo último ponto com tempo <= t
  let low = 0;
  let high = n - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if ((times[mid] as number) <= t) low = mid;
    else high = mid - 1;
  }

  const startTime = times[low] as number;
  const endTime = low === n - 1 ? lapTime : (times[low + 1] as number);
  const alpha = endTime > startTime ? (t - startTime) / (endTime - startTime) : 0;

  const speedFrom = speeds[low] as number;
  const speedTo = speeds[(low + 1) % n] as number;

  return {
    progress: (low + alpha) / n,
    speedKmh: speedFrom + (speedTo - speedFrom) * alpha,
  };
}
