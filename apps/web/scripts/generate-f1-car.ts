/**
 * Gera `public/models/f1-car.glb`: um carro de F1 estilizado (low-poly) montado com
 * geometrias do three.js, materiais PBR e compressão EXT_meshopt_compression.
 *
 * Convenção: metros, frente do carro em +Z, rodas nomeadas `Wheel_*` (giradas em runtime).
 *
 *   npm run model:generate
 *
 * Para usar um modelo próprio, substitua o .glb e comprima com:
 *   npm run model:optimize -- entrada.glb public/models/f1-car.glb
 */
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  Document,
  NodeIO,
  type Buffer as GltfBuffer,
  type Material,
  type Node,
} from '@gltf-transform/core';
import {
  ALL_EXTENSIONS,
  KHRMaterialsClearcoat,
  KHRMaterialsEmissiveStrength,
} from '@gltf-transform/extensions';
import { dedup, meshopt, prune, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from 'three';

const OUTPUT = fileURLToPath(new URL('../public/models/f1-car.glb', import.meta.url));

type Vec3 = [number, number, number];

const LIVERY = {
  paint: '#d40b0b',
  carbon: '#121318',
  tire: '#0c0c0d',
  tireStripe: '#f2c200', // composto médio da Pirelli
  rim: '#2a2d33',
  helmet: '#f2f2ee',
  halo: '#3a3d44',
  rainLight: '#ff2a1a',
} as const;

/** glTF trabalha com cor linear; o three.Color converte de sRGB automaticamente. */
function linear(hex: string): [number, number, number, number] {
  const { r, g, b } = new Color(hex);
  return [r, g, b, 1];
}

const toQuaternion = ([x, y, z]: Vec3): [number, number, number, number] => {
  const q = new Quaternion().setFromEuler(new Euler(x, y, z));
  return [q.x, q.y, q.z, q.w];
};

/* ---------- Geometrias auxiliares ---------- */

/** Vista de cima: meia-largura em função de z → sólido extrudado na altura, com bordas arredondadas. */
function planformSolid(
  halfWidths: Array<[z: number, halfWidth: number]>,
  height: number,
  bevel: number,
) {
  const shape = new Shape();
  halfWidths.forEach(([z, w], i) => (i === 0 ? shape.moveTo(w, z) : shape.lineTo(w, z)));
  [...halfWidths].reverse().forEach(([z, w]) => shape.lineTo(-w, z));

  const geometry = new ExtrudeGeometry(shape, {
    depth: height - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 4,
  });
  // Forma no plano XY (y = longitudinal) e extrusão em z → longitudinal em +z, altura em -y
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height - bevel, 0);
  return geometry;
}

