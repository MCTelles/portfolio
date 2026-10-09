import { Environment, Lightformer } from '@react-three/drei';

/**
 * Luz de estúdio para a pintura do carro: faixas brancas refletidas (como num box de
 * fotografia) e um contraluz vermelho. O Environment é "pintado" com Lightformers
 * locais em vez de um preset HDR, que seria baixado de uma CDN em runtime.
 */
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} />
      <pointLight position={[-6, 3, -5]} intensity={40} distance={25} color="#ff2a1a" />

      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[10, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          position={[-6, 2, 2]}
          rotation-y={Math.PI / 2}
          scale={[8, 1, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          position={[6, 2, -2]}
          rotation-y={-Math.PI / 2}
          scale={[8, 1, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#ff2a1a"
          position={[0, 1, -8]}
          scale={[10, 2, 1]}
        />
      </Environment>
    </>
  );
}
