// components/dream/Elements.tsx
// ---------------------------------------------------------------------------
// Dream ELEMENTS — discrete things the dream described (a moon, water, a path,
// fire, figures, a doorway...) built from primitives and dropped on top of the
// base setting, so the world reflects more of what the dreamer actually wrote.
// DreamScene renders <DreamElements> from spec.elements.
// ---------------------------------------------------------------------------
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import type { SceneSpec } from "@/lib/dreamScene";

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- individual elements ----------------------------------------------------

function Moon({ color }: { color: string }) {
  return (
    <group position={[-80, 58, -150]}>
      <mesh>
        <sphereGeometry args={[13, 32, 32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* a soft halo */}
      <mesh>
        <sphereGeometry args={[19, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} toneMapped={false} />
      </mesh>
      <directionalLight position={[0, 0, 0]} intensity={0.3} color={color} />
    </group>
  );
}

function Mountains({ seed }: { seed: number }) {
  const rand = useMemo(() => rng(seed ^ 0x3a1), [seed]);
  const peaks = useMemo(() => {
    const a: { x: number; z: number; h: number; w: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + (rand() - 0.5) * 0.25;
      const r = 130 + rand() * 70;
      a.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r, h: 35 + rand() * 60, w: 45 + rand() * 45 });
    }
    return a;
  }, [rand]);
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.h / 2 - 8, p.z]}>
          <coneGeometry args={[p.w, p.h, 5]} />
          <meshStandardMaterial color="#0b0d15" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Water() {
  const geo = useMemo(() => new THREE.PlaneGeometry(70, 70, 40, 40), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 0.18 + t) * 0.18 + Math.cos(y * 0.22 + t * 0.7) * 0.16);
    }
    pos.needsUpdate = true;
  });
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -26]}>
      <meshStandardMaterial color="#08131e" roughness={0.22} metalness={0.7} />
    </mesh>
  );
}

function Path({ accent }: { accent: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -40]}>
      <planeGeometry args={[4.2, 320]} />
      <meshStandardMaterial color="#2b2b34" emissive={accent} emissiveIntensity={0.12} roughness={0.9} />
    </mesh>
  );
}

function Flame({ position, scale }: { position: [number, number, number]; scale: number }) {
  const light = useRef<THREE.PointLight>(null);
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame((state) => {
    if (light.current) {
      const f = 1 + Math.sin(state.clock.elapsedTime * 12 + seed) * 0.35 + Math.sin(state.clock.elapsedTime * 27 + seed) * 0.2;
      light.current.intensity = (5 + f * 4) * scale;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
      </mesh>
      <pointLight ref={light} color="#ff8b3a" intensity={8} distance={16} decay={1.5} />
    </group>
  );
}

function Fires({ seed }: { seed: number }) {
  const rand = useMemo(() => rng(seed ^ 0xf17e), [seed]);
  const spots = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        pos: [(rand() - 0.5) * 44, 0.4, -6 - rand() * 42] as [number, number, number],
        s: 0.6 + rand() * 0.9,
      })),
    [rand]
  );
  return (
    <>
      {spots.map((s, i) => (
        <Flame key={i} position={s.pos} scale={s.s} />
      ))}
    </>
  );
}

function Streetlights({ seed }: { seed: number }) {
  const lamps = useMemo(() => {
    const a: { x: number; z: number }[] = [];
    for (let i = 0; i < 12; i++) {
      a.push({ x: (i % 2 ? 1 : -1) * 3.4, z: 18 - i * 14 });
    }
    return a;
  }, []);
  return (
    <group>
      {lamps.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <mesh position={[0, 2.4, 0]}>
            <cylinderGeometry args={[0.08, 0.11, 4.8, 6]} />
            <meshStandardMaterial color="#15151c" roughness={1} />
          </mesh>
          <mesh position={[0, 4.75, 0]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
          </mesh>
          <pointLight position={[0, 4.6, 0]} color="#ffcf99" intensity={6} distance={13} decay={1.6} />
        </group>
      ))}
    </group>
  );
}

function ScatterTrees({ seed }: { seed: number }) {
  const rand = useMemo(() => rng(seed ^ 0x7ee), [seed]);
  const trees = useMemo(() => {
    const a: { x: number; z: number; h: number; s: number }[] = [];
    for (let i = 0; i < 60; i++) {
      const ang = rand() * Math.PI * 2;
      const r = 8 + rand() * 55;
      a.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r, h: 3 + rand() * 5, s: 0.7 + rand() * 0.7 });
    }
    return a;
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
        <coneGeometry args={[1.4, 3.2, 7]} />
        <meshStandardMaterial color="#0d2014" roughness={1} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, t.h + 1.1 * t.s, t.z]} scale={[t.s, t.s, t.s]} />
        ))}
      </Instances>
    </group>
  );
}

function Structures({ seed }: { seed: number }) {
  const rand = useMemo(() => rng(seed ^ 0x5704), [seed]);
  const blocks = useMemo(() => {
    const a: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
    for (let i = 0; i < 36; i++) {
      const ang = rand() * Math.PI * 2;
      const r = 12 + rand() * 55;
      const h = 2 + rand() * 12;
      const w = 2 + rand() * 6;
      a.push({ pos: [Math.cos(ang) * r, h / 2, Math.sin(ang) * r], scale: [w, h, 2 + rand() * 6] });
    }
    return a;
  }, [rand]);
  return (
    <Instances limit={blocks.length} range={blocks.length}>
      <boxGeometry />
      <meshStandardMaterial color="#181620" roughness={1} />
      {blocks.map((b, i) => (
        <Instance key={i} position={b.pos} scale={b.scale} />
      ))}
    </Instances>
  );
}

