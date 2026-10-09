import { Ring, Trail, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import {
  DoubleSide,
  MathUtils,
  Matrix4,
  Vector3,
  type Curve,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type Object3D,
} from 'three';
import { CAR_LENGTH, type CameraMode } from './camera';
import { localModelSize } from './modelSize';
import { telemetry } from './telemetry';
import { TRACK_COLORS } from './track/colors';
import { cornerAt, gearFor, positionAtTime, sectorAt } from './track/lap';
import type { CircuitMeta, CircuitPath } from './track/types';

export const CAR_MODEL_URL = '/models/f1-car.glb';

// meshopt: decoder embutido no three-stdlib (o Draco buscaria o decoder numa CDN).
const USE_DRACO = false;
const USE_MESHOPT = true;

const RIDE_HEIGHT = 0.002;
const WHEEL_RADIUS_M = 0.36;
/** Giro real a 300 km/h vira um borrão estroboscópico; escala para ser legível. */
const WHEEL_SPIN_SCALE = 0.03;
/** Delta máximo por frame: evita o carro "teleportar" ao voltar de outra aba. */
const MAX_DELTA = 0.1;

interface RaceCarProps {
  curve: Curve<Vector3>;
  meta: CircuitMeta;
  path: CircuitPath;
  animated: boolean;
  mode: CameraMode;
  /** O CameraDirector segue este grupo no modo onboard. */
  carRef: RefObject<Group | null>;
  /** Comprimento atual do carro (animado entre os modos), compartilhado com a câmera. */
  carLengthRef: RefObject<number>;
}

export function RaceCar({ curve, meta, path, animated, mode, carRef, carLengthRef }: RaceCarProps) {
  const lapTime = meta.lapTimeSeconds;
  const marker = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const { scene } = useGLTF(CAR_MODEL_URL, USE_DRACO, USE_MESHOPT);

  // Comprimento intrínseco do modelo (independe de escalas aplicadas antes; ver modelSize.ts)
  const modelLength = useMemo(() => localModelSize(scene).z, [scene]);
  // A escala vai num grupo desta instância: o `scene` do cache nunca é alterado
  const scaleGroup = useRef<Group>(null);
  const wheels = useMemo(
    () =>
      ['FL', 'FR', 'RL', 'RR']
        .map((id) => scene.getObjectByName(`Wheel_${id}`))
        .filter((wheel): wheel is Object3D => wheel !== undefined),
    [scene],
  );

  // Objetos reaproveitados a cada frame (sem alocação no loop de render)
  const scratch = useMemo(
    () => ({
      point: new Vector3(),
      tangent: new Vector3(),
      ahead: new Vector3(),
      up: new Vector3(0, 1, 0),
      matrix: new Matrix4(),
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const body = carRef.current;
    if (!body) return;
    const step = Math.min(delta, MAX_DELTA);

    if (animated) elapsed.current += step;

    // O carro encolhe/cresce suavemente ao trocar de câmera
    carLengthRef.current = MathUtils.damp(carLengthRef.current, CAR_LENGTH[mode], 4, step);
    scaleGroup.current?.scale.setScalar(carLengthRef.current / modelLength);

    const { progress, speedKmh } = positionAtTime(
      path.times,
      path.speedsKmh,
      lapTime,
      elapsed.current,
    );
    const { point, tangent, ahead, up, matrix } = scratch;

    curve.getPoint(progress, point);
    curve.getTangent(progress, tangent);

    // Frente do modelo é +Z: "olhar" de (ponto + tangente) para o ponto alinha +Z com a tangente,
    // e a inclinação da tangente faz o carro subir o Raidillon de bico para cima.
    matrix.lookAt(ahead.copy(point).add(tangent), point, up);
    body.quaternion.setFromRotationMatrix(matrix);
    body.position.copy(point).addScaledVector(up, RIDE_HEIGHT);

    if (animated) {
      const spin = (speedKmh / 3.6 / WHEEL_RADIUS_M) * WHEEL_SPIN_SCALE * step;
      wheels.forEach((wheel) => (wheel.rotation.x += spin));
    }

    // Anel pulsando sob o carro, como o marcador de posição dos mapas de TV
    if (marker.current) {
      const pulse = (clock.elapsedTime * 0.8) % 1;
      const sizeFactor = carLengthRef.current / CAR_LENGTH.aerial;
      marker.current.visible = mode === 'aerial';
      marker.current.scale.setScalar((1 + pulse * 1.6) * sizeFactor);
      (marker.current.material as MeshBasicMaterial).opacity = animated ? 0.7 * (1 - pulse) : 0.5;
    }

    const sector = sectorAt(meta, progress);
    const lap = Math.floor(elapsed.current / lapTime) + 1;
    Object.assign(telemetry, {
      live: true,
      lap,
      lapTime: elapsed.current % lapTime,
      progress,
      speedKmh,
      gear: gearFor(speedKmh),
      sector,
      corner: cornerAt(meta, progress),
      sectorTimes: meta.sectorTimes.slice(0, sector),
      lastLapTime: lap > 1 ? lapTime : null,
    });
  });

  return (
    <group ref={carRef}>
      <group ref={scaleGroup}>
        <primitive object={scene} />
      </group>
      <Ring
        ref={marker}
        args={[CAR_LENGTH.aerial * 0.42, CAR_LENGTH.aerial * 0.5, 48]}
        rotation-x={-Math.PI / 2}
        position-y={0.006}
      >
        <meshBasicMaterial
          color={TRACK_COLORS.trail}
          transparent
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </Ring>
      {animated && mode === 'aerial' && (
        <Trail
          width={0.9}
          length={5}
          color={TRACK_COLORS.trail}
          attenuation={(width) => width * width}
        >
          <mesh position={[0, 0.02, -CAR_LENGTH.aerial * 0.45]} visible={false}>
            <boxGeometry args={[0.001, 0.001, 0.001]} />
          </mesh>
        </Trail>
      )}
    </group>
  );
}

useGLTF.preload(CAR_MODEL_URL, USE_DRACO, USE_MESHOPT);
