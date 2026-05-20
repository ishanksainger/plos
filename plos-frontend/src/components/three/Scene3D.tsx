import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Scene3D
 * ─────────────────────────────────────────────────────────────
 * Generic interactive 3D background used in page heroes. Each
 * variant builds a domain-specific scene; the camera reacts
 * subtly to the mouse for that "this is real depth" feel.
 */

export type Scene3DVariant =
  | 'dashboard'
  | 'finance'
  | 'health'
  | 'habits'
  | 'timeline'
  | 'people'
  | 'responsibilities';

interface Scene3DProps {
  variant: Scene3DVariant;
  /** When true, the canvas captures pointer events for full interactivity. */
  interactive?: boolean;
}

const VARIANT_CONFIG: Record<Scene3DVariant, { primary: string; secondary: string }> = {
  dashboard:        { primary: '#4f7cfa', secondary: '#8b5cf6' },
  finance:          { primary: '#4f7cfa', secondary: '#10b981' },
  health:           { primary: '#10b981', secondary: '#14b8a6' },
  habits:           { primary: '#fb8c00', secondary: '#f59e0b' },
  timeline:         { primary: '#8b5cf6', secondary: '#4f7cfa' },
  people:           { primary: '#f05252', secondary: '#fb8c00' },
  responsibilities: { primary: '#4f7cfa', secondary: '#8b5cf6' },
};

/** Camera that drifts toward the mouse to give parallax depth. */
const MouseParallax = ({ enabled }: { enabled: boolean }) => {
  const { camera, size } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame((_, dt) => {
    if (enabled) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, target.current.x, 2, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, target.current.y, 2, dt);
    } else {
      const t = performance.now() * 0.0003;
      camera.position.x = Math.sin(t) * 0.4;
      camera.position.y = Math.cos(t * 0.7) * 0.25;
    }
    camera.lookAt(0, 0, 0);
  });

  if (!enabled) return null;
  return (
    <mesh
      position={[0, 0, 6]}
      onPointerMove={(e) => {
        const nx = (e.clientX / size.width) * 2 - 1;
        const ny = -(e.clientY / size.height) * 2 + 1;
        target.current.x = nx * 1.2;
        target.current.y = ny * 0.7;
      }}
      visible={false}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

// ─── DASHBOARD: Glowing data orb + orbital rings ─────────────────
const DashboardScene = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const orbRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ringRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];

  const ringPoints = useMemo(() => {
    return [320, 220, 160].map((count, idx) => {
      const radius = 1.65 + idx * 0.45;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2 + Math.random() * 0.05;
        positions[i * 3] = Math.cos(t) * (radius + (Math.random() - 0.5) * 0.16);
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = Math.sin(t) * (radius + (Math.random() - 0.5) * 0.16);
      }
      return positions;
    });
  }, []);

  useFrame((_, dt) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += dt * 0.3;
      orbRef.current.rotation.x += dt * 0.12;
      const s = 1 + Math.sin(performance.now() * 0.0015) * 0.025;
      orbRef.current.scale.setScalar(s);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= dt * 0.5;
      wireRef.current.rotation.z += dt * 0.18;
    }
    if (ringRefs[0].current) ringRefs[0].current.rotation.y += dt * 0.55;
    if (ringRefs[1].current) ringRefs[1].current.rotation.z += dt * 0.35;
    if (ringRefs[2].current) ringRefs[2].current.rotation.y -= dt * 0.25;
  });

  return (
    <group position={[3.2, 0.3, 0]}>
      <pointLight position={[0, 0, 1]} intensity={28} color={primary} distance={12} />
      <pointLight position={[-4, 2, 3]} intensity={8} color={secondary} distance={18} />

      <mesh ref={orbRef}>
        <icosahedronGeometry args={[1, 4]} />
        <meshPhongMaterial color={primary} emissive={primary} emissiveIntensity={0.5} shininess={120} transparent opacity={0.82} />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.02, 2]} />
        <meshBasicMaterial color="#6fa3ff" wireframe transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {[1.25, 1.55, 2, 2.7].map((s, i) => (
        <mesh key={i} scale={s}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={i < 2 ? primary : secondary} side={THREE.BackSide} transparent opacity={[0.2, 0.1, 0.05, 0.02][i]} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}

      {ringPoints.map((pts, i) => (
        <group
          key={i}
          ref={ringRefs[i]}
          rotation={[i === 1 ? Math.PI * 0.28 : i === 2 ? Math.PI * 0.45 : 0, 0, i === 1 ? Math.PI * 0.08 : i === 2 ? Math.PI * 0.15 : 0]}
        >
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[pts, 3]} />
            </bufferGeometry>
            <pointsMaterial color={i === 1 ? secondary : primary} size={0.07 + i * 0.01} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </points>
        </group>
      ))}
    </group>
  );
};

