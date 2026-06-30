// components/dream/Weather.tsx
// ---------------------------------------------------------------------------
// Rain and snow as cheap particle systems that follow the dreamer (so the
// volume is always around the camera). DreamScene mounts one based on the
// dream's `weather`. "fog" and "clear" need no particles — fog is handled by
// the scene's fog density.
// ---------------------------------------------------------------------------
"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const SPREAD = 44; // horizontal box around the dreamer
const TOP = 30; // height drops/flakes fall from

export function Rain({ count = 700, color = "#9fb4cc" }: { count?: number; color?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * SPREAD,
        y: Math.random() * TOP,
        z: (Math.random() - 0.5) * SPREAD,
        v: 22 + Math.random() * 16,
      })),
    [count]
  );

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y -= d.v * dt;
      if (d.y < 0) {
        d.y = TOP + Math.random() * 6;
        d.x = (Math.random() - 0.5) * SPREAD;
        d.z = (Math.random() - 0.5) * SPREAD;
      }
      dummy.position.set(cx + d.x, d.y, cz + d.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[0.015, 0.8, 0.015]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} />
    </instancedMesh>
  );
}

export function Snow({ count = 900, color = "#e8eef7" }: { count?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const { geometry, vel } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const v = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 1] = Math.random() * TOP;
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
      v[i] = 1.2 + Math.random() * 1.8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: g, vel: v };
  }, [count]);

  const sprite = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d")!;
    const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const dt = Math.min(delta, 0.05);
    const arr = geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= vel[i] * dt;
      arr[i * 3] += Math.sin(t * 0.5 + i) * 0.004;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = TOP + Math.random() * 4;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    pts.position.set(camera.position.x, 0, camera.position.z);
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color={color}
        size={0.16}
        map={sprite}
        transparent
        opacity={0.85}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}
