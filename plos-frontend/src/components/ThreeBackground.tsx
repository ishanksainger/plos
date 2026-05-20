import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
  Dashboard 3D Hero Scene
  ─────────────────────────────────────────────────────────────
  • Central glowing data orb (IcosahedronGeometry + wireframe)
  • 3 concentric halo spheres → simulate bloom without post-processing
  • Ring 1 (horizontal) – 320 particles, AdditiveBlending → neon ring
  • Ring 2 (tilted 50°) – 220 particles, purple, AdditiveBlending
  • Ring 3 (tilted 80°) – 160 particles, thin equatorial accent
  • 240 background star particles
  • Point lights at orb → light up surrounding particles
  • All materials use AdditiveBlending for natural glow layering
  ─────────────────────────────────────────────────────────────
*/

const ThreeBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.offsetWidth;
    const H = mount.offsetHeight || 300;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 0, 7);

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a0e20, 1));
    const orbLight = new THREE.PointLight(0x4f7cfa, 12, 18);
    orbLight.position.set(4, 0.5, 1);
    scene.add(orbLight);
    const fillLight = new THREE.PointLight(0x8b5cf6, 4, 22);
    fillLight.position.set(-2, 2, 3);
    scene.add(fillLight);

    // ── Central Data Orb (positioned right side) ─────────────
    const ORB_POS = new THREE.Vector3(4.2, 0.3, 0);

    const orbGeo = new THREE.IcosahedronGeometry(1.0, 4);
    const orbMat = new THREE.MeshPhongMaterial({
      color: 0x2050cc,
      emissive: 0x1a3aaa,
      emissiveIntensity: 1.2,
      shininess: 120,
      transparent: true,
      opacity: 0.82,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.copy(ORB_POS);
    scene.add(orb);

    // Wireframe overlay (rotates opposite direction)
    const wireGeo = new THREE.IcosahedronGeometry(1.02, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x6fa3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.copy(ORB_POS);
    scene.add(wire);

    // Glow halos — simulated bloom
    const haloGeo = new THREE.SphereGeometry(1, 16, 16);
    const haloConfigs = [
      { scale: 1.25, opacity: 0.20, color: 0x4f7cfa },
      { scale: 1.55, opacity: 0.10, color: 0x4f7cfa },
      { scale: 2.00, opacity: 0.05, color: 0x8b5cf6 },
      { scale: 2.70, opacity: 0.02, color: 0x8b5cf6 },
    ];
    haloConfigs.forEach(({ scale, opacity, color }) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const h = new THREE.Mesh(haloGeo, mat);
      h.scale.setScalar(scale);
      h.position.copy(ORB_POS);
      scene.add(h);
    });

    // ── Ring Factory ──────────────────────────────────────────
    const makeRing = (
      count: number, radius: number, spread: number,
      color: number, size: number, opacity: number,
      tiltX: number, tiltZ: number,
    ) => {
      const grp = new THREE.Group();
      grp.position.copy(ORB_POS);
      grp.rotation.x = tiltX;
      grp.rotation.z = tiltZ;

      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2 + Math.random() * 0.08;
        const r = radius + (Math.random() - 0.5) * spread;
        pos[i * 3]     = r * Math.cos(t);
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.5;
        pos[i * 3 + 2] = r * Math.sin(t);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      grp.add(new THREE.Points(geo, mat));
      scene.add(grp);
      return { grp, geo, mat };
    };

    const ring1 = makeRing(320, 1.65, 0.18, 0x4f7cfa, 0.10, 1.0, 0,              0);
    const ring2 = makeRing(240, 2.10, 0.14, 0x8b5cf6, 0.08, 0.9, Math.PI * 0.28, Math.PI * 0.08);
    const ring3 = makeRing(180, 2.50, 0.12, 0x4fc3f7, 0.06, 0.8, Math.PI * 0.45, Math.PI * 0.15);

    // ── Background star field ─────────────────────────────────
    const STAR_N = 280;
    const starPos = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 20;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x9bb8ff,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Connecting arcs to left panel (floating dots) ─────────
    const ARC_N = 60;
    const arcPos = new Float32Array(ARC_N * 3);
    for (let i = 0; i < ARC_N; i++) {
      const t = (i / ARC_N);
      arcPos[i * 3]     = ORB_POS.x * t - 4 * (1 - t) + (Math.random() - 0.5) * 1.5;
      arcPos[i * 3 + 1] = Math.sin(t * Math.PI) * 1.5 + (Math.random() - 0.5) * 0.5;
      arcPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3));
    const arcMat = new THREE.PointsMaterial({
      color: 0x4f7cfa,
      size: 0.055,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(arcGeo, arcMat));

    // ── Animation loop ────────────────────────────────────────
    let frameId: number;
    const loop = (t: number) => {
      frameId = requestAnimationFrame(loop);

      const secs = t * 0.001;

      // Orb: rotate + breathe
      orb.rotation.y = secs * 0.3;
      orb.rotation.x = secs * 0.12;
      wire.rotation.y = -secs * 0.5;
      wire.rotation.z = secs * 0.18;
      const pulse = 1 + Math.sin(secs * 1.5) * 0.025;
      orb.scale.setScalar(pulse);
      wire.scale.setScalar(pulse * 1.01);

      // Pulse the orbLight intensity
      orbLight.intensity = 12 + Math.sin(secs * 2.0) * 3;

      // Rings orbit at different speeds
      ring1.grp.rotation.y = secs * 0.55;
      ring2.grp.rotation.z = secs * 0.35;
      ring3.grp.rotation.y = -secs * 0.25;
      ring3.grp.rotation.x += 0.0003;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(loop);

    const onResize = () => {
      const w = mount.offsetWidth;
      const h = mount.offsetHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      [orbGeo, wireGeo, haloGeo, ring1.geo, ring2.geo, ring3.geo, starGeo, arcGeo]
        .forEach(g => g.dispose());
      [orbMat, wireMat, ring1.mat, ring2.mat, ring3.mat, starMat, arcMat]
        .forEach(m => m.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
};

export default ThreeBackground;
