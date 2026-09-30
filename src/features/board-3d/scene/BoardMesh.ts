import * as THREE from 'three';

export function sqToPos(sq: string): THREE.Vector3 {
  const file = sq.charCodeAt(0) - 97; // a-h -> 0-7
  const rank = parseInt(sq[1], 10) - 1; // 1-8 -> 0-7
  return new THREE.Vector3(file - 3.5, 0, 3.5 - rank);
}

export function posToSq(x: number, z: number): string | null {
  const f = Math.round(x + 3.5);
  const r = Math.round(3.5 - z);
  if (f < 0 || f > 7 || r < 0 || r > 7) return null;
  return String.fromCharCode(97 + f) + (r + 1);
}

function drawStar(g: CanvasRenderingContext2D, x: number, y: number, R: number, r: number, color: string, blur = 16) {
  g.save();
  g.translate(x, y);
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rad = i % 2 ? r : R;
    g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  g.closePath();
  g.shadowColor = color;
  g.shadowBlur = blur;
  g.fillStyle = color;
  g.fill();
  g.restore();
}

function createTileTextures(dark: boolean): { map: THREE.CanvasTexture; emi: THREE.CanvasTexture } {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;

  const grd = g.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size * 0.75);
  if (dark) {
    grd.addColorStop(0, '#30223f');
    grd.addColorStop(0.5, '#181326');
    grd.addColorStop(1, '#090b18');
  } else {
    grd.addColorStop(0, '#f5efdf');
    grd.addColorStop(0.6, '#e1d8c6');
    grd.addColorStop(1, '#b8afab');
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);

  g.strokeStyle = dark ? 'rgba(200,180,225,.12)' : 'rgba(255,255,255,.28)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(size, size);
  g.moveTo(size, 0);
  g.lineTo(0, size);
  g.stroke();

  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * (dark ? 0.7 : 0.4)})`;
    g.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }
  drawStar(g, size / 2, size / 2, 13, 1.8, '#dfc796', 5);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;

  const cEmi = document.createElement('canvas');
  cEmi.width = cEmi.height = size;
  const gEmi = cEmi.getContext('2d')!;
  gEmi.fillStyle = '#000';
  gEmi.fillRect(0, 0, size, size);
  drawStar(gEmi, size / 2, size / 2, 13, 1.8, '#ffe7c3', 5);

  const emi = new THREE.CanvasTexture(cEmi);

  return { map, emi };
}

export function createBoardMesh(): {
  boardGroup: THREE.Group;
  tiles: THREE.Mesh[];
  tileMap: Map<string, THREE.Mesh>;
} {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'chess-board-structure';

  const tiles: THREE.Mesh[] = [];
  const tileMap = new Map<string, THREE.Mesh>();

  const lightTex = createTileTextures(false);
  const darkTex = createTileTextures(true);

  const matL = new THREE.MeshPhysicalMaterial({
    map: lightTex.map,
    emissiveMap: lightTex.emi,
    emissive: new THREE.Color(0xffd88a),
    emissiveIntensity: 0.12,
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12,
    iridescence: 0.12,
    envMapIntensity: 0.48,
  });

  const matD = new THREE.MeshPhysicalMaterial({
    map: darkTex.map,
    emissiveMap: darkTex.emi,
    emissive: new THREE.Color(0xffd88a),
    emissiveIntensity: 0.12,
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12,
    iridescence: 0.12,
    envMapIntensity: 0.48,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc8a365,
    metalness: 0.94,
    roughness: 0.23,
  });

  const tileGeo = new THREE.BoxGeometry(0.95, 0.14, 0.95);

  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sq = String.fromCharCode(97 + f) + (r + 1);
      const isDark = (f + r) % 2 === 0;
      const mesh = new THREE.Mesh(tileGeo, isDark ? matD : matL);
      mesh.position.copy(sqToPos(sq)).setY(-0.07);
      mesh.receiveShadow = true;
      mesh.userData.square = sq;
      boardGroup.add(mesh);
      tiles.push(mesh);
      tileMap.set(sq, mesh);
    }
  }

  // Base gold plate underneath tiles
  const plate = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.2, 8.3), goldMat);
  plate.position.y = -0.12;
  plate.receiveShadow = true;
  boardGroup.add(plate);

  // Outer ornate frame with navy borders and gold trims
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x080b38,
    roughness: 0.35,
    metalness: 0.2,
  });

  const W = 0.7;
  const H = 0.55;
  const inner = 4.15;

  for (let i = 0; i < 4; i++) {
    const side = new THREE.Group();
    side.rotation.y = (i * Math.PI) / 2;
    boardGroup.add(side);

    const body = new THREE.Mesh(new THREE.BoxGeometry(inner * 2 + W * 2, H, W), frameMat);
    body.position.set(0, 0.03 - H / 2, inner + W / 2);
    body.receiveShadow = true;
    side.add(body);

    // Gold trim borders
    for (const [z, h] of [[inner + 0.03, 0.06], [inner + W - 0.03, 0.06]]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(inner * 2 + W * 2, h, 0.06), goldMat);
      trim.position.set(0, 0.06, z);
      side.add(trim);
    }

    // Side outer medallion
    const med = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 12, 40), goldMat);
    med.position.set(0, -H / 2 + 0.03, inner + W + 0.01);
    side.add(med);
  }

  return { boardGroup, tiles, tileMap };
}
