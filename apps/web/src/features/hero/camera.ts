import { Vector3 } from 'three';

export type CameraMode = 'aerial' | 'onboard';

/** Posição inicial da câmera aérea (o HeroCanvas abre aqui e o modo aéreo volta para cá). */
export const AERIAL_CAMERA_POSITION: [number, number, number] = [0, 12.5, 11];
const AERIAL_CAMERA = new Vector3(...AERIAL_CAMERA_POSITION);

/** Largura (em unidades da cena) que precisa caber na tela: o traçado + margem para os rótulos. */
const FRAMED_WIDTH = 10;
/** No celular não há rótulos de curva: basta o traçado (9 unidades) com uma folga mínima. */
const COMPACT_FRAMED_WIDTH = 9.4;
/** Quanto a câmera pode se aproximar do padrão no celular, onde o canvas é um bloco baixo. */
const COMPACT_MIN_FACTOR = 0.72;
const VERTICAL_FOV = 36;

/**
 * Posição aérea ajustada à proporção do canvas: a câmera recua até a volta inteira caber
 * na largura. No desktop nunca chega mais perto que o padrão; no celular (`compact`) pode
 * se aproximar, para o circuito ocupar o bloco em vez de ficar pequeno no meio dele.
 */
export function aerialCameraFor(aspect: number, compact = false): Vector3 {
  const halfFov = ((VERTICAL_FOV / 2) * Math.PI) / 180;
  const width = compact ? COMPACT_FRAMED_WIDTH : FRAMED_WIDTH;
  const requiredDistance = width / (2 * Math.tan(halfFov) * aspect);
  const factor = Math.max(
    compact ? COMPACT_MIN_FACTOR : 1,
    requiredDistance / AERIAL_CAMERA.length(),
  );
  return AERIAL_CAMERA.clone().multiplyScalar(factor);
}

export const AERIAL_FOV = VERTICAL_FOV;

/**
 * Comprimento do carro em unidades da cena por modo. No aéreo ele é exagerado (em escala
 * real seria um ponto, como nos mapas de TV); no onboard volta à proporção real da pista.
 */
export const CAR_LENGTH: Record<CameraMode, number> = {
  aerial: 0.55,
  onboard: 0.06,
};
