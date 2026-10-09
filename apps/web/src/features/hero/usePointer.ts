import { useEffect, useRef } from 'react';

export interface PointerPosition {
  x: number;
  y: number;
}

/**
 * Posição do mouse normalizada para -1..1 em relação à janela inteira (não só ao canvas),
 * para o parallax reagir mesmo com o cursor sobre o texto do Hero.
 * Guardada em ref: é lida a cada frame no useFrame, sem provocar re-render.
 */
export function usePointer() {
  const pointer = useRef<PointerPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return pointer;
}
