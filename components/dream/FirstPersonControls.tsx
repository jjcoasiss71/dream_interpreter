// components/dream/FirstPersonControls.tsx
// ---------------------------------------------------------------------------
// First-person navigation: pointer-lock mouse-look (drei) + WASD/arrow movement
// at standing eye height, with a gentle head-bob while walking. Movement is only
// live while `active` (the dreamworld phase) — not during the faint or waking.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

const EYE = 1.6; // standing eye height (metres)
const BOUND = 60; // soft world half-extent

export function FirstPersonControls({ active }: { active: boolean }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const reduced = useRef(false);
  const bob = useRef(0);

  // Reusable vectors (avoid per-frame allocation).
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const move = useRef(new THREE.Vector3());

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current = {};
    };
  }, []);

  useFrame((_, delta) => {
    if (!active) return;
    const k = keys.current;
    const sprint = k["ShiftLeft"] || k["ShiftRight"];
    const speed = (sprint ? 8.5 : 4.5) * Math.min(delta, 0.05);

    // Horizontal forward/right derived from where the camera is looking.
    forward.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
    right.current.y = 0;
    right.current.normalize();

    move.current.set(0, 0, 0);
    if (k["KeyW"] || k["ArrowUp"]) move.current.add(forward.current);
    if (k["KeyS"] || k["ArrowDown"]) move.current.sub(forward.current);
    if (k["KeyD"] || k["ArrowRight"]) move.current.add(right.current);
    if (k["KeyA"] || k["ArrowLeft"]) move.current.sub(right.current);

    const moving = move.current.lengthSq() > 0;
    if (moving) {
      move.current.normalize().multiplyScalar(speed);
      camera.position.add(move.current);
    }

    let y = EYE;
    if (moving && !reduced.current) {
      bob.current += delta * (sprint ? 13 : 9);
      y += Math.sin(bob.current) * 0.045;
    }
    camera.position.y = y;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -BOUND, BOUND);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -BOUND, BOUND);
  });

  // Mounting PointerLockControls lets a click lock the pointer for mouse-look;
  // Esc releases it (so the "Wake up" overlay is always reachable).
  return active ? <PointerLockControls makeDefault /> : null;
}
