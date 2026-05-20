import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Float, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * RelationshipGraph3D
 * ─────────────────────────────────────────────────────────────
 * Each person is a glowing sphere orbiting a central "self" node.
 * Sphere size scales with responsibility count; relation type
 * picks the hue. Hover to highlight + show name tag, click to
 * select.
 */

const RELATION_COLORS: Record<string, string> = {
  self:    '#7c4dff',
  father:  '#fb923c',
  mother:  '#ea580c',
  partner: '#fdba74',
  child:   '#fdba74',
  sibling: '#c2410c',
  other:   '#9a3412',
};

export interface GraphPerson {
  id: number;
  name: string;
  relation: string;
  count: number;
}

interface RelationshipGraph3DProps {
  people: GraphPerson[];
  onSelect?: (id: number) => void;
  selectedId?: number | null;
}

/** Single rotating + floating person node. */
const PersonNode = ({
  person, position, hovered, selected, onHover, onSelect,
}: {
  person: GraphPerson;
  position: [number, number, number];
  hovered: boolean;
  selected: boolean;
  onHover: (v: boolean) => void;
  onSelect: () => void;
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const color = RELATION_COLORS[person.relation] ?? RELATION_COLORS.other;
  const c = new THREE.Color(color);

  const baseScale = 0.32 + Math.min(person.count, 12) * 0.05;
  const target = useRef(baseScale);
  target.current = (hovered || selected ? 1.25 : 1) * baseScale;

  useFrame((_, dt) => {
    if (!ref.current) return;
    const cur = ref.current.scale.x;
    const next = THREE.MathUtils.damp(cur, target.current, 8, dt);
    ref.current.scale.setScalar(next);
    ref.current.rotation.y += dt * 0.6;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6} position={position}>
      <group>
        <mesh
          ref={ref}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
          onPointerOut={() => onHover(false)}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={hovered || selected ? 1.5 : 0.7}
            metalness={0.3}
            roughness={0.4}
            transparent
            opacity={0.92}
          />
        </mesh>
        {/* Wireframe halo */}
        <mesh scale={baseScale * 1.18}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={c} wireframe transparent opacity={0.25} />
        </mesh>
        {/* Floating name tag */}
        <Text
          position={[0, baseScale * 1.4, 0]}
          fontSize={0.18}
          color={hovered || selected ? '#dde3f0' : '#7e8fa3'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#0c0e14"
        >
          {person.name}
        </Text>
        <Text
          position={[0, baseScale * 1.4 - 0.22, 0]}
          fontSize={0.12}
          color={person.relation === 'self' ? '#1a0a04' : `#${c.getHexString()}`}
          anchorX="center"
          anchorY="middle"
        >
          {`${person.relation.toUpperCase()} · ${person.count}`}
        </Text>
      </group>
    </Float>
  );
};

const Graph = ({ people, onSelect, selectedId }: RelationshipGraph3DProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Place "self" at center if present, others on a tilted ring.
  const positions: [number, number, number][] = useMemo(() => {
    return people.map((p, i, arr) => {
      if (p.relation === 'self') return [0, 0, 0];
      const others = arr.filter((x) => x.relation !== 'self');
      const idx = others.indexOf(p);
      const total = Math.max(others.length, 1);
      const angle = (idx / total) * Math.PI * 2;
      const radius = 3 + (i % 2) * 0.4;
      return [Math.cos(angle) * radius, Math.sin(angle * 1.2) * 0.6, Math.sin(angle) * radius];
    });
  }, [people]);

  const lineGeom = useMemo(() => {
    const segs: THREE.Vector3[] = [];
    const selfIdx = people.findIndex((p) => p.relation === 'self');
    if (selfIdx === -1) return new THREE.BufferGeometry();
    const center = new THREE.Vector3(...positions[selfIdx]);
    positions.forEach((p, i) => {
      if (i === selfIdx) return;
      segs.push(center, new THREE.Vector3(...p));
    });
    return new THREE.BufferGeometry().setFromPoints(segs);
  }, [people, positions]);

  useFrame((_, dt) => {
    if (groupRef.current && hoveredIdx === null && selectedId == null) {
      groupRef.current.rotation.y += dt * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      {people.map((p, i) => (
        <PersonNode
          key={p.id}
          person={p}
          position={positions[i]}
          hovered={hoveredIdx === i}
          selected={selectedId === p.id}
          onHover={(v) => setHoveredIdx(v ? i : (cur) => (cur === i ? null : cur))}
          onSelect={() => onSelect?.(p.id)}
        />
      ))}
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#7c4dff" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
};

const RelationshipGraph3D = ({ people, onSelect, selectedId }: RelationshipGraph3DProps) => {
  if (!people.length) return null;
  return (
    <Canvas
      camera={{ position: [0, 1.5, 7.5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.45} color="#120a06" />
      <pointLight position={[3, 4, 5]} intensity={32} color="#7c4dff" distance={20} />
      <pointLight position={[-3, -2, 4]} intensity={16} color="#fb923c" distance={16} />

      <Graph people={people} onSelect={onSelect} selectedId={selectedId} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
};

export default RelationshipGraph3D;
