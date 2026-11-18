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
import { usePointer } from "@/hooks/usePointer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWorldBounds } from "@/hooks/useWorldBounds";
import { cn } from "@/lib/cn";

// Moves the camera with the pointer for parallax, keeping the z = 0 plane fixed
function CameraRig() {
  const reducedMotion = useReducedMotion();
  const pointer = usePointer();
  const eased = useRef(new THREE.Vector2());
  const velocity = useRef(new THREE.Vector2());
  const base = useRef<THREE.Vector3 | null>(null);

  // Runs before the clouds, which face this camera
  useFrame(({ camera }, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    base.current ??= camera.position.clone();

    // Critically damped spring. Lower stiffness feels heavier.
    // Pointer in -1 to 1 across the viewport, centred when it leaves
    const at = reducedMotion ? null : pointer.current;
    const goalX = at ? (at.x / window.innerWidth) * 2 - 1 : 0;
    const goalY = at ? 1 - (at.y / window.innerHeight) * 2 : 0;
    const step = Math.min(delta, 0.1);
    const p = eased.current;
    const v = velocity.current;
    v.x += ((goalX - p.x) * 2.2 ** 2 - 2 * 2.2 * v.x) * step;
    v.y += ((goalY - p.y) * 2.2 ** 2 - 2 * 2.2 * v.y) * step;
    p.addScaledVector(v, step);

    const x = p.x * 0.6;
    const y = p.y * 0.35;
    camera.position.set(base.current.x + x, base.current.y + y, base.current.z);
    camera.updateMatrixWorld();

    // Shears the frustum so the z = 0 plane stays put
    const distance = base.current.z;
    camera.updateProjectionMatrix();
    const m = camera.projectionMatrix.elements;
    m[8] = (-m[0] * x) / distance;
    m[9] = (-m[5] * y) / distance;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }, -1);

  return null;
}

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

  const riseRef = useRef<THREE.Group>(null);
  const riseStart = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!riseRef.current) return;
    const t = clock.elapsedTime;

    riseStart.current ??= t;
    // Intro rise
    const rise = Math.min((t - riseStart.current) / 2.4, 1);
    riseRef.current.position.y = -1.5 * Math.pow(1 - rise, 3);
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
          <group position-y={-3}>
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
          <CameraRig />
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
