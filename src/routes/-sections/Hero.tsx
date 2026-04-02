import { Suspense, useEffect, useRef } from "react";

import { Circle, GradientTexture, GradientType } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useMotionValue, useSpring } from "motion/react";
import * as THREE from "three";

import { AnimatedBeam } from "@/components/AnimatedBeam";
import { Button } from "@/components/Button";
import { Cloud, Clouds } from "@/components/Clouds";
import { useBreakpointValue } from "@/hooks/useBreakpointValue";
import { useClipboard } from "@/hooks/useClipboard";
import { useWorldBounds } from "@/hooks/useWorldBounds";
import { Dither } from "@/shaders/dither/Dither";

import AscentFallIka3rusMicrographic from "@/assets/home/ascent-fall-ika3rus.svg?react";
import PostFormCreativityMicrographic from "@/assets/home/post-form-creativity.svg?react";

import CopyAllIcon from "@material-symbols/svg-700/sharp/copy_all-fill.svg?react";
import LibraryAddCheckIcon from "@material-symbols/svg-700/sharp/library_add_check-fill.svg?react";
import MailIcon from "@material-symbols/svg-700/sharp/mail-fill.svg?react";

function FloatingClouds() {
  const Y_OFFSET = -3; // To render the clouds slightly below the center for composition

  const groupRef = useRef<THREE.Group>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const update = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1); // flip Y to match 3D convention
    };
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
  }, []);

  const springX = useSpring(mouseX, { stiffness: 20, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 25, damping: 30 });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const noiseX = Math.sin(t * 0.3) * 0.4 + Math.sin(t * 0.7) * 0.2;
    const noiseY = Math.cos(t * 0.2) * 0.3 + Math.cos(t * 0.5) * 0.15;

    groupRef.current.position.x = springX.get() + noiseX;
    groupRef.current.position.y = springY.get() + noiseY + Y_OFFSET;
  });

  return (
    <Clouds material={THREE.MeshBasicMaterial}>
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
        bounds={[20, 2, 1]}
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

function Sun() {
  const { right, top } = useWorldBounds("7xl");
  const paddingX = useBreakpointValue({ base: 1, md: 1, xl: 1.5 });
  const paddingY = useBreakpointValue({ base: 2, md: 1.5, xl: 1.5 });

  return (
    <Circle args={[0.5, 16]} position={[right - paddingX, top - paddingY, 0]}>
      <meshBasicMaterial color="white" transparent depthWrite={false}>
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

function Scene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={1}
        gl={{ powerPreference: "high-performance", antialias: false }}
      >
        <Suspense fallback={null}>
          <FloatingClouds />
          <Sun />
        </Suspense>
        <EffectComposer>
          <Dither gridSize={1} pixelSizeRatio={2} grayscaleOnly />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function EmailButton({ ...props }) {
  const { copy, isCopied } = useClipboard();

  const handleCopy = () => {
    copy("w@abhishekrein.xyz");
  };

  return (
    <Button onClick={handleCopy} {...props}>
      <MailIcon />
      w@abhishekrein.xyz
      {!isCopied ? (
        <CopyAllIcon
          data-icon="inline-end"
          className="fill-yellow-7! transition-[fill] duration-100 group-hover/button:fill-neutral-6! group-data-[tap=true]/button:fill-neutral-6!"
        />
      ) : (
        <LibraryAddCheckIcon
          data-icon="inline-end"
          className="fill-yellow-4!"
        />
      )}
    </Button>
  );
}

function Hero() {
  const animatedBeamContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="relative flex h-dvh w-full flex-col items-center justify-center bg-[linear-gradient(to_bottom,var(--color-violet-9)_0%,var(--color-violet-7)_15%,var(--color-violet-7)_95%,var(--color-white)_100%)]">
      <Scene />
      <div
        className="relative flex w-full flex-col items-center justify-center bg-yellow-2/0 md:flex-row"
        ref={animatedBeamContainerRef}
      >
        <span className="z-1 translate-y-1/3 typography-display-4 text-neutral-11 transition-[font-size] md:-translate-y-1/2 md:typography-display-3 xl:typography-display-2">
          abhishek
        </span>
        <AnimatedBeam
          className="-top-12.5 transition-[top] md:-top-35.5 xl:-top-53.5"
          containerRef={animatedBeamContainerRef}
        />
        <AnimatedBeam
          className="-top-8.25 transition-[top] md:-top-28.75 xl:-top-43.5"
          containerRef={animatedBeamContainerRef}
        />
        <AnimatedBeam
          className="top-2.5 transition-[top] md:-top-12.75 xl:-top-19"
          containerRef={animatedBeamContainerRef}
        />
        <span className="z-1 bg-violet-3/0 typography-display-4 text-neutral-11 md:typography-display-3 xl:typography-display-2">
          rein
        </span>
        <AnimatedBeam
          className="top-13.75 transition-[top] md:-top-3.75 xl:-top-6"
          containerRef={animatedBeamContainerRef}
        />
        <AnimatedBeam
          className="top-24.5 transition-[top] md:top-12 xl:top-18.5"
          containerRef={animatedBeamContainerRef}
        />
      </div>
      <div className="z-1 flex flex-col gap-0 typography-text-2 text-neutral-11 transition-[margin-left,gap] md:-ml-34 md:gap-4 md:typography-text-1">
        <span className="">I create human-centered eye-candy</span>
        <span className="">アビシェク レイン</span>
        <EmailButton className="mt-8 md:mt-2" />
      </div>
      <PostFormCreativityMicrographic className="absolute top-4 left-4 z-1" />
      <AscentFallIka3rusMicrographic className="absolute right-4 bottom-4 z-1" />
    </section>
  );
}

export { Hero };