// ─── FINANCE: Floating coins ─────────────────────────────────────
const FinanceScene = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (groupRef.current) groupRef.current.rotation.y += dt * 0.08; });

  const coins = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({
      pos: [(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3 - 1] as [number, number, number],
      color: i % 2 === 0 ? primary : secondary,
      scale: 0.55 + Math.random() * 0.7,
      speed: 1.5 + Math.random() * 2,
    })),
    [primary, secondary],
  );

  return (
    <group ref={groupRef}>
      <pointLight position={[-4, 4, 5]} intensity={22} color={primary} distance={26} />
      <pointLight position={[5, -2, 4]} intensity={10} color={secondary} distance={20} />
      {coins.map((c, i) => (
        <Float key={i} speed={c.speed} rotationIntensity={2.5} floatIntensity={1.5} position={c.pos}>
          <mesh scale={c.scale}>
            <torusGeometry args={[0.5, 0.08, 20, 80]} />
            <meshPhongMaterial color={c.color} emissive={c.color} emissiveIntensity={0.5} shininess={120} transparent opacity={0.88} />
          </mesh>
          <mesh scale={c.scale * 1.04}>
            <torusGeometry args={[0.5, 0.08, 12, 40]} />
            <meshBasicMaterial color={c.color} wireframe transparent opacity={0.18} />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

// ─── HEALTH: DNA double helix ───────────────────────────────────
const HealthScene = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (groupRef.current) groupRef.current.rotation.y += dt * 0.5; });

  const { pos1, pos2, crossPts } = useMemo(() => {
    const TURNS = 5; const STEPS = 50; const TOTAL = TURNS * STEPS;
    const R = 1.3; const H = 7;
    const p1 = new Float32Array(TOTAL * 3);
    const p2 = new Float32Array(TOTAL * 3);
    const cross: THREE.Vector3[] = [];
    for (let i = 0; i < TOTAL; i++) {
      const t = (i / TOTAL) * Math.PI * 2 * TURNS;
      const y = (i / TOTAL) * H - H / 2;
      p1[i * 3] = R * Math.cos(t); p1[i * 3 + 1] = y; p1[i * 3 + 2] = R * Math.sin(t);
      p2[i * 3] = R * Math.cos(t + Math.PI); p2[i * 3 + 1] = y; p2[i * 3 + 2] = R * Math.sin(t + Math.PI);
      if (i % 8 === 0) {
        cross.push(
          new THREE.Vector3(p1[i * 3], y, p1[i * 3 + 2]),
          new THREE.Vector3(p2[i * 3], y, p2[i * 3 + 2]),
        );
      }
    }
    return { pos1: p1, pos2: p2, crossPts: cross };
  }, []);

  const crossGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(crossPts), [crossPts]);

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0, 5]} intensity={20} color={primary} distance={18} />
      {[pos1, pos2].map((pos, i) => (
        <points key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pos, 3]} />
          </bufferGeometry>
          <pointsMaterial color={i === 0 ? primary : secondary} size={0.1} transparent opacity={0.95} />
        </points>
      ))}
      <lineSegments geometry={crossGeom}>
        <lineBasicMaterial color={primary} transparent opacity={0.25} />
      </lineSegments>
    </group>
  );
};

// ─── HABITS: Torus knot + orbiting toruses ──────────────────────
const HabitsScene = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const knotRef = useRef<THREE.Mesh>(null);
  const orbitsRef = useRef<{ ref: THREE.Mesh; angle: number; radius: number; speed: number }[]>([]);

  const orbits = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({
      angle: (i / 5) * Math.PI * 2,
      radius: 2.4 + i * 0.3,
      speed: 0.8 + i * 0.25,
    })),
    [],
  );

  useFrame((_, dt) => {
    if (knotRef.current) {
      knotRef.current.rotation.x += dt * 0.4;
      knotRef.current.rotation.y += dt * 0.6;
    }
    orbitsRef.current.forEach((o, i) => {
      orbits[i].angle += dt * orbits[i].speed;
      const a = orbits[i].angle;
      o.ref.position.x = orbits[i].radius * Math.cos(a);
      o.ref.position.z = orbits[i].radius * Math.sin(a);
      o.ref.rotation.y += dt * 1.5;
    });
  });

  return (
    <group>
      <pointLight position={[4, 4, 5]} intensity={18} color={primary} distance={20} />
      <pointLight position={[-3, -2, 3]} intensity={10} color={secondary} distance={15} />
      <mesh ref={knotRef}>
        <torusKnotGeometry args={[1.6, 0.33, 128, 16, 2, 3]} />
        <meshPhongMaterial color={primary} emissive={primary} emissiveIntensity={0.4} shininess={80} transparent opacity={0.7} />
      </mesh>
      <mesh>
        <torusKnotGeometry args={[1.6, 0.33, 64, 8, 2, 3]} />
        <meshBasicMaterial color={primary} wireframe transparent opacity={0.18} />
      </mesh>
      {orbits.map((_, i) => (
        <mesh
          key={i}
          ref={(r) => {
            if (r) orbitsRef.current[i] = { ref: r, ...orbits[i] };
          }}
          position={[orbits[i].radius * Math.cos(orbits[i].angle), (Math.random() - 0.5) * 2, orbits[i].radius * Math.sin(orbits[i].angle)]}
        >
          <torusGeometry args={[0.22, 0.05, 8, 32]} />
          <meshPhongMaterial color={secondary} emissive={secondary} emissiveIntensity={0.7} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
};

// ─── TIMELINE: Glowing helix path ───────────────────────────────
const TimelineScene = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (groupRef.current) groupRef.current.rotation.y += dt * 0.3; });

  const { positions, colors } = useMemo(() => {
    const N = 400; const TURNS = 4;
    const p = new Float32Array(N * 3);
    const c = new Float32Array(N * 3);
    const c1 = new THREE.Color(primary);
    const c2 = new THREE.Color(secondary);
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2 * TURNS;
      const r = 1.8 + Math.sin(t * 0.4) * 0.25;
      p[i * 3] = r * Math.cos(t);
      p[i * 3 + 1] = (i / N) * 8 - 4;
      p[i * 3 + 2] = r * Math.sin(t);
      const mc = c1.clone().lerp(c2, i / N);
      c[i * 3] = mc.r; c[i * 3 + 1] = mc.g; c[i * 3 + 2] = mc.b;
    }
    return { positions: p, colors: c };
  }, [primary, secondary]);

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0, 5]} intensity={18} color={primary} distance={20} />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.075} vertexColors transparent opacity={0.95} />
      </points>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={primary} transparent opacity={0.2} />
      </line>
    </group>
  );
};

