import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import {
  Circle,
  GradientTexture,
  GradientType,
  Plane,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useMotionValue, useSpring } from "motion/react";
import * as THREE from "three";

import { Cloud, Clouds } from "@/components/effects/Clouds";

import { useBreakpointValue } from "@/hooks/useBreakpointValue";
import { useInView } from "@/hooks/useInView";
import { useWorldBounds } from "@/hooks/useWorldBounds";
import { cn } from "@/lib/cn";
import { Dither } from "@/shaders/dither/Dither";

function FloatingClouds() {
  const Y_OFFSET = -3;
  const RISE_DISTANCE = 1.5;
  const RISE_DURATION = 2.4;

  const { unclampedWidth } = useWorldBounds();

  const groupRef = useRef<THREE.Group>(null);
  const riseRef = useRef<THREE.Group>(null);
  const riseStart = useRef<number | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const update = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
  }, []);

  const springX = useSpring(mouseX, { stiffness: 20, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 25, damping: 30 });

  useFrame(({ clock }) => {
    if (!groupRef.current || !riseRef.current) return;
    const t = clock.getElapsedTime();

    riseStart.current ??= t;
    const rise = Math.min((t - riseStart.current) / RISE_DURATION, 1);
    riseRef.current.position.y = -RISE_DISTANCE * Math.pow(1 - rise, 3);
    const noiseX = Math.sin(t * 0.3) * 0.4 + Math.sin(t * 0.7) * 0.2;
    const noiseY = Math.cos(t * 0.2) * 0.3 + Math.cos(t * 0.5) * 0.15;

    groupRef.current.position.x = springX.get() + noiseX;
    groupRef.current.position.y = springY.get() + noiseY + Y_OFFSET;
  });

  return (
    <Clouds material={THREE.MeshBasicMaterial} ref={riseRef}>
      <group ref={groupRef}>
        <Cloud
          seed={15}
          segments={30}
          bounds={[10, 1, 1]}
          concentrate="outside"
          volume={5}
          speed={0.1}
          opacity={0.25}
          fade={10}
          color="white"
        />
      </group>
      <Cloud
        seed={47}
        segments={40}
        bounds={[Math.max(20, unclampedWidth + 4), 2, 1]}
        concentrate="outside"
        volume={10}
        speed={0.01}
        fade={8}
        color="white"
        position={[0, -5, 0]}
      />
    </Clouds>
  );
}

// Fades the bottom of the hero to solid white under the clouds, dithered by the same pass.
// Lights are drawn blue so the Dither pass doesn't shade them like cloud.
function Horizon() {
  const { unclampedWidth, bottom, height } = useWorldBounds();
  const horizonHeight = height * 0.4;

  return (
    <Plane
      args={[unclampedWidth, horizonHeight]}
      position={[0, bottom + horizonHeight / 2, 0]}
      renderOrder={-1}
    >
      <meshBasicMaterial color="blue" transparent depthWrite={false}>
        <GradientTexture
          attach="alphaMap"
          stops={[0, 0.55, 1]}
          colors={["black", "gray", "white"]}
          size={256}
        />
      </meshBasicMaterial>
    </Plane>
  );
}

function Sun() {
  const { right, top } = useWorldBounds("7xl");
  const paddingX = useBreakpointValue({ base: 1, md: 1, xl: 1.5 });
  const paddingY = useBreakpointValue({ base: 2, md: 1.5, xl: 1.5 });

  return (
    <Circle args={[0.5, 16]} position={[right - paddingX, top - paddingY, 0]}>
      <meshBasicMaterial color="blue" transparent depthWrite={false}>
        <GradientTexture
          attach="alphaMap"
          type={GradientType.Radial}
          stops={[0, 0.25, 1]}
          colors={["white", "gray", "black"]}
          size={100}
          width={100}
        />
      </meshBasicMaterial>
    </Circle>
  );
}

function OnReady({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}

function HeroScene({ onShown }: { onShown?: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapperRef);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  // Report once the fade-in has finished. If the scene was ready before its
  // first paint there's no transition to wait for.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      const fades = wrapperRef.current?.getAnimations() ?? [];
      Promise.all(fades.map((fade) => fade.finished))
        .then(() => !cancelled && onShown?.())
        .catch(() => {});
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [ready, onShown]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-1600 ease-out",
        ready && "opacity-100",
      )}
    >
      <Canvas
        // Stops rendering while the hero is scrolled out of view.
        frameloop={inView ? "always" : "never"}
        dpr={1}
        gl={{ powerPreference: "high-performance", antialias: false }}
      >
        <Suspense fallback={null}>
          <Horizon />
          <FloatingClouds />
          <Sun />
          <OnReady onReady={onReady} />
        </Suspense>
        <EffectComposer>
          <Dither
            gridSize={1}
            pixelSizeRatio={2}
            grayscaleOnly
            shade={1}
            shadeColor="#dcd6d2"
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default HeroScene;
