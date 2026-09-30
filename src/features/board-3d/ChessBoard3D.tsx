import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { setupPalaceLighting, createPalaceEnvironment } from './scene/PalaceScene';
import { createBoardMesh, sqToPos } from './scene/BoardMesh';
import { PieceManager } from './scene/PieceManager';
import { JewelGlints } from './effects/JewelGlints';

export const ChessBoard3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState<number | null>(0);

  const {
    chess,
    fen,
    selectedSquare,
    legalMoves,
    lastMove,
    inCheck,
    turn,
    selectSquare,
  } = useGameStore();

  const { graphics, cameraView } = useSettingsStore();

  const pieceManagerRef = useRef<PieceManager>(new PieceManager());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const highlightGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Mount 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(6.5, 5.0, 9.4);
    cameraRef.current = camera;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.3, 0.6);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 22;
    controls.maxPolarAngle = 1.25;
    controlsRef.current = controls;

    // 5. Lighting & Palace Environment
    setupPalaceLighting(scene, renderer);
    const palace = createPalaceEnvironment();
    scene.add(palace);

    // 6. Board Mesh
    const { boardGroup, tiles } = createBoardMesh();
    scene.add(boardGroup);

    // 7. Piece Manager
    const pieceManager = pieceManagerRef.current;
    scene.add(pieceManager.root);

    // 8. Highlights Root
    const hlGroup = highlightGroupRef.current;
    scene.add(hlGroup);

    // 9. Jewel Glints
    const glints = new JewelGlints();
    if (graphics.luxuryLighting) {
      scene.add(glints.points);
    }

    // Preload models
    pieceManager.preloadModels((loaded, total) => {
      const p = Math.round((loaded / total) * 100);
      setLoadingProgress(p);
      if (loaded === total) {
        setLoadingProgress(null);
        pieceManager.syncBoard(chess.board());
      }
    });

    // 10. Pointer Raycasting for Clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 5) return; // Dragging camera, not clicking

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check intersect with pieces first
      const pieceIntersects = raycaster.intersectObjects(pieceManager.root.children, true);
      for (const hit of pieceIntersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== pieceManager.root) {
          if (curr.userData?.square) {
            selectSquare(curr.userData.square);
            return;
          }
          curr = curr.parent;
        }
      }

      // Check intersect with board tiles
      const tileIntersects = raycaster.intersectObjects(tiles, false);
      if (tileIntersects.length > 0) {
        const sq = tileIntersects[0].object.userData.square;
        if (sq) {
          selectSquare(sq);
          return;
        }
      }

      // Click outside -> deselect
      selectSquare(null);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointerup', onPointerUp);

    // 11. Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      controls.update();
      pieceManager.update();
      glints.update(elapsed);

      renderer.render(scene, camera);
    };
    animate();

    // 12. Resize Listener
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, []);

  // Sync board pieces when FEN changes
  useEffect(() => {
    if (!pieceManagerRef.current.isLoaded) return;
    const pm = pieceManagerRef.current;

    if (lastMove) {
      pm.animateMove(lastMove.from, lastMove.to, () => {
        pm.syncBoard(chess.board());
      });
    } else {
      pm.syncBoard(chess.board());
    }
  }, [fen]);

  // Update Highlight Markers (Selected, Legal Moves, Check)
  useEffect(() => {
    const hlGroup = highlightGroupRef.current;
    while (hlGroup.children.length > 0) {
      const child = hlGroup.children[0] as THREE.Mesh;
      hlGroup.remove(child);
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material?.dispose();
    }

    // 1. Highlight selected square
    if (selectedSquare) {
      const pos = sqToPos(selectedSquare);
      const selectGeo = new THREE.PlaneGeometry(0.92, 0.92).rotateX(-Math.PI / 2);
      const selectMat = new THREE.MeshBasicMaterial({
        color: 0xffd97d,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      const selectMesh = new THREE.Mesh(selectGeo, selectMat);
      selectMesh.position.copy(pos).setY(0.01);
      hlGroup.add(selectMesh);

      // Gold border
      const borderGeo = new THREE.RingGeometry(0.44, 0.47, 4).rotateX(-Math.PI / 2).rotateY(Math.PI / 4);
      const borderMat = new THREE.MeshBasicMaterial({
        color: 0xffe89e,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.copy(pos).setY(0.015);
      hlGroup.add(borderMesh);
    }

    // 2. Legal move target hints
    if (graphics.legalHints) {
      legalMoves.forEach((destSq) => {
        const pos = sqToPos(destSq);
        const hasEnemy = chess.get(destSq as any);

        if (hasEnemy) {
          // Capture Ring (Red-gold)
          const ringGeo = new THREE.RingGeometry(0.36, 0.44, 32).rotateX(-Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xe86a55,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.position.copy(pos).setY(0.015);
          hlGroup.add(ringMesh);
        } else {
          // Normal move dot (Golden ring & center dot)
          const dotGeo = new THREE.CircleGeometry(0.12, 16).rotateX(-Math.PI / 2);
          const dotMat = new THREE.MeshBasicMaterial({
            color: 0xf5dfa2,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
          });
          const dotMesh = new THREE.Mesh(dotGeo, dotMat);
          dotMesh.position.copy(pos).setY(0.015);
          hlGroup.add(dotMesh);
        }
      });
    }

    // 3. Last move trail
    if (lastMove) {
      [lastMove.from, lastMove.to].forEach((sq) => {
        const pos = sqToPos(sq);
        const trailGeo = new THREE.PlaneGeometry(0.92, 0.92).rotateX(-Math.PI / 2);
        const trailMat = new THREE.MeshBasicMaterial({
          color: 0xc8a365,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        });
        const trailMesh = new THREE.Mesh(trailGeo, trailMat);
        trailMesh.position.copy(pos).setY(0.008);
        hlGroup.add(trailMesh);
      });
    }

    // 4. Check warning around King
    if (inCheck) {
      let kingSquare: string | null = null;
      chess.board().forEach((row) => {
        row.forEach((cell) => {
          if (cell && cell.type === 'k' && cell.color === turn) {
            kingSquare = cell.square;
          }
        });
      });

      if (kingSquare) {
        const pos = sqToPos(kingSquare);
        const checkGeo = new THREE.RingGeometry(0.25, 0.48, 32).rotateX(-Math.PI / 2);
        const checkMat = new THREE.MeshBasicMaterial({
          color: 0xff3b30,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });
        const checkMesh = new THREE.Mesh(checkGeo, checkMat);
        checkMesh.position.copy(pos).setY(0.02);
        hlGroup.add(checkMesh);
      }
    }
  }, [selectedSquare, legalMoves, lastMove, inCheck, graphics.legalHints]);

  // Camera presets
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (cameraView === 'top') {
      camera.position.set(0, 11, 0.1);
      controls.target.set(0, 0, 0);
    } else if (cameraView === 'flipped') {
      camera.position.set(-6.5, 5.0, -9.4);
      controls.target.set(0, 0.3, -0.6);
    } else {
      camera.position.set(6.5, 5.0, 9.4);
      controls.target.set(0, 0.3, 0.6);
    }
    controls.update();
  }, [cameraView]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Model Loading Screen */}
      {loadingProgress !== null && (
        <div className="absolute inset-0 bg-[#05061a]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-500">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-amber-300">
              ♛
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-wide text-amber-100 mb-2">
            Đang tải bàn cờ hoàng gia...
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Đang tải mô hình 3D pha lê và kiến trúc thiên thể ({loadingProgress}%)
          </p>
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-amber-400/30">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
