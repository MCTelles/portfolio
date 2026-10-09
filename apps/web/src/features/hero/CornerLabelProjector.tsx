import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3, type CatmullRomCurve3, type Group } from 'three';
import { cornerLabelScreen } from './cornerLabelScreen';
import type { CircuitMeta } from './track/types';

const LABEL_HEIGHT = 0.28;

interface CornerLabelProjectorProps {
  curve: CatmullRomCurve3;
  meta: CircuitMeta;
  enabled: boolean;
}

/** Projeta as curvas rotuladas para coordenadas de tela; quem desenha é o CornerLabelsOverlay. */
export function CornerLabelProjector({ curve, meta, enabled }: CornerLabelProjectorProps) {
  const anchor = useRef<Group>(null);
  const projected = useMemo(() => new Vector3(), []);
  const points = useMemo(
    () =>
      meta.corners
        .filter((corner) => corner.labeled)
        .map((corner) => {
          const point = curve.getPoint((corner.from + corner.to) / 2);
          point.y += LABEL_HEIGHT;
          return point;
        }),
    [curve, meta],
  );

  useFrame(({ camera, size }) => {
    const group = anchor.current;
    if (!group) return;

    cornerLabelScreen.circuitId = meta.id;
    cornerLabelScreen.visible = enabled;
    if (!enabled) return;

    points.forEach((point, i) => {
      // Posição local do circuito → mundo (inclui parallax/scroll) → tela
      projected.copy(point).applyMatrix4(group.matrixWorld).project(camera);
      cornerLabelScreen.x[i] = ((projected.x + 1) / 2) * size.width;
      cornerLabelScreen.y[i] = ((1 - projected.y) / 2) * size.height;
      cornerLabelScreen.inFront[i] = projected.z < 1;
    });
  });

  return <group ref={anchor} />;
}
