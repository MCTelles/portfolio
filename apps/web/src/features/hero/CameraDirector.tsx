import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { Vector3, type Group } from 'three';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { aerialCameraFor, type CameraMode } from './camera';

const UP = new Vector3(0, 1, 0);
const ORIGIN = new Vector3();

/** Câmera de perseguição, em múltiplos do comprimento do carro. */
const CHASE_BEHIND = 3.4;
const CHASE_HEIGHT = 1.1;
const CHASE_LOOK_AHEAD = 3;

/** Ângulo polar permitido no modo aéreo (a partir do topo). */
const MIN_POLAR = 0.35;
const MAX_POLAR = 1.2;

const smoothing = (lambda: number, delta: number) => 1 - Math.exp(-lambda * delta);

interface CameraDirectorProps {
  mode: CameraMode;
  carRef: RefObject<Group | null>;
  /** Comprimento atual (animado) do carro, escrito pelo RaceCar. */
  carLengthRef: RefObject<number>;
}

/**
 * Dono da câmera. No modo aéreo entrega o controle ao OrbitControls; no onboard segue o
 * carro por trás. As transições são interpoladas, e o OrbitControls só volta quando a
 * câmera já chegou à posição aérea (senão os dois disputariam a câmera).
 */
export function CameraDirector({ mode, carRef, carLengthRef }: CameraDirectorProps) {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const aerialPosition = useMemo(() => aerialCameraFor(aspect), [aspect]);
  const framedAspect = useRef<number | null>(null);
  const isTouch = useMediaQuery('(pointer: coarse)');
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const orbitActive = useRef(true);
  const lookAt = useRef(new Vector3());
  const scratch = useRef({
    car: new Vector3(),
    forward: new Vector3(),
    desired: new Vector3(),
    target: new Vector3(),
  });

  const setOrbit = (enabled: boolean) => {
    if (orbitActive.current === enabled) return;
    orbitActive.current = enabled;
    setOrbitEnabled(enabled);
  };

  useFrame((_, delta) => {
    if (mode === 'onboard') {
      setOrbit(false);
      const car = carRef.current;
      if (!car) return;

      const { car: position, forward, desired, target } = scratch.current;
      const length = carLengthRef.current;
      car.getWorldPosition(position);
      car.getWorldDirection(forward); // +Z do modelo = frente do carro

      desired
        .copy(position)
        .addScaledVector(forward, -length * CHASE_BEHIND)
        .addScaledVector(UP, length * CHASE_HEIGHT);
      target
        .copy(position)
        .addScaledVector(forward, length * CHASE_LOOK_AHEAD)
        .addScaledVector(UP, length * 0.3);

      camera.position.lerp(desired, smoothing(8, delta));
      lookAt.current.lerp(target, smoothing(10, delta));
      camera.lookAt(lookAt.current);
      return;
    }

    if (!orbitActive.current) {
      camera.position.lerp(aerialPosition, smoothing(3, delta));
      lookAt.current.lerp(ORIGIN, smoothing(3, delta));
      camera.lookAt(lookAt.current);
      if (camera.position.distanceTo(aerialPosition) < 0.05) {
        framedAspect.current = aspect;
        setOrbit(true);
      }
      return;
    }

    // Canvas mudou de proporção (carregou, girou o celular, redimensionou): reenquadra
    if (framedAspect.current !== aspect) {
      framedAspect.current = aspect;
      camera.position.copy(aerialPosition);
      camera.lookAt(ORIGIN);
    }
  });

  // Em touch o OrbitControls captura o gesto e trava o scroll da página.
  if (!orbitEnabled || isTouch) return null;

  return (
    <OrbitControls
      makeDefault
      enableZoom={false}
      enablePan={false}
      enableDamping
      rotateSpeed={0.5}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
    />
  );
}
