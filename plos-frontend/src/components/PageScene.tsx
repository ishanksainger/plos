import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type PageSceneVariant =
  | 'finance' | 'health' | 'habits'
  | 'timeline' | 'people' | 'responsibilities';

type AnimateFn = (elapsed: number) => void;
type SceneFactory = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  animate: AnimateFn;
  dispose: () => void;
};

// ─── Finance: Floating neon coins ────────────────────────────────
const financeFactory: SceneFactory = (scene) => {
  const C1 = 0x4f7cfa;
  const C2 = 0x10b981;

  scene.add(new THREE.AmbientLight(0x0a1020, 1.2));
  const p1 = new THREE.PointLight(C1, 5, 30); p1.position.set(-4, 4, 5); scene.add(p1);
  const p2 = new THREE.PointLight(C2, 3, 20); p2.position.set(5, -2, 4); scene.add(p2);

  const group = new THREE.Group();
  const coinGeo = new THREE.TorusGeometry(0.5, 0.08, 20, 80);
  const disposables: THREE.Material[] = [];

  const coins: { mesh: THREE.Mesh; rotSpd: number; bobOffset: number; bobAmp: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const hue = i % 2 === 0 ? C1 : C2;
    const mat = new THREE.MeshPhongMaterial({ color: hue, emissive: hue, emissiveIntensity: 0.25, shininess: 120, transparent: true, opacity: 0.72 });
    const wireMat = new THREE.MeshBasicMaterial({ color: hue, wireframe: true, transparent: true, opacity: 0.18 });
    disposables.push(mat, wireMat);

    const mesh = new THREE.Mesh(coinGeo, mat);
    mesh.add(new THREE.Mesh(coinGeo, wireMat));
    mesh.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3 - 1);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.scale.setScalar(0.55 + Math.random() * 0.9);
    group.add(mesh);
    coins.push({ mesh, rotSpd: 0.006 + Math.random() * 0.012, bobOffset: Math.random() * Math.PI * 2, bobAmp: 0.003 + Math.random() * 0.004 });
  }
  scene.add(group);

  return {
    animate: (t) => {
      coins.forEach(({ mesh, rotSpd, bobOffset, bobAmp }) => {
        mesh.rotation.y += rotSpd;
        mesh.rotation.z += rotSpd * 0.25;
        mesh.position.y += Math.sin(t * 0.001 + bobOffset) * bobAmp;
      });
      group.rotation.y += 0.0008;
    },
    dispose: () => { coinGeo.dispose(); disposables.forEach(m => m.dispose()); },
  };
};

// ─── Health: DNA Double Helix (points-based, fast) ───────────────
const healthFactory: SceneFactory = (scene) => {
  const C = 0x10b981;
  scene.add(new THREE.AmbientLight(0x041008, 1));
  const pt = new THREE.PointLight(C, 5, 20); pt.position.set(0, 0, 5); scene.add(pt);

  const group = new THREE.Group();
  const TURNS = 5; const STEPS = 50; const TOTAL = TURNS * STEPS;
  const R = 1.3; const H = 7;
  const pos1 = new Float32Array(TOTAL * 3); const pos2 = new Float32Array(TOTAL * 3);
  const crossPts: THREE.Vector3[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const t = (i / TOTAL) * Math.PI * 2 * TURNS;
    const y = (i / TOTAL) * H - H / 2;
    pos1[i * 3] = R * Math.cos(t);     pos1[i * 3 + 1] = y; pos1[i * 3 + 2] = R * Math.sin(t);
    pos2[i * 3] = R * Math.cos(t + Math.PI); pos2[i * 3 + 1] = y; pos2[i * 3 + 2] = R * Math.sin(t + Math.PI);
    if (i % 8 === 0) {
      crossPts.push(
        new THREE.Vector3(pos1[i * 3], y, pos1[i * 3 + 2]),
        new THREE.Vector3(pos2[i * 3], y, pos2[i * 3 + 2]),
      );
    }
  }

  const makeStrand = (positions: Float32Array, color: number) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.1, transparent: true, opacity: 0.9 });
    const pts = new THREE.Points(geo, mat);
    group.add(pts);
    // Line
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const lMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 });
    group.add(new THREE.Line(lGeo, lMat));
    return { geo, mat, lGeo, lMat };
  };

  const s1 = makeStrand(pos1, 0x10b981);
  const s2 = makeStrand(pos2, 0x14b8a6);

  const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPts);
  const crossMat = new THREE.LineBasicMaterial({ color: C, transparent: true, opacity: 0.2 });
  group.add(new THREE.LineSegments(crossGeo, crossMat));

  scene.add(group);
  return {
    animate: () => { group.rotation.y += 0.008; },
    dispose: () => { [s1, s2].forEach(s => { s.geo.dispose(); s.mat.dispose(); s.lGeo.dispose(); s.lMat.dispose(); }); crossGeo.dispose(); crossMat.dispose(); },
  };
};

