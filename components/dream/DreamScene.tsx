// components/dream/DreamScene.tsx
// ---------------------------------------------------------------------------
// The walkable dream world. It reads a SceneSpec and assembles the matching
// place — a city, forest, ocean, field, room, or empty void — with weather,
// time-of-day lighting, and fog, then lets the dreamer walk through it in first
// person. Rendered entirely client-side (WebGL); imported ssr:false.
// ---------------------------------------------------------------------------
"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { SceneSpec } from "@/lib/dreamScene";
import { FirstPersonControls } from "./FirstPersonControls";
import { SymbolMarker } from "./SymbolMarker";
import { City, Forest, Ocean, Field, Room, Ground } from "./Environments";
import { DreamElements } from "./Elements";
import { Rain, Snow } from "./Weather";

// A warm lamp riding with the camera — the candle carried into the dream, so
// the world only ever opens up right around the dreamer.
function PlayerLight({ color, intensity }: { color: string; intensity: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.set(
        state.camera.position.x,
        state.camera.position.y + 0.4,
        state.camera.position.z
      );
    }
  });
  return <pointLight ref={ref} color={color} intensity={intensity} distance={36} decay={1.3} />;
}

function Environment({ spec }: { spec: SceneSpec }) {
  switch (spec.setting) {
    case "city":
      return <City palette={spec.palette} seed={spec.seed} />;
    case "forest":
      return <Forest seed={spec.seed} />;
    case "ocean":
      return <Ocean palette={spec.palette} />;
    case "field":
      return <Field seed={spec.seed} color={spec.palette.ground} />;
    case "room":
      return <Room palette={spec.palette} />;
    case "void":
    default:
      return null;
  }
}

function Weather({ spec }: { spec: SceneSpec }) {
  if (spec.weather === "rain") return <Rain color={spec.palette.accent} />;
  if (spec.weather === "snow") return <Snow />;
  return null; // fog/clear need no particles
}

export default function DreamScene({
  spec,
  active,
}: {
  spec: SceneSpec;
  active: boolean;
}) {
  const day = spec.timeOfDay === "day";
  const dusk = spec.timeOfDay === "dusk";

  // Time of day sets the ambient floor; the player lamp does the close work.
  const ambient = day ? 0.75 : dusk ? 0.5 : 0.42;
  const hemi = day ? 0.7 : dusk ? 0.55 : 0.5;
  const lampIntensity = day ? 10 : dusk ? 22 : 34;
  // A soft overhead fill (moonlight) so silhouettes read even far from the lamp.
  const fill = day ? 0 : dusk ? 0.4 : 0.35;

  // A faint ground grid gives strong spatial + motion cues (you can tell you're
  // moving). Skipped where it would read wrong (water, enclosed room).
  const showGrid = spec.setting !== "ocean" && spec.setting !== "room";

  const showStars = spec.timeOfDay === "night" && spec.weather === "clear";

  return (
    <Canvas
      className="dream-canvas"
      shadows={false}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.6, 0], fov: 72, near: 0.1, far: 200 }}
    >
      <color attach="background" args={[spec.palette.sky]} />
      <fogExp2 attach="fog" args={[spec.palette.fog, spec.fogDensity]} />

      <ambientLight intensity={ambient} />
      <hemisphereLight args={[spec.palette.sky, "#0a0c12", hemi]} />
      {fill > 0 && <directionalLight position={[18, 40, -12]} intensity={fill} color={spec.palette.accent} />}
      {day && <directionalLight position={[20, 40, 10]} intensity={0.6} color="#fff3df" />}
      {showStars && <Stars radius={120} depth={50} count={1500} factor={3} fade speed={0.3} />}

      {spec.setting !== "ocean" && <Ground color={spec.palette.ground} />}
      {showGrid && (
        <Grid
          args={[400, 400]}
          cellSize={2}
          cellThickness={0.6}
          cellColor="#2c2436"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#4c3c56"
          fadeDistance={45}
          fadeStrength={2}
          followCamera
          infiniteGrid
        />
      )}
      <Environment spec={spec} />
      <DreamElements spec={spec} />
      <Weather spec={spec} />
      <PlayerLight color={spec.palette.light} intensity={lampIntensity} />

      {spec.markers.map((m, i) => (
        <SymbolMarker key={`${m.label}-${i}`} marker={m} />
      ))}

      <FirstPersonControls active={active} />
    </Canvas>
  );
}
