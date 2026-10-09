import { CatmullRomCurve3, Curve, Vector3 } from 'three';
import { RACING_LINE_HALF_WIDTH } from './dimensions';

const UP = new Vector3(0, 1, 0);
const wrap = (progress: number) => ((progress % 1) + 1) % 1;

/**
 * Linha de corrida sobre o asfalto. O parâmetro continua sendo o progresso na linha
 * central: reparametrizar por distância aqui dessincronizaria offsets, setores e tempos.
 */
export class RacingLineCurve extends Curve<Vector3> {
  private readonly line: CatmullRomCurve3;
  private readonly surface = new Vector3();
  private readonly before = new Vector3();
  private readonly after = new Vector3();

  constructor(
    private readonly center: CatmullRomCurve3,
    offsets: readonly number[],
  ) {
    super();
    if (
      offsets.length !== center.points.length ||
      offsets.some((offset) => !Number.isFinite(offset))
    ) {
      throw new Error('A linha de corrida precisa de um deslocamento válido por ponto da pista.');
    }

    const side = new Vector3();
    const points = offsets.map((offset, i) => {
      const progress = i / offsets.length;
      side.crossVectors(center.getTangent(progress), UP).normalize();
      return center
        .getPoint(progress)
        .addScaledVector(side, Math.max(-1, Math.min(1, offset)) * RACING_LINE_HALF_WIDTH);
    });
    // Interpolar as posições deixa a direção contínua também entre as amostras.
    this.line = new CatmullRomCurve3(points, true, 'centripetal');
  }

  override getPoint(progress: number, target = new Vector3()): Vector3 {
    const t = wrap(progress);
    this.line.getPoint(t, target);
    // A pista tem relevo exagerado: o carro deve ficar sobre a superfície original.
    target.y = this.center.getPoint(t, this.surface).y;
    return target;
  }

  override getTangent(progress: number, target = new Vector3()): Vector3 {
    const step = 1 / (this.center.points.length * 20);
    this.getPoint(progress - step, this.before);
    this.getPoint(progress + step, this.after);
    return target.subVectors(this.after, this.before).normalize();
  }
}
