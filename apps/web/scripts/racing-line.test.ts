import { fileURLToPath } from 'node:url';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { CIRCUITS } from './circuits.config';
import { racingLineOffsets, segmentLengths } from './racing-line';
import { loadCenterline } from './track-geometry';

describe('amostragem do traçado', () => {
  it.each(CIRCUITS)(
    '$id mantém intervalos de cerca de 5 m, inclusive nas curvas fechadas',
    (config) => {
      const source = fileURLToPath(new URL(`./data/${config.source}`, import.meta.url));
      const { samples } = loadCenterline(source, 3);
      const lengths = segmentLengths(samples);
      expect(samples.length % 3).toBe(0);
      expect(Math.min(...lengths)).toBeGreaterThan(4.5);
      expect(Math.max(...lengths)).toBeLessThan(5.5);
    },
  );
});

it('abre a entrada de um grampo, busca o ápice e abre a saída', () => {
  const radius = 40;
  const straight = 200;
  const length = 2 * straight + 2 * Math.PI * radius;
  const count = 384;
  // Duas retas ligadas por grampos de 180°, sem ruído ou nomes de curvas predefinidos.
  const center = Array.from({ length: count }, (_, i) => {
    let s = (i * length) / count;
    if (s < straight) return new Vector3(-100 + s, 0, -radius);
    s -= straight;
    if (s < Math.PI * radius) {
      return new Vector3(100 + radius * Math.sin(s / radius), 0, -radius * Math.cos(s / radius));
    }
    s -= Math.PI * radius;
    if (s < straight) return new Vector3(100 - s, 0, radius);
    s -= straight;
    return new Vector3(-100 - radius * Math.sin(s / radius), 0, radius * Math.cos(s / radius));
  });
  const { offsets, limit } = racingLineOffsets(center, 12);
  const atDistance = (distance: number) => offsets[Math.round((distance / length) * count)]!;
  expect(atDistance(straight - 20)).toBeLessThan(-limit / 2);
  expect(atDistance(straight + (Math.PI * radius) / 2)).toBeGreaterThan(limit / 2);
  expect(atDistance(straight + Math.PI * radius + 20)).toBeLessThan(-limit / 2);
  expect(Math.max(...offsets.map(Math.abs))).toBeLessThanOrEqual(limit);
});
