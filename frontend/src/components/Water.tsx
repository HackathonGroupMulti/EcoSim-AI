import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Custom water shader material
const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#1E90FF'),
    uDeepColor: new THREE.Color('#0066CC'),
    uFoamColor: new THREE.Color('#87CEEB'),
    uOpacity: 0.92,
  },
  // Vertex shader
  `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Create gentle waves
      float wave1 = sin(pos.x * 2.0 + uTime * 0.5) * 0.05;
      float wave2 = sin(pos.y * 3.0 + uTime * 0.7) * 0.03;
      float wave3 = sin((pos.x + pos.y) * 1.5 + uTime * 0.3) * 0.04;

      pos.z += wave1 + wave2 + wave3;
      vElevation = pos.z;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 uColor;
    uniform vec3 uDeepColor;
    uniform vec3 uFoamColor;
    uniform float uOpacity;
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      // Mix colors based on wave elevation
      vec3 color = mix(uDeepColor, uColor, vElevation * 5.0 + 0.5);

      // Add subtle foam effect at peaks
      float foam = smoothstep(0.08, 0.12, vElevation);
      color = mix(color, uFoamColor, foam * 0.3);

      // Add subtle shimmer
      float shimmer = sin(vUv.x * 50.0 + uTime) * sin(vUv.y * 50.0 + uTime * 0.7);
      color += shimmer * 0.02;

      // Fade out at edges (distance from center)
      vec2 center = vUv - 0.5;
      float dist = length(center) * 2.0;
      float edgeFade = 1.0 - smoothstep(0.7, 1.0, dist);

      gl_FragColor = vec4(color, uOpacity * edgeFade);
    }
  `
);

// Extend so we can use it as a JSX element
extend({ WaterMaterial });

// Type declaration for the custom material
declare module '@react-three/fiber' {
  interface ThreeElements {
    waterMaterial: ThreeElements['shaderMaterial'];
  }
}

interface WaterProps {
  size?: number;
  position?: [number, number, number];
  ecosystemHealth?: number;
}

export default function Water({ size = 30, position = [0, -0.1, 0], ecosystemHealth = 1.0 }: WaterProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Calculate water colors based on ecosystem health
  // Healthy = turquoise/tropical, Unhealthy = murky brown/gray
  const colors = useMemo(() => {
    // Healthy colors (deeper ocean blue)
    const healthyColor = new THREE.Color('#1E90FF');
    const healthyDeep = new THREE.Color('#0066CC');
    const healthyFoam = new THREE.Color('#87CEEB');

    // Unhealthy colors (murky/polluted)
    const unhealthyColor = new THREE.Color('#4A5D4A');
    const unhealthyDeep = new THREE.Color('#2F3D2F');
    const unhealthyFoam = new THREE.Color('#6B7B6B');

    return {
      color: healthyColor.clone().lerp(unhealthyColor, 1 - ecosystemHealth),
      deepColor: healthyDeep.clone().lerp(unhealthyDeep, 1 - ecosystemHealth),
      foamColor: healthyFoam.clone().lerp(unhealthyFoam, 1 - ecosystemHealth),
      opacity: 0.9 + ecosystemHealth * 0.05, // Higher base opacity for deeper look
    };
  }, [ecosystemHealth]);

  // Animate the water and update colors
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uColor.value = colors.color;
      materialRef.current.uniforms.uDeepColor.value = colors.deepColor;
      materialRef.current.uniforms.uFoamColor.value = colors.foamColor;
      materialRef.current.uniforms.uOpacity.value = colors.opacity;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[size, size, 128, 128]} />
      <waterMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
