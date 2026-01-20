import { useMemo } from 'react';
import { createNoise2D } from 'simplex-noise';
import { Edges } from '@react-three/drei';
import type { Tile } from '../types';
import { BIOME_COLORS } from '../types';

interface IslandProps {
  tiles: Tile[];
  gridSize: number;
  selectedTile: [number, number] | null;
  onTileSelect: (x: number, y: number) => void;
}

// Generate island-shaped elevation (higher in center, falls off to edges)
function getIslandElevation(x: number, y: number, gridSize: number, noise2D: ReturnType<typeof createNoise2D>): number {
  // Normalize coordinates to -1 to 1
  const nx = (x / gridSize) * 2 - 1;
  const ny = (y / gridSize) * 2 - 1;

  // Distance from center (0 at center, 1 at corners)
  const distFromCenter = Math.sqrt(nx * nx + ny * ny);

  // Island falloff - creates circular island shape
  const islandMask = Math.max(0, 1 - distFromCenter * 1.2);

  // Add noise for natural variation
  const noiseValue = (noise2D(x * 0.3, y * 0.3) + 1) / 2;

  // Combine: island shape * noise
  const elevation = islandMask * islandMask * (0.5 + noiseValue * 0.5);

  return elevation;
}

interface TileHexProps {
  tile: Tile;
  elevation: number;
  gridSize: number;
  isSelected: boolean;
  onClick: () => void;
}

function TileHex({ tile, elevation, gridSize, isSelected, onClick }: TileHexProps) {
  const color = BIOME_COLORS[tile.biome];
  const offset = gridSize / 2 - 0.5;

  // Height based on our procedural elevation
  const height = 0.1 + elevation * 1.5;

  // Hex-like shape using cylinder with 6 sides
  return (
    <mesh
      position={[tile.x - offset, height / 2, tile.y - offset]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <cylinderGeometry args={[0.52, 0.55, height, 6]} />
      <meshStandardMaterial
        color={isSelected ? '#ffffff' : color}
        transparent
        opacity={0.9}
        flatShading
      />
      <Edges color={isSelected ? '#00ffff' : '#ffffff'} threshold={15} />
    </mesh>
  );
}

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

function Tree({ position, scale = 1 }: TreeProps) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.3, 6]} />
        <meshStandardMaterial color="#3d2817" />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.2, 0.35, 6]} />
        <meshStandardMaterial color="#1a4025" flatShading />
        <Edges color="#ffffff" threshold={15} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.15, 0.25, 6]} />
        <meshStandardMaterial color="#245530" flatShading />
        <Edges color="#ffffff" threshold={15} />
      </mesh>
    </group>
  );
}

interface RockProps {
  position: [number, number, number];
  scale?: number;
}

function Rock({ position, scale = 1 }: RockProps) {
  return (
    <mesh position={position} scale={scale} rotation={[0, Math.random() * Math.PI, 0]}>
      <dodecahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial color="#5a5a6e" flatShading />
      <Edges color="#ffffff" threshold={15} />
    </mesh>
  );
}

interface MountainPeakProps {
  position: [number, number, number];
  scale?: number;
}

function MountainPeak({ position, scale = 1 }: MountainPeakProps) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <coneGeometry args={[0.4, 0.8, 5]} />
        <meshStandardMaterial color="#6a6a7e" flatShading />
        <Edges color="#ffffff" threshold={15} />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.15, 0.25, 5]} />
        <meshStandardMaterial color="#e8e8f0" flatShading />
        <Edges color="#ffffff" threshold={15} />
      </mesh>
    </group>
  );
}

export default function Island({ tiles, gridSize, selectedTile, onTileSelect }: IslandProps) {
  // Generate consistent noise
  const noise2D = useMemo(() => createNoise2D(() => 0.5), []);

  // Calculate elevations for all tiles
  const tileElevations = useMemo(() => {
    const elevations = new Map<string, number>();
    tiles.forEach((tile) => {
      const key = `${tile.x}-${tile.y}`;
      elevations.set(key, getIslandElevation(tile.x, tile.y, gridSize, noise2D));
    });
    return elevations;
  }, [tiles, gridSize, noise2D]);

  // Generate props (trees, rocks) for tiles
  const props = useMemo(() => {
    const items: { type: 'tree' | 'rock' | 'mountain'; position: [number, number, number]; scale: number }[] = [];
    const offset = gridSize / 2 - 0.5;

    tiles.forEach((tile) => {
      const elevation = tileElevations.get(`${tile.x}-${tile.y}`) || 0;
      if (elevation < 0.15) return; // Skip water/beach tiles

      const baseHeight = 0.1 + elevation * 1.5;
      const baseX = tile.x - offset;
      const baseZ = tile.y - offset;

      if (tile.biome === 'forest') {
        // Add 1-3 trees
        const treeCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < treeCount; i++) {
          items.push({
            type: 'tree',
            position: [
              baseX + (Math.random() - 0.5) * 0.4,
              baseHeight,
              baseZ + (Math.random() - 0.5) * 0.4,
            ],
            scale: 0.7 + Math.random() * 0.4,
          });
        }
      } else if (tile.biome === 'mountain') {
        items.push({
          type: 'mountain',
          position: [baseX, baseHeight, baseZ],
          scale: 0.8 + Math.random() * 0.4,
        });
      } else if (tile.biome === 'grassland' && Math.random() > 0.7) {
        // Occasional rocks on grassland
        items.push({
          type: 'rock',
          position: [
            baseX + (Math.random() - 0.5) * 0.3,
            baseHeight,
            baseZ + (Math.random() - 0.5) * 0.3,
          ],
          scale: 0.5 + Math.random() * 0.5,
        });
      }
    });

    return items;
  }, [tiles, gridSize, tileElevations]);

  return (
    <group>
      {/* Island tiles */}
      {tiles.map((tile) => {
        const elevation = tileElevations.get(`${tile.x}-${tile.y}`) || 0;
        // Only render tiles above water level
        if (elevation < 0.08) return null;

        return (
          <TileHex
            key={`${tile.x}-${tile.y}`}
            tile={tile}
            elevation={elevation}
            gridSize={gridSize}
            isSelected={selectedTile?.[0] === tile.x && selectedTile?.[1] === tile.y}
            onClick={() => onTileSelect(tile.x, tile.y)}
          />
        );
      })}

      {/* Environmental props */}
      {props.map((prop, i) => {
        if (prop.type === 'tree') {
          return <Tree key={`tree-${i}`} position={prop.position} scale={prop.scale} />;
        } else if (prop.type === 'rock') {
          return <Rock key={`rock-${i}`} position={prop.position} scale={prop.scale} />;
        } else if (prop.type === 'mountain') {
          return <MountainPeak key={`mountain-${i}`} position={prop.position} scale={prop.scale} />;
        }
        return null;
      })}
    </group>
  );
}
