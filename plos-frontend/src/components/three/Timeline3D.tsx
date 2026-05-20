import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Timeline3D
 * ─────────────────────────────────────────────────────────────
 * A vertical glowing helix where each turn represents a slice
 * of recent time. Each event is a marker sphere placed along
 * the helix; color encodes the destination state. Hover to
 * see the event title.
 */

export interface TimelineEvent {
  id: number;
  title: string;
  toState: string;
  occurredAt: string;
  category: string;
}

interface Timeline3DProps {
  events: TimelineEvent[];
  /** Called when a marker is clicked. */
  onSelect?: (id: number) => void;
}

const STATE_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  DUE:       '#fb8c00',
  OVERDUE:   '#f05252',
  UPCOMING:  '#4f7cfa',
};

const HelixPath = () => {
  const N = 600;
  const TURNS = 5;
  const HEIGHT = 9;
  const RADIUS = 1.6;

  const { positions, colors } = useMemo(() => {
    const p = new Float32Array(N * 3);
    const c = new Float32Array(N * 3);
    const c1 = new THREE.Color('#8b5cf6');
    const c2 = new THREE.Color('#4f7cfa');
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2 * TURNS;
      const r = RADIUS + Math.sin(t * 0.4) * 0.1;
      p[i * 3] = Math.cos(t) * r;
      p[i * 3 + 1] = (i / N) * HEIGHT - HEIGHT / 2;
      p[i * 3 + 2] = Math.sin(t) * r;
      const mc = c1.clone().lerp(c2, i / N);
      c[i * 3] = mc.r; c[i * 3 + 1] = mc.g; c[i * 3 + 2] = mc.b;
    }
    return { positions: p, colors: c };
  }, []);

  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#4f7cfa" transparent opacity={0.18} />
      </line>
    </>
  );
};

const EventMarker = ({
  event, position, hovered, onHover, onSelect,
}: {
  event: TimelineEvent;
  position: [number, number, number];
  hovered: boolean;
  onHover: (v: boolean) => void;
  onSelect: () => void;
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const color = STATE_COLORS[event.toState] ?? STATE_COLORS.UPCOMING;
  const c = new THREE.Color(color);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = hovered ? 1.6 : 1;
    const cur = ref.current.scale.x;
    const next = THREE.MathUtils.damp(cur, target, 9, dt);
    ref.current.scale.setScalar(next);
  });

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={hovered ? 1.8 : 0.8}
          metalness={0.2}
          roughness={0.3}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* Soft glow ring */}
      <mesh>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color={c} transparent opacity={hovered ? 0.18 : 0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {hovered && (
        <Text
          position={[0.35, 0, 0]}
          fontSize={0.15}
          color="#dde3f0"
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#0c0e14"
          maxWidth={3.5}
        >
          {event.title}
        </Text>
      )}
    </group>
  );
};

const Helix = ({ events, onSelect }: Timeline3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const TURNS = 5;
  const HEIGHT = 9;
  const RADIUS = 1.6;

  const positioned = useMemo(() => {
    if (!events.length) return [];
    return events.map((evt, i) => {
      const ratio = i / Math.max(events.length - 1, 1);
      const t = ratio * Math.PI * 2 * TURNS;
      const r = RADIUS + Math.sin(t * 0.4) * 0.1;
      const pos: [number, number, number] = [
        Math.cos(t) * r,
        ratio * HEIGHT - HEIGHT / 2,
        Math.sin(t) * r,
      ];
      return { evt, pos };
    });
  }, [events]);

  useFrame((_, dt) => {
    if (groupRef.current && hoverIdx === null) {
      groupRef.current.rotation.y += dt * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      <HelixPath />
      {positioned.map(({ evt, pos }, i) => (
        <EventMarker
          key={evt.id}
          event={evt}
          position={pos}
          hovered={hoverIdx === i}
          onHover={(v) => setHoverIdx(v ? i : (cur) => (cur === i ? null : cur))}
          onSelect={() => onSelect?.(evt.id)}
        />
      ))}
    </group>
  );
};

const Timeline3D = ({ events, onSelect }: Timeline3DProps) => (
  <Canvas
    camera={{ position: [0, 0, 7], fov: 46 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
    dpr={[1, 1.5]}
    style={{ width: '100%', height: '100%' }}
  >
    <ambientLight intensity={0.45} color="#0a0e20" />
    <pointLight position={[3, 4, 5]} intensity={22} color="#8b5cf6" distance={20} />
    <pointLight position={[-3, -4, 4]} intensity={14} color="#4f7cfa" distance={18} />

    <Helix events={events} onSelect={onSelect} />

    <OrbitControls
      enablePan={false}
      enableZoom={false}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 1.6}
    />
  </Canvas>
);

export default Timeline3D;
