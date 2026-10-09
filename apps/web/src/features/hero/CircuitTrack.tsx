import { Grid, Line } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import {
  DataTexture,
  DoubleSide,
  Matrix4,
  NearestFilter,
  Vector3,
  type CatmullRomCurve3,
  type Curve,
} from 'three';
import { SECTOR_COLORS, TRACK_COLORS } from './track/colors';
import { TRACK_WIDTH } from './track/dimensions';
import { curtainGeometry, edgeLines, ribbonGeometry, sectionPoints } from './track/geometry';
import type { CircuitMeta } from './track/types';

const FLOOR_Y = -0.03;
const LINE_LIFT = 0.01;
const RIBBON_SEGMENTS = 1400;

/** Textura quadriculada 8x2 gerada em memória (sem arquivo de imagem). */
function checkerTexture() {
  const [columns, rows] = [8, 2];
  const data = new Uint8Array(columns * rows * 4);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const value = (x + y) % 2 === 0 ? 255 : 20;
      data.set([value, value, value, 255], (y * columns + x) * 4);
    }
  }
  const texture = new DataTexture(data, columns, rows);
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

function StartLine({ curve }: { curve: CatmullRomCurve3 }) {
  const texture = useMemo(() => checkerTexture(), []);
  const matrix = useMemo(() => {
    const point = curve.getPoint(0);
    const tangent = curve.getTangent(0);
    const up = new Vector3(0, 1, 0);
    const side = new Vector3().crossVectors(tangent, up).normalize();
    // Plano deitado: x ao longo da largura da pista, normal para cima
    return new Matrix4()
      .makeBasis(side, tangent.clone().negate(), up)
      .setPosition(point.x, point.y + LINE_LIFT * 1.5, point.z);
  }, [curve]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh matrix={matrix} matrixAutoUpdate={false}>
      <planeGeometry args={[TRACK_WIDTH * 1.3, TRACK_WIDTH * 0.32]} />
      <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

interface CircuitTrackProps {
  /** Linha central: asfalto, cortina de relevo e limites de pista. */
  curve: CatmullRomCurve3;
  /** Trajetória de corrida: as linhas coloridas de setor mostram o traçado ideal. */
  racingLine: Curve<Vector3>;
  meta: CircuitMeta;
}

export function CircuitTrack({ curve, racingLine, meta }: CircuitTrackProps) {
  const ribbon = useMemo(() => ribbonGeometry(curve, TRACK_WIDTH, RIBBON_SEGMENTS), [curve]);
  const curtain = useMemo(() => curtainGeometry(curve, FLOOR_Y, RIBBON_SEGMENTS / 2), [curve]);
  const limits = useMemo(
    () => edgeLines(curve, TRACK_WIDTH * 0.94, LINE_LIFT / 2, RIBBON_SEGMENTS),
    [curve],
  );
  const sectors = useMemo(() => {
    const [end1, end2] = meta.sectorEnds;
    return [
      [0, end1],
      [end1, end2],
      [end2, 1],
    ].map(([from, to]) => sectionPoints(racingLine, from as number, to as number, LINE_LIFT));
  }, [racingLine, meta]);

  useEffect(
    () => () => {
      ribbon.dispose();
      curtain.dispose();
    },
    [ribbon, curtain],
  );

  return (
    <>
      <mesh geometry={ribbon}>
        <meshStandardMaterial
          color={TRACK_COLORS.asphalt}
          roughness={0.85}
          metalness={0.1}
          side={DoubleSide}
        />
      </mesh>

      <mesh geometry={curtain}>
        <meshBasicMaterial
          color={TRACK_COLORS.curtain}
          vertexColors
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {limits.map((points, index) => (
        <Line
          key={`limit-${index}`}
          points={points}
          color={TRACK_COLORS.trackLimits}
          lineWidth={1}
          transparent
          opacity={0.55}
        />
      ))}

      {sectors.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={SECTOR_COLORS[index]}
          lineWidth={2.2}
          toneMapped={false}
        />
      ))}

      <StartLine curve={curve} />

      <Grid
        position={[0, FLOOR_Y - 0.01, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={TRACK_COLORS.grid}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={TRACK_COLORS.gridSection}
        fadeDistance={24}
        fadeStrength={1.6}
        infiniteGrid
      />
    </>
  );
}
