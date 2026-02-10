import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Satellite() {
  const satRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.5; // Speed of orbit
    if (satRef.current) {
      // Orbit math: Radius is 2.5 (just outside the Earth)
      satRef.current.position.x = Math.cos(t) * 2.5;
      satRef.current.position.z = Math.sin(t) * 2.5;
      satRef.current.position.y = Math.sin(t * 0.5) * 1.2; // Slight tilt
      
      // Make the satellite look at the earth
      satRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={satRef}>
      {/* Satellite Body */}
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
      </mesh>
      {/* Solar Panels */}
      <mesh position={[0.15, 0, 0]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshStandardMaterial color="#1e3a8a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.15, 0, 0]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshStandardMaterial color="#1e3a8a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}