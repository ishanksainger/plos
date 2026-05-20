import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
/**
 * Pie3DChart
 * ─────────────────────────────────────────────────────────────
 * A chunky 3D donut chart built from extruded annular sectors.
 *
 *   • Lying down (~30° tilt) so depth reads instantly.
 *   • Slow auto-rotate when idle, freezes on hover.
 *   • Hovered slice pops outward + brightens emissive.
 *   • Center label is anchored to a billboard so it always faces
 *     the camera and never gets clipped by the donut surface.
 *   • Text + lighting tuned for the light UI.
 */

export interface Pie3DDatum {
  label: string;
  value: number;
  color: string;
}

interface Pie3DChartProps {
  data: Pie3DDatum[];
  innerRadius?: number;
  outerRadius?: number;
  thickness?: number;
}

interface SliceProps {
  startAngle: number;
  endAngle: number;
  inner: number;
  outer: number;
  thickness: number;
  color: string;
  hovered: boolean;
  midAngle: number;
  isSingle: boolean;
  onHover: (v: boolean) => void;
}

const Slice = ({
  startAngle, endAngle, inner, outer, thickness, color, hovered, midAngle, isSingle, onHover,
}: SliceProps) => {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const segs = Math.max(24, Math.floor((endAngle - startAngle) * 32));

    shape.moveTo(Math.cos(startAngle) * inner, Math.sin(startAngle) * inner);
    for (let i = 0; i <= segs; i++) {
      const a = startAngle + ((endAngle - startAngle) * i) / segs;
      shape.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    }
    for (let i = segs; i >= 0; i--) {
      const a = startAngle + ((endAngle - startAngle) * i) / segs;
      shape.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
    }

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      curveSegments: 32,
    });
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, thickness, 0);
    return geom;
  }, [startAngle, endAngle, inner, outer, thickness]);

  const dx = Math.cos(midAngle);
  const dz = Math.sin(midAngle);
  const target = useRef(0);
  target.current = hovered ? 0.22 : 0;

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const cur = groupRef.current.position;
    cur.x = THREE.MathUtils.damp(cur.x, dx * target.current, 10, dt);
    cur.z = THREE.MathUtils.damp(cur.z, dz * target.current, 10, dt);
    cur.y = THREE.MathUtils.damp(cur.y, hovered ? 0.06 : 0, 10, dt);
  });

  const c = new THREE.Color(color);
  // Single-slice donuts always glow a bit more so they don't look like 2D rings.
  const baseEmissive = isSingle ? 0.7 : 0.55;

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={hovered ? 1.5 : baseEmissive}
          metalness={0.32}
          roughness={0.38}
        />
      </mesh>
    </group>
  );
};

interface DonutProps extends Required<Pie3DChartProps> {
  centerColor: string;
  centerSubColor: string;
  outlineColor: string;
}

const Donut = ({
  data, innerRadius, outerRadius, thickness,
  centerColor, centerSubColor, outlineColor,
}: DonutProps) => {
  const tiltRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const isSingle = data.length === 1;

  useFrame((_, dt) => {
    if (spinRef.current && hoveredIdx === null) {
      spinRef.current.rotation.y += dt * 0.18;
    }
  });

  let acc = 0;
  return (
    <group ref={tiltRef} rotation={[-Math.PI / 3, 0, 0]}>
      <group ref={spinRef}>
        {data.map((d, i) => {
          const startA = (acc / total) * Math.PI * 2;
          acc += d.value;
          const endA = (acc / total) * Math.PI * 2;
          const midA = (startA + endA) / 2;
          return (
            <Slice
              key={d.label + i}
              startAngle={startA}
              endAngle={endA}
              midAngle={midA}
              inner={innerRadius}
              outer={outerRadius}
              thickness={thickness}
              color={d.color}
              hovered={hoveredIdx === i}
              isSingle={isSingle}
              onHover={(v) => setHoveredIdx(v ? i : (cur) => (cur === i ? null : cur))}
            />
          );
        })}
      </group>

      {/* Center billboard — counter-rotated so it always faces the camera */}
      <group rotation={[Math.PI / 3, 0, 0]} position={[0, thickness + 0.05, 0]}>
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.5}
          color={centerColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.014}
          outlineColor={outlineColor}
          fontWeight={700}
        >
          {hoveredIdx === null ? String(total) : String(data[hoveredIdx].value)}
        </Text>
        <Text
          position={[0, -0.24, 0]}
          fontSize={0.16}
          color={centerSubColor}
          anchorX="center"
          anchorY="middle"
        >
          {hoveredIdx === null ? 'TOTAL' : data[hoveredIdx].label.toUpperCase()}
        </Text>
      </group>
    </group>
  );
};

const Pie3DChart = ({
  data,
  innerRadius = 0.95,
  outerRadius = 1.55,
  thickness = 0.5,
}: Pie3DChartProps) => {
  const safe = data.length ? data : [{ label: 'empty', value: 1, color: '#cfd5e3' }];

  const ambient = 0.85;
  const ambientColor = '#f6f8fc';
  const keyLight = 22;
  const fillLight = 12;

  const centerColor = '#1a1f2e';
  const centerSubColor = '#7a8499';
  const outlineColor = '#ffffff';

  return (
    <Canvas
      camera={{ position: [0, 2.2, 3.8], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={ambient} color={ambientColor} />
      <directionalLight position={[3, 6, 4]} intensity={0.8} color="#ffffff" />
      <pointLight position={[3, 5, 3]} intensity={keyLight} color="#4f7cfa" distance={22} />
      <pointLight position={[-3, 3, -2]} intensity={fillLight} color="#8b5cf6" distance={18} />

      <Donut
        data={safe}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        thickness={thickness}
        centerColor={centerColor}
        centerSubColor={centerSubColor}
        outlineColor={outlineColor}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.6}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-Math.PI / 7}
        maxAzimuthAngle={Math.PI / 7}
      />
    </Canvas>
  );
};

export default Pie3DChart;
