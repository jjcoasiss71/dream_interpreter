// components/dream/Environments.tsx
// ---------------------------------------------------------------------------
// Procedural dream environments, each assembled from primitives + instancing so
// a whole world stays cheap to render. The renderer (DreamScene) picks one by
// the dream's `setting`. Everything is deterministic via a seeded RNG, so the
// same dream rebuilds the same place.
// ---------------------------------------------------------------------------
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import type { Palette } from "@/lib/dreamScene";

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Flat ground shared by most settings (ocean replaces it with water).
export function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0} />
    </mesh>
  );
}

// --- City -------------------------------------------------------------------

function makeWindowTexture(seed: number, lit: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, c.width, c.height);
  const rand = mulberry32(seed);
  const cols = 8;
  const rows = 16;
  const pad = 3;
  const cw = c.width / cols;
  const rh = c.height / rows;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      ctx.fillStyle = rand() < 0.4 ? lit : "#16110b";
      ctx.fillRect(x * cw + pad, y * rh + pad, cw - pad * 2, rh - pad * 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function City({ palette, seed }: { palette: Palette; seed: number }) {
  const rand = useMemo(() => mulberry32(seed), [seed]);
  const buildings = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
    const blocks = 9;
    const spacing = 11;
    for (let gx = -blocks; gx <= blocks; gx++) {
      for (let gz = -blocks; gz <= blocks; gz++) {
        const x = gx * spacing + (rand() - 0.5) * 3.5;
        const z = gz * spacing + (rand() - 0.5) * 3.5;
        if (Math.hypot(x, z) < 7) continue; // keep a small plaza around the dreamer
        const h = 8 + rand() * 40;
        const w = 4.5 + rand() * 4.5;
        const d = 4.5 + rand() * 4.5;
        arr.push({ pos: [x, h / 2, z], scale: [w, h, d] });
      }
    }
    return arr;
  }, [rand]);

  const windowTex = useMemo(() => makeWindowTexture(seed, palette.light), [seed, palette.light]);

  return (
    <group>
      <Instances limit={buildings.length} range={buildings.length}>
        <boxGeometry />
        <meshStandardMaterial
          color="#20212e"
          emissive="#ffe6c0"
          emissiveMap={windowTex}
          emissiveIntensity={1.9}
          roughness={0.8}
          metalness={0.15}
        />
        {buildings.map((b, i) => (
          <Instance key={i} position={b.pos} scale={b.scale} />
        ))}
      </Instances>
    </group>
  );
}

// --- Forest -----------------------------------------------------------------

export function Forest({ seed }: { seed: number }) {
  const rand = useMemo(() => mulberry32(seed ^ 0x9e37), [seed]);
  const trees = useMemo(() => {
    const arr: { x: number; z: number; h: number; s: number }[] = [];
    for (let i = 0; i < 220; i++) {
      const a = rand() * Math.PI * 2;
      const r = 6 + rand() * 70;
      if (r < 6) continue;
      arr.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, h: 3 + rand() * 6, s: 0.7 + rand() * 0.8 });
    }
    return arr;
  }, [rand]);

  return (
    <group>
      <Instances limit={trees.length} range={trees.length}>
        <cylinderGeometry args={[0.16, 0.3, 1, 6]} />
        <meshStandardMaterial color="#1a120c" roughness={1} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, t.h / 2, t.z]} scale={[t.s, t.h, t.s]} />
        ))}
      </Instances>
      <Instances limit={trees.length} range={trees.length}>
        <coneGeometry args={[1.5, 3.4, 7]} />
        <meshStandardMaterial color="#0d2014" roughness={1} />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, t.h + 1.2 * t.s, t.z]}
            scale={[t.s, t.s, t.s]}
          />
        ))}
      </Instances>
    </group>
  );
}

// --- Ocean ------------------------------------------------------------------

export function Ocean({ palette }: { palette: Palette }) {
  const geo = useMemo(() => new THREE.PlaneGeometry(600, 600, 90, 90), []);
  const base = useMemo(
    () => Float32Array.from(geo.attributes.position.array as Float32Array),
    [geo]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const z =
        Math.sin(x * 0.12 + t) * 0.35 +
        Math.cos(y * 0.18 + t * 0.8) * 0.3 +
        Math.sin((x + y) * 0.05 + t * 0.5) * 0.2;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
      <meshStandardMaterial
        color={palette.ground}
        roughness={0.25}
        metalness={0.65}
      />
    </mesh>
  );
}

// --- Field ------------------------------------------------------------------

export function Field({ seed, color }: { seed: number; color: string }) {
  const rand = useMemo(() => mulberry32(seed ^ 0x5151), [seed]);
  const tufts = useMemo(() => {
    const arr: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 320; i++) {
      const a = rand() * Math.PI * 2;
      const r = 2 + rand() * 60;
      arr.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.5 + rand() * 1 });
    }
    return arr;
  }, [rand]);
  const mounds = useMemo(() => {
    const arr: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const a = rand() * Math.PI * 2;
      const r = 70 + rand() * 40;
      arr.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 18 + rand() * 22 });
    }
    return arr;
  }, [rand]);

  return (
    <group>
      <Instances limit={tufts.length} range={tufts.length}>
        <coneGeometry args={[0.13, 0.7, 4]} />
        <meshStandardMaterial color={color} roughness={1} />
        {tufts.map((t, i) => (
          <Instance key={i} position={[t.x, 0.35 * t.s, t.z]} scale={[t.s, t.s, t.s]} />
        ))}
      </Instances>
      {mounds.map((m, i) => (
        <mesh key={i} position={[m.x, -m.s * 0.45, m.z]}>
          <sphereGeometry args={[m.s, 16, 12]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// --- Room -------------------------------------------------------------------

export function Room({ palette }: { palette: Palette }) {
  const S = 26;
  const H = 6;
  return (
    <group>
      {/* enclosing shell seen from the inside */}
      <mesh position={[0, H / 2 - 0.05, 0]}>
        <boxGeometry args={[S, H, S]} />
        <meshStandardMaterial color={palette.ground} side={THREE.BackSide} roughness={1} />
      </mesh>
      {/* a faint window, the one way out */}
      <mesh position={[0, 2.6, -S / 2 + 0.06]}>
        <planeGeometry args={[3, 3.6]} />
        <meshBasicMaterial color={palette.accent} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.6, -S / 2 + 1]} color={palette.accent} intensity={6} distance={14} decay={1.6} />
    </group>
  );
}
