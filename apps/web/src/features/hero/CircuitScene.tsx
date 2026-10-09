import { useFrame } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import { useMemo, useRef } from 'react';
import { MathUtils, type Group } from 'three';
import { CameraDirector } from './CameraDirector';
import { CAR_LENGTH, type CameraMode } from './camera';
import { CircuitTrack } from './CircuitTrack';
import { CornerLabelProjector } from './CornerLabelProjector';
import { RaceCar } from './RaceCar';
import { CIRCUIT_META, type CircuitId } from './track/circuits/meta';
import { CIRCUIT_PATHS } from './track/circuits/paths';
import { RacingLineCurve } from './track/racingLine';
import { useTrackCurve } from './track/useTrackCurve';
import { usePointer } from './usePointer';

/**
 * Os dados já vêm com o eixo longo do traçado na horizontal e a linha de chegada à
 * direita (ver build-track-data.ts); aqui só uma leve diagonal, como nos mapas de TV.
 */
const BASE_ROTATION_Y = -0.18;
const DAMPING = 3;

interface CircuitSceneProps {
  circuitId: CircuitId;
  scrollProgress: MotionValue<number>;
  animated: boolean;
  cameraMode: CameraMode;
  /** Rótulos de curva visíveis (desktop, câmera aérea); o desenho é feito em DOM pelo Hero. */
  showLabels: boolean;
}

export function CircuitScene({
  circuitId,
  scrollProgress,
  animated,
  cameraMode,
  showLabels,
}: CircuitSceneProps) {
  const group = useRef<Group>(null);
  const carRef = useRef<Group>(null);
  const carLengthRef = useRef(CAR_LENGTH[cameraMode]);
  const meta = CIRCUIT_META[circuitId];
  const path = CIRCUIT_PATHS[circuitId];
  const curve = useTrackCurve(path.points);
  const racingLine = useMemo(() => new RacingLineCurve(curve, path.racingOffsets), [curve, path]);
  const pointer = usePointer();
  const onboard = cameraMode === 'onboard';

  // Centraliza o relevo verticalmente (Spa sobe ~1,3 unidade; Yas Marina é quase plano)
  const elevationCenter = useMemo(() => {
    let max = 0;
    for (let i = 1; i < path.points.length; i += 3) max = Math.max(max, path.points[i] as number);
    return max / 2;
  }, [path]);

  // Aéreo: o mouse inclina o circuito e o scroll gira e afasta, como um drone saindo.
  // Onboard: o mundo fica parado e só a câmera se move (evita enjoo).
  useFrame((_, delta) => {
    const scene = group.current;
    if (!scene) return;

    const progress = onboard ? 0 : scrollProgress.get();
    const px = animated && !onboard ? pointer.current.x : 0;
    const py = animated && !onboard ? pointer.current.y : 0;

    scene.rotation.y = MathUtils.damp(
      scene.rotation.y,
      BASE_ROTATION_Y + px * 0.2 + progress * 0.9,
      DAMPING,
      delta,
    );
    scene.rotation.x = MathUtils.damp(
      scene.rotation.x,
      -py * 0.06 + progress * 0.25,
      DAMPING,
      delta,
    );
    scene.position.y = MathUtils.damp(scene.position.y, progress * 1.4, DAMPING, delta);
  });

  return (
    <>
      <group ref={group} rotation-y={BASE_ROTATION_Y}>
        {/* key: trocar de circuito remonta pista e carro, zerando a volta */}
        <group key={circuitId} position-y={-elevationCenter}>
          <CircuitTrack curve={curve} racingLine={racingLine} meta={meta} />
          <CornerLabelProjector curve={curve} meta={meta} enabled={showLabels} />
          <RaceCar
            curve={racingLine}
            meta={meta}
            path={path}
            animated={animated}
            mode={cameraMode}
            carRef={carRef}
            carLengthRef={carLengthRef}
          />
        </group>
      </group>
      <CameraDirector mode={cameraMode} carRef={carRef} carLengthRef={carLengthRef} />
    </>
  );
}
