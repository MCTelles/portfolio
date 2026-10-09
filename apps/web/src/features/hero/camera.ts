import { Vector3 } from 'three';

export type CameraMode = 'aerial' | 'onboard';

/** Posição inicial da câmera aérea (o HeroCanvas abre aqui e o modo aéreo volta para cá). */
export const AERIAL_CAMERA_POSITION: [number, number, number] = [0, 12.5, 11];
const AERIAL_CAMERA = new Vector3(...AERIAL_CAMERA_POSITION);

/** Largura (em unidades da cena) que precisa caber na tela: o traçado + margem para os rótulos. */
const FRAMED_WIDTH = 10;
const VERTICAL_FOV = 36;

/**
 * Posição aérea ajustada à proporção do canvas: em telas estreitas (celular) a câmera
 * recua até a volta inteira caber na largura. Nunca chega mais perto que o padrão.
 */
export function aerialCameraFor(aspect: number): Vector3 {
  const halfFov = ((VERTICAL_FOV / 2) * Math.PI) / 180;
  const requiredDistance = FRAMED_WIDTH / (2 * Math.tan(halfFov) * aspect);
  const factor = Math.max(1, requiredDistance / AERIAL_CAMERA.length());
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
