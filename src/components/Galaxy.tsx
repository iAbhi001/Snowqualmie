import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Galaxy() {
  const pointsRef = useRef<THREE.Points>(null);

  // Galaxy Parameters
  const count = 10000; // Number of stars
  const radius = 25;   // Scale of the galaxy
  const branches = 3;  // Number of spiral arms
  const randomness = 0.5;
  const randomnessPower = 3;
  const insideColor = "#ff6030"; // Core color (warm)
  const outsideColor = "#1b3984"; // Edge color (cool)

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorInside = new THREE.Color(insideColor);
    const colorOutside = new THREE.Color(outsideColor);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Position Math
      const r = Math.random() * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * 0.2;

      const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
      const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
      const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

      // Color Math (Mix based on radius)
      const mixedColor = colorInside.clone();
      mixedColor.lerp(colorOutside, r / radius);

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      // Slow rotation for the whole galaxy
      pointsRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <points ref={pointsRef} position={[0, -5, -30]} rotation={[0.5, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
                  attach="attributes-position"
                  count={count}
                  array={positions}
                  itemSize={3}
        />
        <bufferAttribute
                  attach="attributes-color"
                  count={count}
                  array={colors}
                  itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        vertexColors={true}
        blending={THREE.AdditiveBlending}
        transparent
        opacity={0.8}
      />
    </points>
  );
}