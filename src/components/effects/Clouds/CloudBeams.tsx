import { type RefObject, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import type { Mesh, ShaderMaterial, Texture, Vector2 } from "three";

import type { CloudCut } from "./hooks/useCloudCut";
import beamsFragmentShader from "./shaders/beams.fragment.glsl?raw";
import fullscreenVertexShader from "./shaders/fullscreen.vertex.glsl?raw";

export type CloudBeamsProps = {
  /** Removed cloud, as drawn by <Clouds openings> */
  openings: Texture;
  /** Sun position in screen uv, updated in place by the caller */
  sunPosition: Vector2;
  /** Longest beam as a fraction of the canvas height. Default: 0.45 */
  length?: number;
  /** Brightness of the beams. Default: 6 */
  strength?: number;
  /** Cut field behind the openings. The beams are skipped while it is clear. */
  cutRef?: RefObject<CloudCut>;
};

/** Full-screen layer of sunlight shining through openings cut in the clouds */
export function CloudBeams({
  openings,
  sunPosition,
  length = 0.45,
  strength = 6,
  cutRef,
}: CloudBeamsProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  // Initial values only. Each frame sets the current ones.
  const [uniforms] = useState(() => ({
    uOpenings: { value: null },
    uSun: { value: null },
    uAspect: { value: 1 },
    uLength: { value: 0 },
    uStrength: { value: 0 },
  }));

  useFrame(({ size }) => {
    if (!meshRef.current || !materialRef.current) return;
    meshRef.current.visible = cutRef?.current.active ?? true;
    const uniforms = materialRef.current.uniforms;
    uniforms.uOpenings.value = openings;
    uniforms.uSun.value = sunPosition;
    uniforms.uAspect.value = size.width / size.height;
    uniforms.uLength.value = length;
    uniforms.uStrength.value = strength;
  });

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={fullscreenVertexShader}
        fragmentShader={beamsFragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
