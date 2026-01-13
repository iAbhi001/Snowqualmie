import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 1. DEFINE TYPES: This stops the "implicit any" errors
interface Coords {
  lat: number;
  lng: number;
}

const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
      gl_FragColor = vec4(0.2, 0.5, 1.0, 1.0) * intensity;
    }
  `
};

const EarthShader = {
  uniforms: {
    uDayTexture: { value: null },
    uNightTexture: { value: null },
    uSunDirection: { value: new THREE.Vector3() },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uDayTexture;
    uniform sampler2D uNightTexture;
    uniform vec3 uSunDirection;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
      vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
      float intensity = dot(vNormal, uSunDirection);
      
      vec3 dayBlue = dayColor * vec3(0.95, 1.0, 1.2); 
      vec3 finalColor = mix(nightColor, dayBlue, smoothstep(-0.25, 0.25, intensity));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// 2. TYPE THE PROPS: Fixes Globe component errors
function Globe({ coords }: { coords: Coords | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [day, night] = useLoader(THREE.TextureLoader, ['/earth_day.jpg', '/earth_night.jpg']);
  
  day.colorSpace = night.colorSpace = THREE.SRGBColorSpace;

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });

  const uniforms = useMemo(() => {
    const hour = new Date().getHours();
    const angle = (hour / 24) * Math.PI * 2 + Math.PI;
    return {
      uDayTexture: { value: day },
      uNightTexture: { value: night },
      uSunDirection: { value: new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize() }
    };
  }, [day, night]);

  return (
    <group position={[-3.5, 0, 0]} rotation={[0.41, 0, 0]}>
      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[3.8, 64, 64]} />
        <shaderMaterial {...AtmosphereShader} side={THREE.BackSide} transparent />
      </mesh>

      <mesh ref={meshRef}>
        <sphereGeometry args={[3.8, 128, 128]} />
        <shaderMaterial 
          fragmentShader={EarthShader.fragmentShader} 
          vertexShader={EarthShader.vertexShader} 
          uniforms={uniforms} 
        />
        {coords && <UserMarker lat={coords.lat} lon={coords.lng} />}
      </mesh>
    </group>
  );
}

// 3. TYPE THE MARKER: Ensures lat/lon are recognized as numbers
function UserMarker({ lat, lon }: { lat: number, lon: number }) {
  const position = useMemo(() => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const r = 3.82; 
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  }, [lat, lon]);

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color="#00f3ff" />
      <Html distanceFactor={10}>
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping border border-white shadow-[0_0_10px_cyan]" />
      </Html>
    </mesh>
  );
}

export default function EarthCanvas() {
  // 4. TYPE THE STATE: Fixes setCoords errors
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 41.0, lng: -85.0 }) 
      );
    }
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#010206]">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <OrbitControls enablePan={false} minDistance={7} maxDistance={13} rotateSpeed={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} fade />
        <Globe coords={coords} />
      </Canvas>
    </div>
  );
}