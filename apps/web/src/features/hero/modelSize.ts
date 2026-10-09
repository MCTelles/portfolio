import { Box3, Matrix4, Vector3, type Mesh, type Object3D } from 'three';

/**
 * Tamanho do modelo no espaço local da própria raiz: ignora a escala da raiz e de
 * qualquer pai. Importante porque o `scene` do useGLTF é um objeto compartilhado e em
 * cache: medir com Box3.setFromObject (espaço do mundo) incluiria a escala aplicada por
 * uma montagem anterior e o tamanho calculado mudaria a cada remontagem.
 */
export function localModelSize(root: Object3D): Vector3 {
  root.updateWorldMatrix(true, true);
  const toRoot = root.matrixWorld.clone().invert();
  const relative = new Matrix4();
  const box = new Box3();
  const part = new Box3();

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    relative.multiplyMatrices(toRoot, mesh.matrixWorld);
    box.union(part.copy(mesh.geometry.boundingBox!).applyMatrix4(relative));
  });

  return box.getSize(new Vector3());
}