// ─── Habits: Torus Knot + orbiting rings ─────────────────────────
const habitsFactory: SceneFactory = (scene) => {
  const C = 0xfb8c00;
  scene.add(new THREE.AmbientLight(0x100800, 1));
  const p1 = new THREE.PointLight(C, 4, 20); p1.position.set(4, 4, 5); scene.add(p1);
  const p2 = new THREE.PointLight(0xf59e0b, 2, 15); p2.position.set(-3, -2, 3); scene.add(p2);

  const group = new THREE.Group();
  const knotGeo = new THREE.TorusKnotGeometry(1.6, 0.33, 128, 16, 2, 3);
  const knotMat = new THREE.MeshPhongMaterial({ color: C, emissive: C, emissiveIntensity: 0.18, shininess: 80, transparent: true, opacity: 0.65 });
  const wireMat = new THREE.MeshBasicMaterial({ color: C, wireframe: true, transparent: true, opacity: 0.13 });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  knot.add(new THREE.Mesh(knotGeo, wireMat));

  // Orbiting small toruses
  const orbitGeo = new THREE.TorusGeometry(0.22, 0.05, 8, 32);
  const orbits: { mesh: THREE.Mesh; angle: number; radius: number; speed: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const oMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.4, transparent: true, opacity: 0.7 });
    const m = new THREE.Mesh(orbitGeo, oMat);
    const radius = 2.4 + i * 0.3;
    const angle = (i / 5) * Math.PI * 2;
    m.position.set(radius * Math.cos(angle), (Math.random() - 0.5) * 2, radius * Math.sin(angle));
    group.add(m);
    orbits.push({ mesh: m, angle, radius, speed: 0.008 + i * 0.003 });
  }

  group.add(knot);
  scene.add(group);

  return {
    animate: () => {
      knot.rotation.x += 0.004;
      knot.rotation.y += 0.006;
      orbits.forEach(o => {
        o.angle += o.speed;
        o.mesh.position.x = o.radius * Math.cos(o.angle);
        o.mesh.position.z = o.radius * Math.sin(o.angle);
        o.mesh.rotation.y += 0.02;
      });
    },
    dispose: () => { knotGeo.dispose(); knotMat.dispose(); wireMat.dispose(); orbitGeo.dispose(); },
  };
};

