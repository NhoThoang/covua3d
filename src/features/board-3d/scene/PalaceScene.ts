import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function setupPalaceLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  // Fog and Background
  scene.background = new THREE.Color(0x05061a);
  scene.fog = new THREE.FogExp2(0x05061a, 0.022);

  // PMREM Room Environment for crystal iridescence and jewel reflection
  const pmrem = new THREE.PMREMGenerator(renderer);
  const jewelryStudio = new RoomEnvironment();

  const cards: [number, number, number, number, number, number, number][] = [
    [-4, 5, 2, 2, 7, 0xfff2dc, 1.8],
    [4, 3, -2, 1.3, 6, 0xe4eeff, 1.6],
    [0, 7, -4, 6, 1, 0xffffff, 2.2],
  ];

  for (const [x, y, z, w, h, tint, power] of cards) {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(tint).multiplyScalar(power),
        side: THREE.DoubleSide,
      })
    );
    card.position.set(x, y, z);
    card.lookAt(0, 0, 0);
    jewelryStudio.add(card);
  }

  scene.environment = pmrem.fromScene(jewelryStudio, 0.025).texture;
  jewelryStudio.dispose();
  pmrem.dispose();
  scene.environmentIntensity = 0.6;

  // Hemisphere Light
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x92909a, 0.5);
  scene.add(hemiLight);

  // Key Directional Light with Shadows
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(4, 12, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, {
    left: -7,
    right: 7,
    top: 7,
    bottom: -7,
    near: 1,
    far: 30,
  });
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  // Fill and Rim Lights
  const portraitFill = new THREE.DirectionalLight(0xffffff, 0.45);
  portraitFill.position.set(-3, 2, 6);
  scene.add(portraitFill);

  const rimA = new THREE.PointLight(0xffffff, 3, 18);
  rimA.position.set(-6, 4, -5);
  scene.add(rimA);

  const rimB = new THREE.PointLight(0xffffff, 3, 16);
  rimB.position.set(6, 3, -4);
  scene.add(rimB);
}

export function createPalaceEnvironment(): THREE.Group {
  const palace = new THREE.Group();
  palace.name = 'celestial-palace';

  const textureLoader = new THREE.TextureLoader();

  // Load palace textures
  const loadTex = (url: string, repeatX = 1, repeatY = 1) => {
    const tex = textureLoader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (repeatX !== 1 || repeatY !== 1) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
    }
    return tex;
  };

  const ivoryMarble = loadTex('/assets/palace/ivory-marble.jpg', 6, 6);
  const royalCeiling = loadTex('/assets/palace/royal-ceiling.jpg', 2, 2);
  const wallNorth = loadTex('/assets/palace/palace-wall-north-v2.jpg');
  const wallSouth = loadTex('/assets/palace/palace-wall-south-v2.jpg');
  const wallEast = loadTex('/assets/palace/palace-wall-east-v2.jpg');
  const wallWest = loadTex('/assets/palace/palace-wall-west-v2.jpg');

  // Palace Floor
  const floorGeo = new THREE.PlaneGeometry(68, 68);
  const floorMat = new THREE.MeshStandardMaterial({
    map: ivoryMarble,
    roughness: 0.15,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.96;
  floor.receiveShadow = true;
  palace.add(floor);

  // Palace Ceiling
  const ceilingGeo = new THREE.PlaneGeometry(68, 68);
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: royalCeiling,
    roughness: 0.6,
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 30;
  palace.add(ceiling);

  // Palace Walls
  const wallH = 34;
  const wallW = 68;
  const wallHalf = 34;

  const makeWall = (tex: THREE.Texture, pos: [number, number, number], rotY: number) => {
    const geo = new THREE.PlaneGeometry(wallW, wallH);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.4,
    });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(pos[0], pos[1], pos[2]);
    wall.rotation.y = rotY;
    palace.add(wall);
  };

  makeWall(wallNorth, [0, 13, -wallHalf], 0);
  makeWall(wallSouth, [0, 13, wallHalf], Math.PI);
  makeWall(wallEast, [wallHalf, 13, 0], -Math.PI / 2);
  makeWall(wallWest, [-wallHalf, 13, 0], Math.PI / 2);

  return palace;
}
