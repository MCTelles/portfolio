import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';

/** Curva fechada; `getPoint(u)` mantém a correspondência entre amostras, offsets e tempos. */
export function useTrackCurve(points: readonly number[]) {
  return useMemo(() => {
    const vectors: Vector3[] = [];
    for (let i = 0; i < points.length; i += 3) {
      vectors.push(new Vector3(points[i], points[i + 1], points[i + 2]));
    }
    return new CatmullRomCurve3(vectors, true, 'centripetal');
  }, [points]);
}