// ─── Timeline: Glowing particle helix ────────────────────────────
const timelineFactory: SceneFactory = (scene) => {
  const C1 = 0x8b5cf6; const C2 = 0x4f7cfa;
  scene.add(new THREE.AmbientLight(0x080510, 1));
  const pt = new THREE.PointLight(C1, 4, 20); pt.position.set(0, 0, 5); scene.add(pt);

  const group = new THREE.Group();
  const N = 400; const TURNS = 4;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const c1 = new THREE.Color(C1); const c2 = new THREE.Color(C2);

  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2 * TURNS;
    const r = 1.8 + Math.sin(t * 0.4) * 0.25;
    positions[i * 3]     = r * Math.cos(t);
    positions[i * 3 + 1] = (i / N) * 8 - 4;
    positions[i * 3 + 2] = r * Math.sin(t);
    const mc = c1.clone().lerp(c2, i / N);
    colors[i * 3] = mc.r; colors[i * 3 + 1] = mc.g; colors[i * 3 + 2] = mc.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.9 });
  group.add(new THREE.Points(pGeo, pMat));

  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
  const lMat = new THREE.LineBasicMaterial({ color: C1, transparent: true, opacity: 0.18 });
  group.add(new THREE.Line(lGeo, lMat));

  // Small marker spheres at key points
  const sGeo = new THREE.SphereGeometry(0.12, 8, 8);
  for (let i = 0; i < N; i += 40) {
    const sMat = new THREE.MeshPhongMaterial({ color: C1, emissive: C1, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
    const s = new THREE.Mesh(sGeo, sMat);
    s.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    group.add(s);
  }

  scene.add(group);
  return {
    animate: () => { group.rotation.y += 0.005; },
    dispose: () => { pGeo.dispose(); pMat.dispose(); lGeo.dispose(); lMat.dispose(); sGeo.dispose(); },
  };
};

// ─── People: 3D social network graph ─────────────────────────────
const peopleFactory: SceneFactory = (scene) => {
  const C = 0xf05252; const C2 = 0xfb8c00;
  scene.add(new THREE.AmbientLight(0x100505, 1));
  const p1 = new THREE.PointLight(C, 4, 20); p1.position.set(3, 4, 5); scene.add(p1);
  const p2 = new THREE.PointLight(C2, 2, 15); p2.position.set(-4, -2, 4); scene.add(p2);

  const group = new THREE.Group();
  const nodePos = [
    [0, 0, 0], [2.8, 1.2, 0.5], [-2.2, 1.5, -0.5],
    [1.5, -2.2, 1], [-1.8, -1.5, 0.5], [3.8, -0.5, -0.5],
    [-3.2, 0.5, 0.5], [0, 2.8, -0.5], [0.5, -3.2, 0], [-2, 2.5, 1],
  ];

  const sGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const nodes: THREE.Mesh[] = [];
  const lMat = new THREE.LineBasicMaterial({ color: C, transparent: true, opacity: 0.18 });

  nodePos.forEach((pos, i) => {
    const hue = i % 2 === 0 ? C : C2;
    const mat = new THREE.MeshPhongMaterial({ color: hue, emissive: hue, emissiveIntensity: 0.45, transparent: true, opacity: 0.88 });
    const node = new THREE.Mesh(sGeo, mat);
    node.position.set(...pos as [number, number, number]);
    group.add(node);
    nodes.push(node);
  });

  // Draw connection lines
  const THRESH = 3.5;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].position.distanceTo(nodes[j].position) < THRESH) {
        const geo = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
        group.add(new THREE.Line(geo, lMat));
      }
    }
  }

  scene.add(group);
  return {
    animate: () => { group.rotation.y += 0.004; group.rotation.x += 0.001; },
    dispose: () => { sGeo.dispose(); lMat.dispose(); },
  };
};

// ─── Responsibilities: Neon wireframe boxes ───────────────────────
const responsibilitiesFactory: SceneFactory = (scene) => {
  const C = 0x4f7cfa; const C2 = 0x8b5cf6;
  scene.add(new THREE.AmbientLight(0x050810, 1));
  const p1 = new THREE.PointLight(C, 4, 25); p1.position.set(4, 4, 5); scene.add(p1);
  const p2 = new THREE.PointLight(C2, 2, 15); p2.position.set(-3, -2, 4); scene.add(p2);

  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const boxes: { mesh: THREE.Mesh; vx: number; vy: number }[] = [];

  for (let i = 0; i < 8; i++) {
    const hue = i % 2 === 0 ? C : C2;
    const solidMat = new THREE.MeshPhongMaterial({ color: hue, emissive: hue, emissiveIntensity: 0.1, transparent: true, opacity: 0.12 });
    const wireMat = new THREE.MeshBasicMaterial({ color: hue, wireframe: true, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(boxGeo, solidMat);
    mesh.add(new THREE.Mesh(boxGeo, wireMat));
    mesh.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 3 - 1);
    mesh.scale.setScalar(0.45 + Math.random() * 1.1);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(mesh);
    boxes.push({ mesh, vx: 0.003 + Math.random() * 0.009, vy: 0.002 + Math.random() * 0.007 });
  }

  scene.add(group);
  return {
    animate: () => { boxes.forEach(({ mesh, vx, vy }) => { mesh.rotation.x += vx; mesh.rotation.y += vy; }); group.rotation.y += 0.001; },
    dispose: () => { boxGeo.dispose(); },
  };
};

const FACTORIES: Record<PageSceneVariant, SceneFactory> = {
  finance: financeFactory,
  health: healthFactory,
  habits: habitsFactory,
  timeline: timelineFactory,
  people: peopleFactory,
  responsibilities: responsibilitiesFactory,
};

// ─── Component ───────────────────────────────────────────────────
interface PageSceneProps {
  variant: PageSceneVariant;
  style?: React.CSSProperties;
}

const PageScene = ({ variant, style }: PageSceneProps) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.offsetWidth; const H = mount.offsetHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 7;

    const { animate, dispose } = FACTORIES[variant](scene, camera);

    let frameId: number;
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      animate(performance.now());
      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => {
      const w = mount.offsetWidth; const h = mount.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, ...style }}
    />
  );
};

export default PageScene;
