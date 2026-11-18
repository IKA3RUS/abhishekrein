import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Circle,
  GradientTexture,
  GradientType,
  Plane,
  useFBO,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useMotionValue, useSpring } from "motion/react";
import * as THREE from "three";

import {
  Cloud,
  CloudBeams,
  Clouds,
  useCloudCut,
} from "@/components/effects/Clouds";
import { Dither } from "@/components/effects/Dither";

import { useBreakpointValue } from "@/hooks/useBreakpointValue";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWorldBounds } from "@/hooks/useWorldBounds";
import { cn } from "@/lib/cn";

function FloatingClouds({ sunPosition }: { sunPosition: THREE.Vector2 }) {
  const { unclampedWidth, height } = useWorldBounds();
  const cutRef = useCloudCut();
  const reducedMotion = useReducedMotion();

  // Quarter-size buffer of the cut-away cloud, for the beams
  const size = useThree((state) => state.size);
  const openings = useFBO(
    Math.max(1, Math.round(size.width / 4)),
    Math.max(1, Math.round(size.height / 4)),
    { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter },
  );

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
    const t = clock.elapsedTime;

    riseStart.current ??= t;
    // Intro rise
    const rise = Math.min((t - riseStart.current) / 2.4, 1);
    riseRef.current.position.y = -1.5 * Math.pow(1 - rise, 3);
    const noiseX = Math.sin(t * 0.3) * 0.4 + Math.sin(t * 0.7) * 0.2;
    const noiseY = Math.cos(t * 0.2) * 0.3 + Math.cos(t * 0.5) * 0.15;

    groupRef.current.position.x = springX.get() + noiseX;
    groupRef.current.position.y = springY.get() + noiseY - 3;
  });

  return (
    <>
      <Clouds
        ref={riseRef}
        cutRef={cutRef}
        gust={reducedMotion ? 0 : 0.6}
        turbulence={reducedMotion ? 0 : 1}
        openings={openings}
      >
        <group position-y={height * 0.1}>
          <group ref={groupRef}>
            <Cloud
              seed={15}
              segments={30}
              // Deep on z for parallax
              bounds={[10, 1, 2.5]}
              volume={5}
              speed={0.1}
              opacity={0.25}
              fade={10}
              wind={reducedMotion ? 0 : 0.12}
            />
          </group>
          <Cloud
            seed={47}
            segments={40}
            bounds={[Math.max(20, unclampedWidth + 4), 2, 2]}
            volume={10}
            speed={0.01}
            fade={8}
            position={[0, -5, 0]}
            // Slower near the ground
            wind={reducedMotion ? 0 : 0.05}
          />
        </group>
      </Clouds>
      <CloudBeams
        openings={openings.texture}
        cutRef={cutRef}
        sunPosition={sunPosition}
        // Faint, long shafts
        length={0.7}
        strength={3}
      />
    </>
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

// Writes its screen position into sunPosition each frame
function Sun({ sunPosition }: { sunPosition: THREE.Vector2 }) {
  const { right, top } = useWorldBounds("7xl");
  const paddingX = useBreakpointValue({ base: 1, md: 1, xl: 1.5 });
  const paddingY = useBreakpointValue({ base: 2, md: 1.5, xl: 1.5 });

  const ref = useRef<THREE.Mesh>(null);
  const projected = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    if (!ref.current) return;
    ref.current.getWorldPosition(projected).project(camera);
    sunPosition.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
  });

  return (
    <Circle
      ref={ref}
      args={[0.5, 16]}
      position={[right - paddingX, top - paddingY, 0]}
    >
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
  const sunPosition = useMemo(() => new THREE.Vector2(0.5, 1), []);
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
          <FloatingClouds sunPosition={sunPosition} />
          <Sun sunPosition={sunPosition} />
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
