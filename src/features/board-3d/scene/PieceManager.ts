import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PieceColor, PieceType } from '../../../types/chess';
import { luxuryMaterial } from '../materials/piecePalette';
import { sqToPos } from './BoardMesh';

const MODEL_FILES: Record<string, string> = {
  p: '/models/crystal-staff-runtime.glb',
  r: '/models/crystal-crown-runtime.glb',
  n: '/models/winged-unicorn-runtime.glb',
  b: '/models/fantasy-staff-runtime.glb',
  q: '/models/fantasy-goddess-runtime.glb',
  k: '/models/crystal-statue-runtime.glb',
};

const PIECE_HEIGHTS: Record<string, number> = {
  p: 0.82,
  r: 1.08,
  n: 1.25,
  b: 1.3,
  q: 1.52,
  k: 1.58,
};

export interface ActiveAnimation {
  mesh: THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startTime: number;
  duration: number;
  isKnight: boolean;
  onComplete?: () => void;
}

export class PieceManager {
  public root: THREE.Group;
  private gltfLoader = new GLTFLoader();
  private baseModels: Map<string, THREE.Group> = new Map();
  private materialCache: Map<string, THREE.MeshPhysicalMaterial> = new Map();
  public pieceMap: Map<string, THREE.Group> = new Map();
  public isLoaded = false;
  private activeAnimations: ActiveAnimation[] = [];

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'chess-pieces-root';
  }

  public async preloadModels(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const entries = Object.entries(MODEL_FILES);
    let loadedCount = 0;

    await Promise.all(
      entries.map(async ([type, url]) => {
        try {
          const gltf = await this.gltfLoader.loadAsync(url);
          const model = gltf.scene;
          model.updateMatrixWorld(true);

          model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const mesh = o as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => (m.envMapIntensity = 0.7));
              } else if (mesh.material) {
                mesh.material.envMapIntensity = 0.7;
              }
            }
          });

          this.baseModels.set(type, model);
          loadedCount++;
          onProgress?.(loadedCount, entries.length);
        } catch (err) {
          console.error(`Failed to load model ${type} from ${url}:`, err);
        }
      })
    );

    this.isLoaded = true;
  }

  public createPiece(type: PieceType, color: PieceColor, square: string): THREE.Group | null {
    const base = this.baseModels.get(type);
    if (!base) return null;

    const group = new THREE.Group();
    const model = base.clone(true);
    group.add(model);

    // Compute bounding box and normalize scale & height
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const targetHeight = PIECE_HEIGHTS[type] || 1.0;
    const scale = Math.min(targetHeight / size.y, 0.86 / Math.max(size.x, size.z));

    model.scale.multiplyScalar(scale);
    model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    // Face rotation
    if (color === 'b') {
      group.rotation.y = Math.PI;
    }

    // Apply luxury shader material
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        const sourceMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const key = `${type}-${color}`;

        let luxuryMat = this.materialCache.get(key);
        if (!luxuryMat) {
          luxuryMat = luxuryMaterial(sourceMat, {
            type,
            color,
            minY: mesh.geometry.boundingBox?.min.y ?? -0.5,
            maxY: mesh.geometry.boundingBox?.max.y ?? 0.5,
          });
          this.materialCache.set(key, luxuryMat);
        }
        mesh.material = luxuryMat;
      }
    });

    // Raycast hit target cylinder
    const hitGeo = new THREE.CylinderGeometry(0.38, 0.38, targetHeight, 8).translate(0, targetHeight / 2, 0);
    const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
    hitMesh.userData = { pieceGroup: group, square, type, color };
    group.add(hitMesh);

    group.position.copy(sqToPos(square));
    group.userData = { square, type, color, targetHeight };

    this.root.add(group);
    this.pieceMap.set(square, group);
    return group;
  }

  public syncBoard(chessBoard: Array<Array<{ square: string; type: PieceType; color: PieceColor } | null>>) {
    // Clear existing
    this.clearPieces();

    // Spawn current pieces
    chessBoard.forEach((row) => {
      row.forEach((cell) => {
        if (cell) {
          this.createPiece(cell.type, cell.color, cell.square);
        }
      });
    });
  }

  public animateMove(
    from: string,
    to: string,
    onFinish?: () => void
  ) {
    const piece = this.pieceMap.get(from);
    if (!piece) {
      onFinish?.();
      return;
    }

    // Check if target square has captured piece
    const victim = this.pieceMap.get(to);
    if (victim) {
      this.shatterPiece(victim);
      this.pieceMap.delete(to);
    }

    this.pieceMap.delete(from);
    this.pieceMap.set(to, piece);
    piece.userData.square = to;

    const startPos = piece.position.clone();
    const endPos = sqToPos(to);
    const isKnight = piece.userData.type === 'n';

    this.activeAnimations.push({
      mesh: piece,
      startPos,
      endPos,
      startTime: performance.now(),
      duration: isKnight ? 500 : 380,
      isKnight,
      onComplete: onFinish,
    });
  }

  public shatterPiece(piece: THREE.Group) {
    this.root.remove(piece);

    // Create shattering crystal shards effect
    const shardGroup = new THREE.Group();
    const center = piece.position.clone();
    center.y += 0.5;

    const color = piece.userData.color === 'w' ? 0xfff1c4 : 0xb88cff;
    const shardMat = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 1,
    });

    const shards: { mesh: THREE.Mesh; vel: THREE.Vector3; rotSpeed: THREE.Vector3 }[] = [];

    for (let i = 0; i < 24; i++) {
      const sGeo = new THREE.TetrahedronGeometry(0.04 + Math.random() * 0.08);
      const sMesh = new THREE.Mesh(sGeo, shardMat);
      sMesh.position.set(
        center.x + (Math.random() - 0.5) * 0.4,
        center.y + (Math.random() - 0.5) * 0.4,
        center.z + (Math.random() - 0.5) * 0.4
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );

      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      shardGroup.add(sMesh);
      shards.push({ mesh: sMesh, vel, rotSpeed });
    }

    this.root.add(shardGroup);

    const startTime = performance.now();
    const duration = 1200;

    const animateShards = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      if (progress >= 1) {
        this.root.remove(shardGroup);
        shardGroup.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            (o as THREE.Mesh).geometry.dispose();
          }
        });
        shardMat.dispose();
        return;
      }

      const dt = 0.016;
      shards.forEach(({ mesh, vel, rotSpeed }) => {
        vel.y -= 9.8 * dt;
        mesh.position.addScaledVector(vel, dt);
        if (mesh.position.y < 0.02) {
          mesh.position.y = 0.02;
          vel.y *= -0.3;
          vel.x *= 0.7;
          vel.z *= 0.7;
        }
        mesh.rotation.x += rotSpeed.x * dt;
        mesh.rotation.y += rotSpeed.y * dt;
        mesh.rotation.z += rotSpeed.z * dt;
      });

      shardMat.opacity = Math.max(0, 1 - progress);
      requestAnimationFrame(animateShards);
    };

    requestAnimationFrame(animateShards);
  }

  public update() {
    const now = performance.now();

    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const anim = this.activeAnimations[i];
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);

      // Smooth ease-in-out
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      anim.mesh.position.lerpVectors(anim.startPos, anim.endPos, ease);

      // Parabolic jump arc
      const arcHeight = anim.isKnight ? 1.2 : 0.35;
      anim.mesh.position.y = Math.sin(Math.PI * progress) * arcHeight;

      if (progress >= 1) {
        anim.mesh.position.copy(anim.endPos);
        anim.onComplete?.();
        this.activeAnimations.splice(i, 1);
      }
    }
  }

  public clearPieces() {
    while (this.root.children.length > 0) {
      this.root.remove(this.root.children[0]);
    }
    this.pieceMap.clear();
  }
}