// ─── PEOPLE: Social graph nodes ─────────────────────────────────
const PeopleScene = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.25;
      groupRef.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.1;
    }
  });

  const nodePos: [number, number, number][] = [
    [0, 0, 0], [2.8, 1.2, 0.5], [-2.2, 1.5, -0.5],
    [1.5, -2.2, 1], [-1.8, -1.5, 0.5], [3.8, -0.5, -0.5],
    [-3.2, 0.5, 0.5], [0, 2.8, -0.5], [0.5, -3.2, 0], [-2, 2.5, 1],
  ];

  const lines = useMemo(() => {
    const segments: THREE.Vector3[] = [];
    const T = 3.5;
    for (let i = 0; i < nodePos.length; i++) {
      for (let j = i + 1; j < nodePos.length; j++) {
        const a = new THREE.Vector3(...nodePos[i]);
        const b = new THREE.Vector3(...nodePos[j]);
        if (a.distanceTo(b) < T) segments.push(a, b);
      }
    }
    return new THREE.BufferGeometry().setFromPoints(segments);
  }, []);

  return (
    <group ref={groupRef}>
      <pointLight position={[3, 4, 5]} intensity={18} color={primary} distance={20} />
      <pointLight position={[-4, -2, 4]} intensity={10} color={secondary} distance={15} />
      {nodePos.map((p, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.6} position={p}>
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshPhongMaterial color={i % 2 === 0 ? primary : secondary} emissive={i % 2 === 0 ? primary : secondary} emissiveIntensity={0.7} transparent opacity={0.92} />
          </mesh>
        </Float>
      ))}
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={primary} transparent opacity={0.22} />
      </lineSegments>
    </group>
  );
};

// ─── RESPONSIBILITIES: Floating wireframe cubes ──────────────────
const ResponsibilitiesScene = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const cubes = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      pos: [(Math.random() - 0.5) * 13, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3 - 1] as [number, number, number],
      scale: 0.5 + Math.random() * 1,
      color: i % 2 === 0 ? primary : secondary,
    })),
    [primary, secondary],
  );

  return (
    <group>
      <pointLight position={[4, 4, 5]} intensity={18} color={primary} distance={26} />
      <pointLight position={[-3, -2, 4]} intensity={10} color={secondary} distance={18} />
      {cubes.map((c, i) => (
        <Float key={i} speed={1.5} rotationIntensity={2} floatIntensity={1} position={c.pos}>
          <mesh scale={c.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhongMaterial color={c.color} emissive={c.color} emissiveIntensity={0.15} transparent opacity={0.15} />
          </mesh>
          <mesh scale={c.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={c.color} wireframe transparent opacity={0.55} />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const SCENES: Record<Scene3DVariant, React.FC<{ primary: string; secondary: string }>> = {
  dashboard: DashboardScene,
  finance: FinanceScene,
  health: HealthScene,
  habits: HabitsScene,
  timeline: TimelineScene,
  people: PeopleScene,
  responsibilities: ResponsibilitiesScene,
};

const Scene3D = ({ variant, interactive = true }: Scene3DProps) => {
  const cfg = VARIANT_CONFIG[variant];
  const Variant = SCENES[variant];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} color="#0a0e20" />
        <Stars radius={50} depth={20} count={1200} factor={3} saturation={0.6} fade speed={0.4} />
        <MouseParallax enabled={interactive} />
        <Variant primary={cfg.primary} secondary={cfg.secondary} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
