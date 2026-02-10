import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Html, OrbitControls, Trail, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- TYPES ---
interface Coords {
  lat: number;
  lng: number;
}

// --- SHADERS (Optimized for performance) ---
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

// --- COMPONENTS ---

function Satellite() {
  const satRef = useRef<THREE.Group>(null);
  const [isReady, setIsReady] = useState(false);

  // Delay satellite initialization to prioritize Earth rendering
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useFrame(({ clock }) => {
    if (!isReady || !satRef.current) return;
    const t = clock.getElapsedTime() * 0.3; 
    satRef.current.position.x = Math.cos(t) * 5.5;
    satRef.current.position.z = Math.sin(t) * 5.5;
    satRef.current.position.y = Math.cos(t * 0.8) * 2.0;
    satRef.current.lookAt(-3.5, 0, 0); 
  });

  if (!isReady) return null;

  return (
    <group ref={satRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Trail width={0.4} length={4} color={new THREE.Color("#00f3ff")} attenuation={(t) => t * t}>
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.18, 0, 0]}>
            <boxGeometry args={[0.22, 0.01, 0.1]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <mesh position={[-0.18, 0, 0]}>
            <boxGeometry args={[0.22, 0.01, 0.1]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
        </Trail>
      </Float>
    </group>
  );
}

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

function Globe({ coords }: { coords: Coords | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // ⚡ High-performance texture loading
  const [day, night] = useTexture(['/earth_day.jpg', '/earth_night.jpg']);
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
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      
      <Satellite />

      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[3.8, 32, 32]} /> {/* Optimized Segments */}
        <shaderMaterial {...AtmosphereShader} side={THREE.BackSide} transparent />
      </mesh>

      <mesh ref={meshRef}>
        <sphereGeometry args={[3.8, 64, 64]} /> {/* Optimized Segments */}
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

export default function EarthCanvas() {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 40.4237, lng: -86.9212 }) 
      );
    }
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#010206]">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: false }}> {/* Performance Tweak */}
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 11]} />
          <OrbitControls enablePan={false} minDistance={7} maxDistance={15} rotateSpeed={0.5} />
          <Stars radius={100} depth={50} count={3000} factor={4} fade />
          <Globe coords={coords} />
        </Suspense>
      </Canvas>
    </div>
  );
}