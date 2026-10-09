import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { localModelSize } from './modelSize';

const carLike = () => {
  const root = new Group();
  const body = new Mesh(new BoxGeometry(2, 1, 5.5), new MeshBasicMaterial());
  body.position.set(0, 0.5, 0.1);
  root.add(body);
  return root;
};

describe('localModelSize', () => {
  it('mede o tamanho real do modelo', () => {
    expect(localModelSize(carLike()).z).toBeCloseTo(5.5);
  });

  it('dá o mesmo resultado com a raiz já escalada (remontagem com o scene em cache)', () => {
    const root = carLike();
    root.scale.setScalar(0.1);
    expect(localModelSize(root).z).toBeCloseTo(5.5);
  });

  it('ignora a escala e a posição de qualquer pai', () => {
    const root = carLike();
    const parent = new Group();
    parent.scale.setScalar(7);
    parent.position.set(3, 2, 1);
    parent.add(root);
    expect(localModelSize(root).z).toBeCloseTo(5.5);
  });
});
