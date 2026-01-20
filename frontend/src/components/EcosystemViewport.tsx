import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { Tile } from '../types';
import Water from './Water';
import Island from './Island';

interface EcosystemViewportProps {
  tiles: Tile[];
  gridSize: number;
  selectedTile: [number, number] | null;
  onTileSelect: (x: number, y: number) => void;
}

function Scene({
  tiles,
  gridSize,
  selectedTile,
  onTileSelect,
}: EcosystemViewportProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.2} color="#4080ff" />
      <hemisphereLight args={['#87ceeb', '#3d5c3d', 0.3]} />

      {/* Stars in background */}
      <Stars
        radius={50}
        depth={50}
        count={1000}
        factor={2}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Ocean */}
      <Water size={25} position={[0, -0.05, 0]} />

      {/* Island with tiles and props */}
      <Island
        tiles={tiles}
        gridSize={gridSize}
        selectedTile={selectedTile}
        onTileSelect={onTileSelect}
      />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

export default function EcosystemViewport({
  tiles,
  gridSize,
  selectedTile,
  onTileSelect,
}: EcosystemViewportProps) {
  return (
    <Canvas
      camera={{ position: [10, 8, 10], fov: 45 }}
      shadows
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0a0a12']} />

      <Suspense fallback={null}>
        <Scene
          tiles={tiles}
          gridSize={gridSize}
          selectedTile={selectedTile}
          onTileSelect={onTileSelect}
        />
      </Suspense>

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          intensity={0.4}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0005, 0.0005]}
        />
      </EffectComposer>
    </Canvas>
  );
}