/** Vista lateral: perfil (z, y) extrudado na largura, centralizado em x. */
function profileSolid(profile: Array<[z: number, y: number]>, width: number, bevel = 0.03) {
  const shape = new Shape();
  profile.forEach(([z, y], i) => (i === 0 ? shape.moveTo(z, y) : shape.lineTo(z, y)));

  const geometry = new ExtrudeGeometry(shape, {
    depth: width - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geometry.rotateY(-Math.PI / 2); // forma em (z, y), extrusão vira -x
  geometry.translate(width / 2 - bevel, 0, 0);
  return geometry;
}

/** Cilindro fino ligando dois pontos (braços de suspensão). */
function rod(from: Vec3, to: Vec3, radius: number) {
  const start = new Vector3(...from);
  const direction = new Vector3(...to).sub(start);
  const geometry = new CylinderGeometry(radius, radius, direction.length(), 6);
  geometry.applyQuaternion(
    new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()),
  );
  const middle = start.add(direction.multiplyScalar(0.5));
  geometry.translate(middle.x, middle.y, middle.z);
  return geometry;
}

const disc = (radius: number, width: number, segments = 32) =>
  new CylinderGeometry(radius, radius, width, segments).rotateZ(Math.PI / 2);

/* ---------- Montagem glTF ---------- */

class CarBuilder {
  readonly document = new Document();
  private readonly buffer: GltfBuffer = this.document.createBuffer();

  node(
    name: string,
    geometry: BufferGeometry,
    material: Material,
    position: Vec3 = [0, 0, 0],
    rotation?: Vec3,
  ) {
    const primitive = this.document.createPrimitive().setMaterial(material);

    for (const [source, target] of [
      ['position', 'POSITION'],
      ['normal', 'NORMAL'],
    ] as const) {
      const attribute = geometry.getAttribute(source);
      primitive.setAttribute(
        target,
        this.document
          .createAccessor()
          .setType('VEC3')
          .setArray(new Float32Array(attribute.array))
          .setBuffer(this.buffer),
      );
    }

    const index = geometry.getIndex();
    if (index) {
      primitive.setIndices(
        this.document
          .createAccessor()
          .setType('SCALAR')
          .setArray(new Uint32Array(index.array))
          .setBuffer(this.buffer),
      );
    }
    geometry.dispose();

    const node = this.document
      .createNode(name)
      .setMesh(this.document.createMesh(name).addPrimitive(primitive))
      .setTranslation(position);
    if (rotation) node.setRotation(toQuaternion(rotation));
    return node;
  }

  group(name: string, children: Node[], position: Vec3 = [0, 0, 0]) {
    const group = this.document.createNode(name).setTranslation(position);
    children.forEach((child) => group.addChild(child));
    return group;
  }
}

function createMaterials(document: Document) {
  const clearcoat = document.createExtension(KHRMaterialsClearcoat);
  const emissive = document.createExtension(KHRMaterialsEmissiveStrength);

  const pbr = (name: string, hex: string, metallic: number, roughness: number) =>
    document
      .createMaterial(name)
      .setBaseColorFactor(linear(hex))
      .setMetallicFactor(metallic)
      .setRoughnessFactor(roughness);

  const withClearcoat = (material: Material, factor: number) =>
    material.setExtension(
      'KHR_materials_clearcoat',
      clearcoat.createClearcoat().setClearcoatFactor(factor).setClearcoatRoughnessFactor(0.08),
    );

  const [r, g, b] = linear(LIVERY.rainLight);

  return {
    paint: withClearcoat(pbr('Paint', LIVERY.paint, 0.35, 0.28), 1),
    carbon: withClearcoat(pbr('Carbon', LIVERY.carbon, 0.25, 0.45), 0.4),
    tire: pbr('Tire', LIVERY.tire, 0, 0.92),
    stripe: pbr('TireStripe', LIVERY.tireStripe, 0, 0.55),
    rim: pbr('Rim', LIVERY.rim, 0.85, 0.35),
    helmet: withClearcoat(pbr('Helmet', LIVERY.helmet, 0.1, 0.3), 1),
    halo: pbr('Halo', LIVERY.halo, 0.9, 0.3),
    rainLight: document
      .createMaterial('RainLight')
      .setBaseColorFactor([0, 0, 0, 1])
      .setEmissiveFactor([r, g, b])
      .setExtension(
        'KHR_materials_emissive_strength',
        emissive.createEmissiveStrength().setEmissiveStrength(6),
      ),
  };
}

type Materials = ReturnType<typeof createMaterials>;

function buildBody(car: CarBuilder, m: Materials) {
  // Bico baixo e afilado, subindo até o monocoque
  const nose = planformSolid(
    [
      [2.75, 0.07],
      [2.2, 0.12],
      [1.5, 0.19],
      [0.95, 0.26],
    ],
    0.2,
    0.05,
  );
  nose.rotateX(-0.05);

  const monocoque = planformSolid(
    [
      [1.05, 0.26],
      [0.6, 0.36],
      [0, 0.42],
      [-0.9, 0.4],
    ],
    0.5,
    0.08,
  );

  const sidepods = planformSolid(
    [
      [0.05, 0.42],
      [-0.15, 0.74],
      [-0.6, 0.78],
      [-1.25, 0.66],
      [-1.75, 0.36],
      [-2.05, 0.2],
    ],
    0.36,
    0.09,
  );

  // Capô do motor: sobe do cockpit até o airbox e desce até a traseira
  const engineCover = profileSolid(
    [
      [0.1, 0.12],
      [0.1, 0.6],
      [-0.2, 0.98],
      [-0.55, 1.0],
      [-1.4, 0.7],
      [-2.3, 0.42],
      [-2.3, 0.12],
    ],
    0.42,
    0.05,
  );

  // Barbatana sobre o capô
  const sharkFin = profileSolid(
    [
      [-0.6, 0.95],
      [-2.1, 0.88],
      [-2.2, 0.55],
      [-1.4, 0.6],
    ],
    0.03,
    0.01,
  );

  return [
    car.node('Nose', nose, m.paint, [0, 0.16, 0]),
    car.node('Monocoque', monocoque, m.paint, [0, 0.12, 0]),
    car.node('Sidepods', sidepods, m.paint, [0, 0.12, 0]),
    car.node('EngineCover', engineCover, m.paint),
    car.node('SharkFin', sharkFin, m.carbon),
    car.node('Floor', new BoxGeometry(1.5, 0.03, 3.9), m.carbon, [0, 0.07, -0.15]),
    car.node(
      'Diffuser',
      new BoxGeometry(1.1, 0.03, 0.45),
      m.carbon,
      [0, 0.14, -2.2],
      [-0.35, 0, 0],
    ),
    car.node('RainLight', new BoxGeometry(0.14, 0.06, 0.03), m.rainLight, [0, 0.36, -2.36]),
    car.node('Helmet', new SphereGeometry(0.16, 24, 16), m.helmet, [0, 0.74, -0.08]),
  ];
}

function buildHalo(car: CarBuilder, m: Materials) {
  const ring = new TorusGeometry(0.36, 0.032, 8, 28, Math.PI).rotateX(Math.PI / 2);
  return [
    car.node('Halo', ring, m.halo, [0, 0.88, -0.05]),
    car.node('HaloPillar', rod([0, 0.88, 0.31], [0, 0.62, 0.62], 0.03), m.halo),
  ];
}

function buildWings(car: CarBuilder, m: Materials) {
  const endplate = (x: number, z: number, height: number, depth: number, y: number) =>
    car.node('Endplate', new BoxGeometry(0.025, height, depth), m.paint, [x, y, z]);

  return [
    // Asa dianteira: plano principal em carbono, flaps na cor do carro
    car.node('FrontWing', new BoxGeometry(1.9, 0.025, 0.34), m.carbon, [0, 0.09, 2.55]),
    car.node('FrontFlap', new BoxGeometry(1.75, 0.02, 0.2), m.paint, [0, 0.17, 2.42], [-0.3, 0, 0]),
    endplate(0.95, 2.5, 0.2, 0.46, 0.15),
    endplate(-0.95, 2.5, 0.2, 0.46, 0.15),
    car.node('NosePylon', new BoxGeometry(0.05, 0.12, 0.2), m.carbon, [0, 0.18, 2.35]),

    // Asa traseira com beam wing e pilone central
    car.node('RearWing', new BoxGeometry(1.0, 0.03, 0.32), m.carbon, [0, 0.88, -2.38]),
    car.node('RearFlap', new BoxGeometry(1.0, 0.025, 0.2), m.paint, [0, 0.99, -2.46], [0.35, 0, 0]),
    car.node('BeamWing', new BoxGeometry(0.9, 0.025, 0.15), m.carbon, [0, 0.42, -2.32]),
    car.node('RearPylon', new BoxGeometry(0.04, 0.42, 0.12), m.carbon, [0, 0.64, -2.28]),
    endplate(0.51, -2.38, 0.58, 0.64, 0.72),
    endplate(-0.51, -2.38, 0.58, 0.64, 0.72),
  ];
}

/** Pneu + faixa do composto + aro; agrupados num nó que gira no eixo x. */
function buildWheel(car: CarBuilder, m: Materials, name: string, position: Vec3, width: number) {
  const radius = 0.36;
  return car.group(
    name,
    [
      car.node(`${name}_Tire`, disc(radius, width), m.tire),
      car.node(`${name}_Stripe`, disc(0.3, width + 0.006), m.stripe),
      car.node(`${name}_Rim`, disc(0.23, width + 0.012), m.rim),
    ],
    position,
  );
}

function buildRunningGear(car: CarBuilder, m: Materials) {
  const axles = [
    { name: 'Wheel_FL', position: [0.8, 0.36, 1.75] as Vec3, width: 0.36 },
    { name: 'Wheel_FR', position: [-0.8, 0.36, 1.75] as Vec3, width: 0.36 },
    { name: 'Wheel_RL', position: [0.78, 0.36, -1.6] as Vec3, width: 0.44 },
    { name: 'Wheel_RR', position: [-0.78, 0.36, -1.6] as Vec3, width: 0.44 },
  ];

  const wheels = axles.map(({ name, position, width }) =>
    buildWheel(car, m, name, position, width),
  );

  // Dois braços (superior e inferior) por roda, do chassi até o cubo
  const arms = axles.flatMap(({ position: [x, y, z] }) => {
    const side = Math.sign(x);
    const hub: Vec3 = [x - side * 0.2, y, z];
    return [
      car.node(
        'ArmUpper',
        rod([side * 0.25, 0.42, z + 0.15], [hub[0], hub[1] + 0.08, hub[2]], 0.016),
        m.carbon,
      ),
      car.node(
        'ArmLower',
        rod([side * 0.25, 0.2, z - 0.15], [hub[0], hub[1] - 0.08, hub[2]], 0.016),
        m.carbon,
      ),
    ];
  });

  return [...wheels, ...arms];
}

async function main() {
  await MeshoptEncoder.ready;

  const car = new CarBuilder();
  const materials = createMaterials(car.document);

  const root = car.group('F1Car', [
    ...buildBody(car, materials),
    ...buildHalo(car, materials),
    ...buildWings(car, materials),
    ...buildRunningGear(car, materials),
  ]);
  car.document.createScene('Scene').addChild(root);

  await car.document.transform(
    weld(),
    dedup(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  await io.write(OUTPUT, car.document);

  console.log(`f1-car.glb gerado: ${(statSync(OUTPUT).size / 1024).toFixed(1)} KB -> ${OUTPUT}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