function Doorway({ accent }: { accent: string }) {
  return (
    <group position={[0, 0, -11]}>
      {/* frame */}
      <mesh position={[-1, 1.6, 0]}>
        <boxGeometry args={[0.22, 3.2, 0.22]} />
        <meshStandardMaterial color="#0e0e13" roughness={1} />
      </mesh>
      <mesh position={[1, 1.6, 0]}>
        <boxGeometry args={[0.22, 3.2, 0.22]} />
        <meshStandardMaterial color="#0e0e13" roughness={1} />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <boxGeometry args={[2.2, 0.22, 0.22]} />
        <meshStandardMaterial color="#0e0e13" roughness={1} />
      </mesh>
      {/* the glow within the opening */}
      <mesh position={[0, 1.6, 0]}>
        <planeGeometry args={[1.78, 3.0]} />
        <meshBasicMaterial color={accent} transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1.7, 0.6]} color={accent} intensity={7} distance={12} decay={1.5} />
    </group>
  );
}

function Bridge({ accent }: { accent: string }) {
  const planks = 24;
  return (
    <group position={[0, 0.5, -30]}>
      {/* deck */}
      <mesh>
        <boxGeometry args={[4, 0.25, 60]} />
        <meshStandardMaterial color="#241a14" roughness={1} />
      </mesh>
      {/* railings */}
      {[-1.9, 1.9].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]}>
          <boxGeometry args={[0.16, 1.2, 60]} />
          <meshStandardMaterial color="#16100c" emissive={accent} emissiveIntensity={0.08} roughness={1} />
        </mesh>
      ))}
      {/* posts */}
      {Array.from({ length: planks }).map((_, i) => {
        const z = -28 + i * (56 / (planks - 1));
        return (
          <group key={i}>
            <mesh position={[-1.9, 0.5, z]}>
              <boxGeometry args={[0.18, 1.3, 0.18]} />
              <meshStandardMaterial color="#16100c" roughness={1} />
            </mesh>
            <mesh position={[1.9, 0.5, z]}>
              <boxGeometry args={[0.18, 1.3, 0.18]} />
              <meshStandardMaterial color="#16100c" roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Stairs() {
  const steps = 18;
  return (
    <group position={[0, 0, -8]}>
      {Array.from({ length: steps }).map((_, i) => (
        <mesh key={i} position={[0, i * 0.32 + 0.16, -i * 0.55]}>
          <boxGeometry args={[5, 0.32, 0.6]} />
          <meshStandardMaterial color="#1c1822" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Figures({ seed }: { seed: number }) {
  const rand = useMemo(() => rng(seed ^ 0xf16), [seed]);
  const figs = useMemo(() => {
    const a: { x: number; z: number; ry: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const ang = rand() * Math.PI * 2;
      const r = 14 + rand() * 30;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      a.push({ x, z, ry: Math.atan2(-x, -z) }); // face the dreamer
    }
    return a;
  }, [rand]);
  return (
    <group>
      {figs.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]} rotation={[0, f.ry, 0]}>
          {/* body */}
          <mesh position={[0, 1, 0]}>
            <capsuleGeometry args={[0.32, 1.1, 4, 8]} />
            <meshStandardMaterial color="#050507" roughness={1} />
          </mesh>
          {/* head */}
          <mesh position={[0, 1.95, 0]}>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial color="#050507" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Flowers({ seed, accent }: { seed: number; accent: string }) {
  const rand = useMemo(() => rng(seed ^ 0xf10a), [seed]);
  const blooms = useMemo(() => {
    const a: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 220; i++) {
      const ang = rand() * Math.PI * 2;
      const r = 2 + rand() * 55;
      a.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r, s: 0.5 + rand() * 0.8 });
    }
    return a;
  }, [rand]);
  return (
    <Instances limit={blooms.length} range={blooms.length}>
      <sphereGeometry args={[0.09, 8, 8]} />
      <meshBasicMaterial color={accent} toneMapped={false} />
      {blooms.map((b, i) => (
        <Instance key={i} position={[b.x, 0.2 * b.s, b.z]} scale={b.s} />
      ))}
    </Instances>
  );
}

// --- dispatcher -------------------------------------------------------------

export function DreamElements({ spec }: { spec: SceneSpec }) {
  const set = useMemo(() => new Set(spec.elements), [spec.elements]);
  const accent = spec.palette.accent;
  const seed = spec.seed;
  return (
    <>
      {set.has("moon") && <Moon color={spec.palette.light} />}
      {set.has("mountains") && <Mountains seed={seed} />}
      {set.has("water") && <Water />}
      {set.has("path") && <Path accent={accent} />}
      {set.has("fire") && <Fires seed={seed} />}
      {set.has("streetlights") && <Streetlights seed={seed} />}
      {set.has("trees") && <ScatterTrees seed={seed} />}
      {set.has("structures") && <Structures seed={seed} />}
      {set.has("doorway") && <Doorway accent={accent} />}
      {set.has("bridge") && <Bridge accent={accent} />}
      {set.has("stairs") && <Stairs />}
      {set.has("figures") && <Figures seed={seed} />}
      {set.has("flowers") && <Flowers seed={seed} accent={accent} />}
    </>
  );
}
