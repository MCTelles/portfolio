/**
 * Posição de tela (px dentro do canvas) de cada rótulo de curva, escrita pelo 3D a cada
 * frame e lida pelo overlay em DOM. Mesmo padrão da telemetria: objeto mutável, sem
 * re-render do React. Substitui o <Html> do drei, que cria uma raiz React por rótulo e
 * quebrava (removeChild) ao desmontar vários de uma vez na troca de circuito.
 */
export const cornerLabelScreen = {
  /** Circuito cujas posições estão no buffer (evita mostrar posições do anterior). */
  circuitId: '',
  visible: false,
  x: [] as number[],
  y: [] as number[],
  /** Falso quando o ponto está atrás da câmera. */
  inFront: [] as boolean[],
};
