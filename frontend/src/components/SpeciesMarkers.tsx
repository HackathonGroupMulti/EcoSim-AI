import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import type { Species } from '../types';

interface SpeciesMarkersProps {
  species: Species[];
  terrainSize?: number;
  terrainPosition?: [number, number, number];
}

// Colors for different species types - highly distinct
const DIET_COLORS: Record<string, string> = {
  producer: '#00FF00',    // Bright lime green for plants
  herbivore: '#00BFFF',   // Deep sky blue for herbivores
  carnivore: '#FF0000',   // Pure red for carnivores/predators
  omnivore: '#FF8C00',    // Dark orange for omnivores
};

export default function SpeciesMarkers({
  species,
  terrainSize = 64,
  terrainPosition = [0, -3, 0]
}: SpeciesMarkersProps) {
  const [elevationData, setElevationData] = useState<Uint8ClampedArray | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Load elevation data from the same PNG the terrain uses
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        setElevationData(data);
        setImageSize({ width: img.width, height: img.height });
      }
    };
    img.src = '/elevation.png';
  }, []);

  // Sample elevation at UV coordinates (0-1 range)
  const getElevationAt = (u: number, v: number): number => {
    if (!elevationData || imageSize.width === 0) return 0;

    // Clamp UV to valid range
    const clampedU = Math.max(0, Math.min(1, u));
    const clampedV = Math.max(0, Math.min(1, v));

    // Convert UV to pixel coordinates
    const px = Math.floor(clampedU * (imageSize.width - 1));
    const py = Math.floor(clampedV * (imageSize.height - 1));

    // Get pixel index (4 channels: RGBA)
    const idx = (py * imageSize.width + px) * 4;

    // Return red channel normalized to 0-1 (same as shader)
    return elevationData[idx] / 255;
  };

  // Generate marker positions
  const markers = useMemo(() => {
    if (!elevationData || imageSize.width === 0) return [];

    const result: { position: [number, number, number]; color: string; size: number }[] = [];
    const clipThreshold = 0.15; // Same as terrain shader
    const halfSize = terrainSize / 2;

    // Filter to only species with population
    const activeSpecies = species.filter(s => s.population > 0);

    for (const s of activeSpecies) {
      // Number of dots based on population (logarithmic scale)
      const dotCount = Math.min(50, Math.max(3, Math.floor(Math.log10(s.population + 1) * 10)));
      const color = DIET_COLORS[s.diet] || '#FFFFFF';
      const size = 0.15 + Math.log10(s.population + 1) * 0.05;

      let attempts = 0;
      let placed = 0;

      while (placed < dotCount && attempts < dotCount * 20) {
        attempts++;

        // Random UV coordinates
        const u = Math.random();
        const v = Math.random();

        // Check elevation - only place on land
        const elevation = getElevationAt(u, v);
        if (elevation < clipThreshold) continue;

        // Convert UV to world coordinates
        // UV (0,0) is top-left, (1,1) is bottom-right
        // World X goes from -halfSize to +halfSize
        // World Z goes from -halfSize to +halfSize (after rotation)
        const worldX = (u - 0.5) * terrainSize + terrainPosition[0];
        const worldZ = (v - 0.5) * terrainSize + terrainPosition[2];

        // Y position: terrain base + elevation offset
        // The terrain's displacement scale is 1.0
        const worldY = terrainPosition[1] + elevation * 1.0 + 0.1; // Slightly above terrain

        result.push({
          position: [worldX, worldY, worldZ],
          color,
          size,
        });
        placed++;
      }
    }

    return result;
  }, [species, elevationData, imageSize, terrainSize, terrainPosition]);

  if (!elevationData) return null;

  return (
    <group>
      {markers.map((marker, i) => (
        <mesh key={i} position={marker.position}>
          <sphereGeometry args={[marker.size, 8, 8]} />
          <meshBasicMaterial color={marker.color} />
        </mesh>
      ))}
    </group>
  );
}
