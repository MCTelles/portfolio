import { useMediaQuery } from './useMediaQuery';

/** Largura a partir da qual há margem lateral de sobra para o conteúdo entrar deslizando. */
const WIDE_SCREEN = '(min-width: 900px)';
/** No celular o deslocamento vertical é mais curto: só sugere o movimento. */
const MOBILE_RISE = 24;

/**
 * Posição inicial das animações de entrada. Em telas largas o conteúdo entra deslizando de
 * lado (como um carro saindo do box). No celular ele sobe de baixo: deslocar na horizontal
 * um bloco que ocupa a tela toda corta o conteúdo na borda durante a animação, e um bloco
 * esperando fora da tela à direita faz o navegador alargar a página inteira.
 */
export function useRevealOffset(x: number) {
  const wide = useMediaQuery(WIDE_SCREEN);
  return wide ? { x, y: 0 } : { x: 0, y: MOBILE_RISE };
}
