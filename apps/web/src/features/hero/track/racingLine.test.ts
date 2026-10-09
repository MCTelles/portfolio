import { CatmullRomCurve3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { CIRCUIT_IDS, CIRCUIT_META } from './circuits/meta';
import { CIRCUIT_PATHS } from './circuits/paths';
import { TRACK_WIDTH } from './dimensions';
import { positionAtTime } from './lap';
import { RacingLineCurve } from './racingLine';

describe.each(CIRCUIT_IDS)('linha de corrida: %s', (id) => {
  const path = CIRCUIT_PATHS[id];
  const meta = CIRCUIT_META[id];
  const points: Vector3[] = [];
  for (let i = 0; i < path.points.length; i += 3) {
    points.push(new Vector3(path.points[i], path.points[i + 1], path.points[i + 2]));
  }
  const center = new CatmullRomCurve3(points, true, 'centripetal');
  const racing = new RacingLineCurve(center, path.racingOffsets);

  it('usa os dois lados da pista, com folga para as rodas e respeitando o relevo', () => {
    expect(Math.min(...path.racingOffsets)).toBeLessThan(-0.9);
    expect(Math.max(...path.racingOffsets)).toBeGreaterThan(0.9);
    let maxDisplacement = 0;
    for (let i = 0; i < 2000; i++) {
      const t = i / 2000;
      const surface = center.getPoint(t);
      const car = racing.getPoint(t);
      maxDisplacement = Math.max(maxDisplacement, car.distanceTo(surface));
      expect(car.y).toBeCloseTo(surface.y, 8);
      expect(car.distanceTo(surface)).toBeLessThan(TRACK_WIDTH / 2 - 0.015);
      expect(racing.getTangent(t).dot(center.getTangent(t))).toBeGreaterThan(0);
    }
    expect(maxDisplacement).toBeGreaterThan(TRACK_WIDTH / 4);
  });

  it('fecha a volta sem salto de posição ou direção', () => {
    expect(racing.getPoint(0).distanceTo(racing.getPoint(1))).toBeLessThan(1e-8);
    expect(racing.getPoint(-1e-6).distanceTo(racing.getPoint(1e-6))).toBeLessThan(0.001);
    expect(racing.getTangent(-1e-6).angleTo(racing.getTangent(1e-6))).toBeLessThan(0.01);
  });

  it('vira progressivamente, inclusive ao cruzar amostras e a linha de chegada', () => {
    let previous = racing.getTangent(0);
    for (let t = 0.02; t <= meta.lapTimeSeconds + 0.02; t += 0.02) {
      const { progress } = positionAtTime(path.times, path.speedsKmh, meta.lapTimeSeconds, t);
      const direction = racing.getTangent(progress);
      expect(direction.angleTo(previous)).toBeLessThan((5 * Math.PI) / 180);
      previous = direction;
    }
  });
});
