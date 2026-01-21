import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { Species } from '../types';
import WaterSurfaceSimple from '../../WaterSurface/WaterSurfaceSimple';
import Terrain from './Terrain';
import SpeciesMarkers from './SpeciesMarkers';
import { Color } from 'three';

interface EcosystemViewportProps {
  species: Species[];
  season: string;
}

interface SceneProps {
  species: Species[];
  season: string;
  ecosystemHealth: number;
}

function Scene({ species, season, ecosystemHealth }: SceneProps) {
  // Calculate sky parameters based on ecosystem health
  // Health 1.0 = bright sunny day, Health 0 = apocalyptic red sky
  const sunPosition = useMemo((): [number, number, number] => {
    // Lower sun position when unhealthy (more dramatic)
    const sunHeight = 3 + ecosystemHealth * 4;
    return [7, sunHeight, 1];
  }, [ecosystemHealth]);

  // Turbidity: higher = hazier/more polluted looking
  const turbidity = useMemo(() => {
    return 2 + (1 - ecosystemHealth) * 18; // 2 (healthy) to 20 (apocalyptic)
  }, [ecosystemHealth]);

  // Rayleigh: affects sky color scattering
  const rayleigh = useMemo(() => {
    return 0.5 + (1 - ecosystemHealth) * 3; // More = more intense color
  }, [ecosystemHealth]);

  // Ambient light dims when ecosystem is unhealthy
  const ambientIntensity = 0.2 + ecosystemHealth * 0.4;

  return (
    <>
      {/* Lighting - dims with poor ecosystem health */}
      <ambientLight intensity={ambientIntensity} />
      <pointLight intensity={1.5 + ecosystemHealth * 0.5} position={sunPosition} />

      {/* Sky - becomes apocalyptic when ecosystem is unhealthy */}
      <Sky
        sunPosition={sunPosition}
        turbidity={turbidity}
        rayleigh={rayleigh}
        mieCoefficient={0.005 + (1 - ecosystemHealth) * 0.05}
        mieDirectionalG={0.8}
      />

      {/* Ocean - realistic water with reflections */}
      <WaterSurfaceSimple
        width={120}
        length={120}
        position={[0, -3.5, 0]}
        waterColor={new Color('#1E90FF').lerp(new Color('#2F4F4F'), 1 - ecosystemHealth).getHex()}
        distortionScale={0.7}
        alpha={0.6}
      />

      {/* Terrain - tinted by ecosystem health and season */}
      <Terrain position={[0, -3, 0]} species={species} season={season} />

      {/* Species markers as dots on land */}
      <SpeciesMarkers species={species} terrainSize={64} terrainPosition={[0, -3, 0]} />

      {/* Camera controls */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.3}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

export default function EcosystemViewport({ species, season }: EcosystemViewportProps) {
  // Calculate ecosystem health (0-1) based on species populations
  const ecosystemHealth = useMemo(() => {
    if (!species || species.length === 0) return 1.0;

    // Factors for ecosystem health:
    // 1. Plant population (producers are the base)
    const plants = species.filter(s => s.diet === 'producer');
    const totalPlants = plants.reduce((sum, s) => sum + s.population, 0);
    const plantHealth = Math.min(1.0, totalPlants / 2000); // 2000 plants = healthy

    // 2. Species diversity (more species = healthier)
    const aliveSpecies = species.filter(s => s.population > 0).length;
    const diversityHealth = aliveSpecies / species.length;

    // 3. Predator-prey balance (having both herbivores and carnivores)
    const herbivores = species.filter(s => s.diet === 'herbivore');
    const carnivores = species.filter(s => s.diet === 'carnivore');
    const totalHerbivores = herbivores.reduce((sum, s) => sum + s.population, 0);
    const totalCarnivores = carnivores.reduce((sum, s) => sum + s.population, 0);
    const balanceHealth = totalHerbivores > 0 && totalCarnivores > 0 ? 1.0 : 0.5;

    // Weighted average
    return plantHealth * 0.4 + diversityHealth * 0.4 + balanceHealth * 0.2;
  }, [species]);

  return (
    <Canvas
      camera={{ position: [20, 15, 20], fov: 45 }}
      shadows
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <Scene species={species} season={season} ecosystemHealth={ecosystemHealth} />
      </Suspense>

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          intensity={0.3}
        />
      </EffectComposer>
    </Canvas>
  );
}
