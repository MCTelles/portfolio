import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion, type MotionValue } from 'motion/react';
import { Suspense, useState } from 'react';
import { AERIAL_CAMERA_POSITION, AERIAL_FOV, type CameraMode } from './camera';
import { CircuitScene } from './CircuitScene';
import { SceneLights } from './SceneLights';
import type { CircuitId } from './track/circuits/meta';

interface HeroCanvasProps {
  scrollProgress: MotionValue<number>;
  /** Falso quando o Hero sai da tela: o render loop para e libera a GPU. */
  active: boolean;
  cameraMode: CameraMode;
  circuitId: CircuitId;
  showLabels: boolean;
}

/**
 * Teto de resolução: em telas Retina, DPR 2 renderiza ~1,8x mais pixels que 1,5 e a
 * diferença não aparece numa cena de linhas e materiais lisos com antialias.
 */
const MAX_DPR = 1.5;

/** Export default: este módulo (e todo o three.js) é carregado via React.lazy. */
export default function HeroCanvas({
  scrollProgress,
  active,
  cameraMode,
  circuitId,
  showLabels,
}: HeroCanvasProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [dpr, setDpr] = useState(MAX_DPR);

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: AERIAL_CAMERA_POSITION, fov: AERIAL_FOV, near: 0.01, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      {/* Ajusta a resolução ao desempenho real do dispositivo */}
      <PerformanceMonitor
        onIncline={() => setDpr(MAX_DPR)}
        onDecline={() => setDpr(1)}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />

      <SceneLights />

      <Suspense fallback={null}>
        <CircuitScene
          circuitId={circuitId}
          showLabels={showLabels}
          scrollProgress={scrollProgress}
          animated={!reducedMotion}
          cameraMode={cameraMode}
        />
      </Suspense>
    </Canvas>
  );
}
