// components/dream/SymbolMarker.tsx
// ---------------------------------------------------------------------------
// One dream symbol, floating in the fog as a glowing ember with its word above
// it. Walking closer intensifies the glow and clears the label — the first small
// "witness the dream" beat; future scripted events hang off this same hook.
// ---------------------------------------------------------------------------
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import type { SceneMarker } from "@/lib/dreamScene";

const NEAR = 14; // distance (m) at which a marker reaches full glow

export function SymbolMarker({ marker }: { marker: SceneMarker }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const text = useRef<THREE.Mesh>(null);
  const glow = useRef(marker.intensity);

  const home = useMemo(() => new THREE.Vector3(...marker.position), [marker.position]);
  const phase = useMemo(() => home.x + home.z, [home]);

  useFrame((state, delta) => {
    const d = state.camera.position.distanceTo(home);
    const near = THREE.MathUtils.clamp(1 - d / NEAR, 0, 1);
    const target = marker.intensity + near * 1.7;
    glow.current += (target - glow.current) * Math.min(1, delta * 4);

    if (group.current) {
      group.current.position.y =
        home.y + Math.sin(state.clock.elapsedTime * 0.7 + phase) * 0.15;
    }
    if (mat.current) mat.current.opacity = 0.45 + near * 0.55;
    if (light.current) light.current.intensity = glow.current * 7;
    if (text.current) {
      const m = text.current.material as THREE.Material & { opacity: number };
      m.opacity = 0.35 + near * 0.65;
    }
  });

  return (
    <group ref={group} position={marker.position}>
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial
          ref={mat}
          color="#ffd0a6"
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={light} color="#ffb98a" intensity={4} distance={9} decay={1.6} />
      <Billboard position={[0, 0.6, 0]}>
        <Text
          ref={text}
          fontSize={0.4}
          color="#f3e4cf"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
          material-transparent
          material-opacity={0.6}
        >
          {marker.label}
        </Text>
      </Billboard>
    </group>
  );
}
