import { describe, expect, it } from 'vitest';
import { CIRCUIT_IDS, CIRCUIT_META } from './circuits/meta';
import { CIRCUIT_PATHS } from './circuits/paths';
import { cornerAt, formatLapTime, gearFor, positionAtTime, sectorAt } from './lap';

/** Pole positions recentes (aprox.), para checar se a simulação é plausível. */
const REFERENCE_LAP_SECONDS = {
  spa: 103,
  interlagos: 70,
  monaco: 70.3,
  'yas-marina': 82.6,
} satisfies Record<(typeof CIRCUIT_IDS)[number], number>;

describe.each(CIRCUIT_IDS)('circuito %s', (id) => {
  const meta = CIRCUIT_META[id];
  const path = CIRCUIT_PATHS[id];
  const at = (seconds: number) =>
    positionAtTime(path.times, path.speedsKmh, meta.lapTimeSeconds, seconds);

  it('tem volta a até 8% de uma pole real e velocidades de F1', () => {
    const reference = REFERENCE_LAP_SECONDS[id];
    expect(Math.abs(meta.lapTimeSeconds - reference) / reference).toBeLessThan(0.08);
    expect(Math.min(...path.speedsKmh)).toBeGreaterThan(45);
    expect(Math.max(...path.speedsKmh)).toBeLessThan(345);
  });

  it('tem dados consistentes: setores somam a volta, curvas em ordem e dentro da volta', () => {
    expect(meta.sectorTimes.reduce((sum, t) => sum + t, 0)).toBeCloseTo(meta.lapTimeSeconds, 2);
    expect(path.points.length).toBe(path.times.length * 3);
    meta.corners.forEach((corner, i) => {
      expect(corner.from).toBeLessThan(corner.to);
      expect(corner.to).toBeLessThanOrEqual(1);
      if (i > 0) expect(corner.from).toBeGreaterThanOrEqual(meta.corners[i - 1]!.from);
    });
  });

  it('percorre a volta em ordem e recomeça na linha', () => {
    expect(at(0).progress).toBe(0);
    const samples = [0.1, 0.3, 0.6, 0.9].map((f) => at(f * meta.lapTimeSeconds).progress);
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
    expect(at(meta.lapTimeSeconds).progress).toBeCloseTo(0, 5);
  });
});

describe('telemetria derivada', () => {
  const spa = CIRCUIT_META.spa;
  const monaco = CIRCUIT_META.monaco;

  it('identifica setores e curvas pela fração da volta', () => {
    expect(sectorAt(spa, 0.1)).toBe(0);
    expect(sectorAt(spa, 0.5)).toBe(1);
    expect(sectorAt(spa, 0.9)).toBe(2);
    expect(cornerAt(spa, 0.13)).toBe('Eau Rouge');
    expect(cornerAt(monaco, 0.42)).toBe('Grand Hotel Hairpin');
    expect(cornerAt(spa, 0.08)).toBeNull();
  });

  it('escolhe marchas coerentes com a velocidade', () => {
    expect(gearFor(70)).toBe(1);
    expect(gearFor(180)).toBe(4);
    expect(gearFor(330)).toBe(8);
  });

  it('formata tempos como na cronometragem', () => {
    expect(formatLapTime(104.821)).toBe('1:44.821');
    expect(formatLapTime(65.5, 1)).toBe('1:05.5');
    expect(formatLapTime(9.05)).toBe('0:09.050');
  });
});
