import { useLoader } from '@react-three/fiber';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { Species } from '../types';

interface TerrainProps {
  position?: [number, number, number];
  species?: Species[];
  season?: string;
}

export default function Terrain({ position = [0, -3, 0], species = [], season = 'spring' }: TerrainProps) {
  const height = useLoader(THREE.TextureLoader, '/elevation.png');
  const normals = useLoader(THREE.TextureLoader, '/normals.png');
  const colors = useLoader(THREE.TextureLoader, '/colors.png');

  // Calculate ecosystem health metrics for visual tinting
  const ecosystemState = useMemo(() => {
    if (!species || species.length === 0) {
      return { vegetationHealth: 1.0, seasonTint: [1.0, 1.0, 1.0] };
    }

    // Calculate vegetation health from plant populations
    const plants = species.filter(s => s.diet === 'producer');
    const totalPlants = plants.reduce((sum, s) => sum + s.population, 0);
    const vegetationHealth = Math.min(1.0, totalPlants / 10000); // 0-1 scale

    // Season tinting
    let seasonTint: [number, number, number];
    switch (season) {
      case 'winter':
        seasonTint = [0.9, 0.95, 1.1]; // Blueish, desaturated
        break;
      case 'spring':
        seasonTint = [0.95, 1.1, 0.95]; // Fresh green boost
        break;
      case 'summer':
        seasonTint = [1.1, 1.05, 0.9]; // Warm, golden
        break;
      case 'fall':
        seasonTint = [1.15, 0.95, 0.8]; // Orange/brown tint
        break;
      default:
        seasonTint = [1.0, 1.0, 1.0];
    }

    return { vegetationHealth, seasonTint };
  }, [species, season]);

  // Custom shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        colorMap: { value: colors },
        displacementMap: { value: height },
        normalMap: { value: normals },
        displacementScale: { value: 1.0 },
        clipThreshold: { value: 0.15 },
        vegetationHealth: { value: ecosystemState.vegetationHealth },
        seasonTint: { value: new THREE.Vector3(...ecosystemState.seasonTint) },
      },
      vertexShader: `
        uniform sampler2D displacementMap;
        uniform float displacementScale;

        varying vec2 vUv;
        varying float vDisplacement;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vNormal = normal;

          // Sample displacement
          vec4 dispTexel = texture2D(displacementMap, uv);
          vDisplacement = dispTexel.r;

          // Apply displacement
          vec3 newPosition = position + normal * dispTexel.r * displacementScale;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D colorMap;
        uniform float clipThreshold;
        uniform float vegetationHealth;
        uniform vec3 seasonTint;

        varying vec2 vUv;
        varying float vDisplacement;
        varying vec3 vNormal;

        void main() {
          // Discard pixels below water level
          if (vDisplacement < clipThreshold) {
            discard;
          }

          // Get base color from texture
          vec4 baseColor = texture2D(colorMap, vUv);

          // Apply vegetation health - low health = more brown/yellow
          vec3 healthyColor = baseColor.rgb;
          vec3 unhealthyColor = vec3(
            baseColor.r * 1.2,
            baseColor.g * 0.7,
            baseColor.b * 0.5
          );
          vec3 color = mix(unhealthyColor, healthyColor, vegetationHealth);

          // Apply seasonal tint
          color *= seasonTint;

          // Simple shading based on elevation
          float elevationShade = 0.7 + vDisplacement * 0.5;

          // Fake lighting
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
          float diffuse = max(dot(vNormal, lightDir), 0.3);

          vec3 finalColor = color * elevationShade * diffuse;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, [colors, height, normals, ecosystemState]);

  // Update uniforms when ecosystem state changes
  useEffect(() => {
    material.uniforms.vegetationHealth.value = ecosystemState.vegetationHealth;
    material.uniforms.seasonTint.value = new THREE.Vector3(...ecosystemState.seasonTint);
  }, [ecosystemState, material]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      material={material}
    >
      <planeGeometry args={[64, 64, 1024, 1024]} />
    </mesh>
  );
}
