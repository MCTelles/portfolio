import { BufferAttribute, BufferGeometry, Vector3, type CatmullRomCurve3, type Curve } from 'three';

const UP = new Vector3(0, 1, 0);

/** Amostra a curva e devolve, por ponto, a posição e o vetor lateral (horizontal). */
function frames(curve: CatmullRomCurve3, segments: number, from = 0, to = 1) {
  const result: Array<{ point: Vector3; side: Vector3 }> = [];
  for (let i = 0; i <= segments; i++) {
    const u = (from + ((to - from) * i) / segments) % 1;
    const point = curve.getPoint(u);
    const tangent = curve.getTangent(u);
    const side = new Vector3().crossVectors(tangent, UP).normalize();
    result.push({ point, side });
  }
  return result;
}

/** Faixa plana (o asfalto) acompanhando a curva, com largura constante. */
export function ribbonGeometry(curve: CatmullRomCurve3, width: number, segments: number) {
  const positions: number[] = [];
  const indices: number[] = [];

  frames(curve, segments).forEach(({ point, side }, i) => {
    const offset = side.clone().multiplyScalar(width / 2);
    positions.push(...point.clone().add(offset).toArray(), ...point.clone().sub(offset).toArray());
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * "Cortina" vertical do traçado até o chão, com transparência em gradiente:
 * deixa o relevo (Eau Rouge, subida até Les Combes) legível de qualquer ângulo.
 */
export function curtainGeometry(curve: CatmullRomCurve3, floorY: number, segments: number) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  frames(curve, segments).forEach(({ point }, i) => {
    positions.push(point.x, point.y, point.z, point.x, floorY, point.z);
    colors.push(1, 1, 1, 0.22, 1, 1, 1, 0);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 4));
  geometry.setIndex(indices);
  return geometry;
}

/** Linhas brancas de limite de pista, uma de cada lado do asfalto. */
export function edgeLines(curve: CatmullRomCurve3, width: number, lift: number, segments: number) {
  const left: Vector3[] = [];
  const right: Vector3[] = [];
  frames(curve, segments).forEach(({ point, side }) => {
    const offset = side.clone().multiplyScalar(width / 2);
    left.push(
      point
        .clone()
        .add(offset)
        .setY(point.y + lift),
    );
    right.push(
      point
        .clone()
        .sub(offset)
        .setY(point.y + lift),
    );
  });
  return [left, right];
}

/**
 * Pontos de um trecho de qualquer curva (ex.: um setor da linha de corrida), levemente acima
 * do asfalto. Usa `getPoint` (parâmetro = progresso da volta), como o resto da cena.
 */
export function sectionPoints(
  curve: Curve<Vector3>,
  from: number,
  to: number,
  lift: number,
  segments = 160,
) {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const point = curve.getPoint((from + ((to - from) * i) / segments) % 1);
    return point.setY(point.y + lift);
  });
}
