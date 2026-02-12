import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Html, OrbitControls, Trail, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- TYPES ---
interface Coords {
  lat: number;
  lng: number;
}

// --- SHADERS ---
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

// --- COMPONENTS ---

/**
 * 🌌 REALISTIC MULTI-COLORED GALAXY
 */
function Galaxy() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 12000;
  const radius = 35; 
  const branches = 3;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new THREE.Color("#ffaa60");
    const colorOutside = new THREE.Color("#1b3984");

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * 0.15;

      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * r;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * r;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * r;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
      positions[i3 + 1] = randomY - 2;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

      const mixedColor = colorInside.clone().lerp(colorOutside, r / radius);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }
    return [positions, colors];
  }, []);

  useFrame(() => {
    if (pointsRef.current) pointsRef.current.rotation.y += 0.0003;
  });

  return (
    <points ref={pointsRef} position={[5, 0, -25]} rotation={[0.4, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.12} 
        vertexColors 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
      />
    </points>
  );
}

/**
 * 🛸 HIGH-SPEED INTERCEPTOR (Spaceship)
 */
function Interceptor({ speed = 1, color = "#ff3e3e", offset = 0 }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (meshRef.current) {
      // Large elliptical path in the cosmic background
      meshRef.current.position.set(
        Math.cos(t * 0.5) * 22,
        Math.sin(t * 0.3) * 12,
        Math.sin(t * 0.5) * -18
      );
      meshRef.current.lookAt(0, 0, 0);
      meshRef.current.rotateY(Math.PI / 2);
    }
  });

  return (
    <group ref={meshRef}>
      <Trail width={0.6} length={10} color={new THREE.Color(color)} attenuation={(t) => t * t}>
        <mesh>
          <coneGeometry args={[0.06, 0.25, 3]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Trail>
      <pointLight distance={3} intensity={5} color={color} />
    </group>
  );
}

/**
 * ✈️ SUB-ORBITAL TRAFFIC (Planes/High-Altitude Craft)
 */
function SubOrbitalTraffic({ count = 20 }) {
  const groupRef = useRef<THREE.Group>(null);

  const flights = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      orbitSpeed: 0.05 + Math.random() * 0.15,
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      radius: 3.9 + Math.random() * 0.2, // Just above surface
      color: Math.random() > 0.6 ? "#ffffff" : "#00f3ff"
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groupRef.current?.children.forEach((child, i) => {
      const f = flights[i];
      const angle = t * f.orbitSpeed + i * 50;
      const q = new THREE.Quaternion().setFromAxisAngle(f.axis, angle);
      const pos = new THREE.Vector3(f.radius, 0, 0).applyQuaternion(q);
      child.position.copy(pos);
    });
  });

  return (
    <group ref={groupRef}>
      {flights.map((f, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color={f.color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 🛰️ ORBITAL SATELLITE
 */
function Satellite() {
  const satRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.4;
    if (satRef.current) {
      satRef.current.position.set(Math.cos(t) * 5.2, Math.sin(t) * 2, Math.sin(t) * 5.2);
      satRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={satRef}>
      <Float speed={2} rotationIntensity={0.5}>
        <Trail width={0.4} length={4} color={new THREE.Color("#00f3ff")}>
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={2} />
          </mesh>
        </Trail>
      </Float>
    </group>
  );
}

/**
 * 📍 USER GEOLOCATION MARKER
 */
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

/**
 * 🌍 MAIN GLOBE COMPONENT
 */
function Globe({ coords }: { coords: Coords | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [day, night] = useTexture(['/earth_day.jpg', '/earth_night.jpg']);
  day.colorSpace = night.colorSpace = THREE.SRGBColorSpace;

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0012;
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
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <Satellite />
      <SubOrbitalTraffic count={25} />
      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[3.8, 32, 32]} />
        <shaderMaterial {...AtmosphereShader} side={THREE.BackSide} transparent />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[3.8, 64, 64]} />
        <shaderMaterial fragmentShader={EarthShader.fragmentShader} vertexShader={EarthShader.vertexShader} uniforms={uniforms} />
        {coords && <UserMarker lat={coords.lat} lon={coords.lng} />}
      </mesh>
    </>
  );
}

/**
 * 💎 ROOT CANVAS
 */
export default function EarthCanvas() {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 40.4237, lng: -86.9212 }) // Purdue fallback
      );
    }
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#010206]">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: false }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 11]} />
          <OrbitControls enablePan={false} minDistance={7} maxDistance={15} />
          <Stars radius={100} depth={50} count={3000} factor={4} fade />
          
          <Galaxy />
          
          {/* Background Interceptors */}
          <Interceptor speed={0.7} color="#00f3ff" offset={0} />
          <Interceptor speed={0.5} color="#ff3e3e" offset={Math.PI} />

          {/* Grouped Earth Elements */}
          <group position={[-3.5, 0, 0]} rotation={[0.41, 0, 0]}>
            <Globe coords={coords} />
          </group>
          
        </Suspense>
      </Canvas>
    </div>
  );
}