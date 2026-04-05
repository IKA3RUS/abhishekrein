import { Suspense, useEffect, useRef } from "react";

import { Circle, GradientTexture, GradientType } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useMotionValue, useSpring } from "motion/react";
import * as THREE from "three";

import { Cloud, Clouds } from "@/components/Clouds";
import { useBreakpointValue } from "@/hooks/useBreakpointValue";
import { useWorldBounds } from "@/hooks/useWorldBounds";
import { Dither } from "@/shaders/dither/Dither";

function FloatingClouds() {
  const Y_OFFSET = -3;

  const groupRef = useRef<THREE.Group>(null);
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

function HeroScene() {
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

export default HeroScene;
