import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
/**
 * Bar3DChart
 * ─────────────────────────────────────────────────────────────
 * A polished isometric WebGL 3D bar chart.
 *
 *   • Bars are real boxes (depth + lighting + emissive glow).
 *   • Camera locked to a comfortable isometric angle so they
 *     never collapse into ribbons.
 *   • Zero-value columns leave a flat marker so the time axis
 *     stays continuous instead of disappearing.
 *   • Non-zero values get a minimum visible height so a single
 *     dominant bar doesn't make the rest invisible.
 *   • Floor grid + back wall + tick lines colored from the
 *     active palette for the light UI.
 */

export interface Bar3DDatum {
  label: string;
  value: number;
}

interface Bar3DChartProps {
  data: Bar3DDatum[];
  color?: string;
  format?: (n: number) => string;
  unitLabel?: string;
}

interface BarProps {
  height: number;
  color: string;
  hovered: boolean;
  onHover: (hovered: boolean) => void;
}

const BAR_WIDTH = 0.78;
const BAR_DEPTH = 0.78;
const BAR_GAP = 0.45;
const MAX_BAR_HEIGHT = 3;
const MIN_VISIBLE_HEIGHT = 0.18;

const Bar = ({ height, color, hovered, onHover }: BarProps) => {
  const ref = useRef<THREE.Mesh>(null);
  const targetH = useRef(height);
  targetH.current = height;

  useFrame((_, dt) => {
    if (!ref.current) return;
    const next = THREE.MathUtils.damp(ref.current.scale.y, Math.max(0.0001, targetH.current), 8, dt);
    ref.current.scale.y = next;
    ref.current.position.y = next / 2;
  });

  const c = new THREE.Color(color);
  const emissive = hovered ? 1.6 : 0.5;

  return (
    <group>
      <RoundedBox
        ref={ref as unknown as React.MutableRefObject<THREE.Mesh>}
        args={[BAR_WIDTH, 1, BAR_DEPTH]}
        radius={0.06}
        smoothness={3}
        scale={[1, 0.0001, 1]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
      >
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={emissive}
          metalness={0.25}
          roughness={0.32}
        />
      </RoundedBox>
      {/* Bottom glow disk */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
        <circleGeometry args={[BAR_WIDTH * 0.7, 32]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={hovered ? 0.34 : 0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

const ZeroMarker = ({ color }: { color: string }) => (
  <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
    <circleGeometry args={[BAR_WIDTH * 0.4, 24]} />
    <meshBasicMaterial color={color} transparent opacity={0.35} />
  </mesh>
);

interface FloorProps {
  width: number;
  depth: number;
  gridColor: string;
  centerLineColor: string;
  floorColor: string;
}

const Floor = ({ width, depth, gridColor, centerLineColor, floorColor }: FloorProps) => (
  <group position={[0, 0, 0]}>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={floorColor} roughness={0.95} metalness={0.05} />
    </mesh>
    <gridHelper args={[Math.max(width, depth), 14, centerLineColor, gridColor]} position={[0, 0, 0]} />
  </group>
);

interface BarsProps {
  data: Bar3DDatum[];
  color: string;
  format: (n: number) => string;
  unitLabel: string;
  textColor: string;
  textColorMuted: string;
  textColorStrong: string;
  outlineColor: string;
  zeroMarkerColor: string;
}

const Bars = ({
  data, color, format, unitLabel,
  textColor, textColorMuted, textColorStrong, outlineColor, zeroMarkerColor,
}: BarsProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.value));
  const stride = BAR_WIDTH + BAR_GAP;
  const span = (data.length - 1) * stride;

  return (
    <group position={[-span / 2, 0, 0]}>
      {data.map((d, i) => {
        const isZero = d.value <= 0;
        const ratio = d.value / max;
        const h = isZero ? 0 : Math.max(MIN_VISIBLE_HEIGHT, ratio * MAX_BAR_HEIGHT);

        return (
          <group key={`${d.label}-${i}`} position={[i * stride, 0, 0]}>
            {isZero ? (
              <ZeroMarker color={zeroMarkerColor} />
            ) : (
              <Bar
                height={h}
                color={color}
                hovered={hoverIdx === i}
                onHover={(v) => setHoverIdx(v ? i : (cur) => (cur === i ? null : cur))}
              />
            )}

            {/* Always-visible label below the bar, on the floor */}
            <Text
              position={[0, 0.04, BAR_DEPTH / 2 + 0.42]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.24}
              color={hoverIdx === i ? textColorStrong : textColorMuted}
              anchorX="center"
              anchorY="middle"
              outlineWidth={hoverIdx === i ? 0.008 : 0}
              outlineColor={outlineColor}
            >
              {d.label}
            </Text>

            {/* Always-visible value above non-zero bars */}
            {!isZero && (
              <Text
                position={[0, h + 0.32, 0]}
                fontSize={hoverIdx === i ? 0.3 : 0.22}
                color={hoverIdx === i ? textColorStrong : textColor}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.012}
                outlineColor={outlineColor}
              >
                {format(d.value)}
              </Text>
            )}
          </group>
        );
      })}

      {/* Y-axis max-tick reference at the back */}
      <group position={[-stride / 2 - 0.1, 0, 0]}>
        <mesh position={[0, MAX_BAR_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.012, MAX_BAR_HEIGHT, 0.012]} />
          <meshBasicMaterial color={textColorMuted} transparent opacity={0.35} />
        </mesh>
        <Text
          position={[-0.18, MAX_BAR_HEIGHT, 0]}
          fontSize={0.2}
          color={textColorMuted}
          anchorX="right"
          anchorY="middle"
        >
          {`${format(max)}${unitLabel ? ` ${unitLabel}` : ''}`}
        </Text>
        <Text
          position={[-0.18, 0, 0]}
          fontSize={0.2}
          color={textColorMuted}
          anchorX="right"
          anchorY="middle"
        >
          0
        </Text>
      </group>
    </group>
  );
};

const Bar3DChart = ({
  data,
  color = '#4f7cfa',
  format = (n) => String(n),
  unitLabel = '',
}: Bar3DChartProps) => {
  const safe = useMemo(
    () => (data.length ? data : [{ label: '—', value: 0 }]),
    [data],
  );

  const ambientColor = '#f6f8fc';
  const ambientIntensity = 0.85;
  const fillLight = '#5a7d68';
  const fillIntensity = 14;

  const gridColor = '#cfd5e3';
  const centerLineColor = '#9aa3b8';
  const floorColor = '#eef2f9';

  const textColorStrong = '#1a1f2e';
  const textColor = '#2a3142';
  const textColorMuted = '#7a8499';
  const outlineColor = '#ffffff';
  const zeroMarkerColor = '#c4cdde';

  const span = (safe.length - 1) * (BAR_WIDTH + BAR_GAP);
  const floorWidth = Math.max(span + 4, 8);
  const floorDepth = Math.max(BAR_DEPTH * 4, 5);

  return (
    <Canvas
      shadows={false}
      camera={{ position: [0, 3.6, 6.4], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      <directionalLight position={[4, 8, 6]} intensity={0.9} color="#ffffff" />
      <pointLight position={[4, 5, 5]} intensity={28} color={color} distance={22} />
      <pointLight position={[-5, 3, -3]} intensity={fillIntensity} color={fillLight} distance={18} />

      <Floor
        width={floorWidth}
        depth={floorDepth}
        gridColor={gridColor}
        centerLineColor={centerLineColor}
        floorColor={floorColor}
      />

      <Bars
        data={safe}
        color={color}
        format={format}
        unitLabel={unitLabel}
        textColor={textColor}
        textColorMuted={textColorMuted}
        textColorStrong={textColorStrong}
        outlineColor={outlineColor}
        zeroMarkerColor={zeroMarkerColor}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 2.3}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={Math.PI / 5}
      />
    </Canvas>
  );
};

export default Bar3DChart;
