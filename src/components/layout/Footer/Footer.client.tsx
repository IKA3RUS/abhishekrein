import { Suspense, useEffect } from "react";

import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";

import { Cloud, Clouds, useCloudCut } from "@/components/effects/Clouds";
import { Dither } from "@/components/effects/Dither";

import { useBreakpointValue } from "@/hooks/useBreakpointValue";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const DITHER_BLOCK = 2;

function Puff() {
  const cutRef = useCloudCut({ radius: 0.1, heal: 4 });
  const reducedMotion = useReducedMotion();
  const side = useBreakpointValue({ base: 1, sm: -1, xl: 1 });

  return (
    <Clouds
      cutRef={cutRef}
      turbulence={reducedMotion ? 0 : 0.5}
      // Keeps the puffs at the size they had on a 112px tall canvas
      scale={112 / 144}
    >
      <Cloud
        seed={23}
        segments={30}
        bounds={[3, 1, 0.5]}
        volume={1.5}
        opacity={0.6}
        speed={reducedMotion ? 0 : 0.1}
        fade={2}
      />
      {/* Smaller puffs trailing the main one */}
      <Cloud
        seed={57}
        segments={10}
        bounds={[1.2, 0.4, 0.3]}
        volume={0.9}
        opacity={0.6}
        speed={reducedMotion ? 0 : 0.1}
        fade={2}
        position={[-6.4 * side, -2.4, 0]}
      />
      <Cloud
        seed={83}
        segments={8}
        bounds={[0.8, 0.3, 0.3]}
        volume={0.6}
        opacity={0.6}
        speed={reducedMotion ? 0 : 0.1}
        fade={2}
        position={[6.2 * side, 2.6, 0]}
      />
    </Clouds>
  );
}

function FrameDriver({ running }: { running: boolean }) {
  const get = useThree((state) => state.get);

  // Time only advances on rendered frames
  useEffect(() => {
    const { clock } = get();
    clock.stop();
    clock.autoStart = false;
  }, [get]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let previous: number | null = null;

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      const step = previous === null ? 0 : (time - previous) / 1000;
      previous = time;
      const { advance, clock } = get();
      // Caps the step after a stall
      advance(clock.elapsedTime + Math.min(step, 0.1));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, get]);

  return null;
}

function FooterCloud({
  running,
  className,
}: {
  running: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas frameloop="never" dpr={1} gl={{ antialias: false }}>
        <FrameDriver running={running} />
        <Suspense fallback={null}>
          <Puff />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Dither
            gridSize={1}
            pixelSizeRatio={DITHER_BLOCK}
            grayscaleOnly
            shade={1}
            shadeColor="#dcd6d2"
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default FooterCloud;
